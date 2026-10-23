/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Pantheon strutturato

   Il Pantheon è una pagina markdown unica: ogni divinità è un blocco
   `# Nome` separato da `---`. Questo modulo riconosce la forma canonica
   (immagine, citazione, Identità, Personalità, Culto) e la riscrive
   senza toccare le sezioni speciali (Aspetti, Demoni, Culti, Note),
   che restano blocchi grezzi preservati alla lettera.

   Il parser è deliberatamente conservativo: se un blocco non ha la
   forma attesa non viene interpretato, così l'editor non può perdere
   testo che non sa rappresentare.
   ════════════════════════════════════════════════════════════════ */

export interface PantheonField {
  label: string
  value: string
}

export interface PantheonEntity {
  kind: 'entity'
  id: string
  name: string
  image: string
  position: string
  quote: string
  identity: PantheonField[]
  personality: string
  cult: PantheonField[]
}

export interface PantheonRaw {
  kind: 'raw'
  id: string
  raw: string
}

export type PantheonPart = PantheonEntity | PantheonRaw

export interface PantheonDoc {
  intro: string
  parts: PantheonPart[]
}

const FIELD_LINE = /^[-*]\s+\*\*(.+?):\*\*\s*(.*)$/
const HEADING = /^##\s+(.+)$/
const IMAGE = /^!\[[^\]]*\]\(([^)]+)\)\s*$/

const IDENTITY_LABELS = ['Nome', 'Epiteto', 'Allineamento', 'Sfere', 'Simbolo']
const CULT_LABELS = ['Tempio', 'Rituali', 'Seguaci']

function splitImage(raw: string): { image: string; position: string } {
  const pos = raw.match(/#(\d{1,3}[.,]\d{1,3})$/)
  if (!pos) return { image: raw, position: '' }
  return { image: raw.slice(0, pos.index), position: pos[1].replace(',', ',') }
}

function fieldsFrom(lines: string[]): { fields: PantheonField[]; extra: string[] } {
  const fields: PantheonField[] = []
  const extra: string[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const match = line.match(FIELD_LINE)
    if (match) fields.push({ label: match[1].trim(), value: match[2].trim() })
    else extra.push(line)
  }
  return { fields, extra }
}

function parseEntity(block: string, index: number): PantheonEntity | null {
  if (!/^#\s+/.test(block) || !block.includes('## Identità')) return null

  const lines = block.split('\n')
  let name = ''
  let image = ''
  let position = ''
  let quote = ''
  const sections = new Map<string, string[]>()
  let active: string | null = null

  for (const line of lines) {
    if (!name) {
      const title = line.match(/^#\s+(.+)$/)
      if (title) {
        name = title[1].trim()
        continue
      }
    }
    const imageLine = line.match(IMAGE)
    if (imageLine && !image) {
      const parsed = splitImage(imageLine[1].trim())
      image = parsed.image
      position = parsed.position
      continue
    }
    if (/^>\s?/.test(line)) {
      const text = line.replace(/^>\s?/, '').trim()
      if (text) quote = quote ? `${quote}\n${text}` : text
      continue
    }
    const heading = line.match(HEADING)
    if (heading) {
      active = heading[1].trim()
      if (!sections.has(active)) sections.set(active, [])
      continue
    }
    if (active) sections.get(active)!.push(line)
  }

  if (!name || !sections.has('Identità')) return null

  const identity = fieldsFrom(sections.get('Identità') || [])
  const personality = (sections.get('Personalità') || []).join('\n').trim()
  const cult = fieldsFrom(sections.get('Culto') || [])

  /* Se il blocco contiene righe o sezioni fuori dalla forma canonica,
     lo lasciamo grezzo: meglio non strutturato che perdere contenuto. */
  const unknownSections = [...sections.keys()].filter((key) => !['Identità', 'Personalità', 'Culto'].includes(key))
  if (identity.extra.length || cult.extra.length || unknownSections.length) return null

  const byLabel = (fields: PantheonField[], label: string) =>
    fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || ''
  const canonicalName = byLabel(identity.fields, 'Nome') || name

  return {
    kind: 'entity',
    id: `entity-${index}-${canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: canonicalName,
    image,
    position,
    quote,
    identity: identity.fields.length
      ? identity.fields
      : IDENTITY_LABELS.map((label) => ({ label, value: label === 'Nome' ? canonicalName : '' })),
    personality,
    cult: cult.fields.length ? cult.fields : CULT_LABELS.map((label) => ({ label, value: '' }))
  }
}

export function parsePantheon(markdown: string): PantheonDoc {
  const chunks = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split(/\n[ \t]*---[ \t]*\n/)
  const intro = (chunks.shift() || '').trim()
  const parts: PantheonPart[] = []

  chunks.forEach((chunk, index) => {
    const block = chunk.trim()
    if (!block) return
    const entity = parseEntity(block, index)
    parts.push(entity ?? { kind: 'raw', id: `raw-${index}`, raw: block })
  })

  return { intro, parts }
}

function fieldValue(fields: PantheonField[], label: string): string {
  return fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value || ''
}

function setField(fields: PantheonField[], label: string, value: string): PantheonField[] {
  const existing = fields.findIndex((field) => field.label.toLowerCase() === label.toLowerCase())
  if (existing === -1) return [...fields, { label, value }]
  return fields.map((field, index) => (index === existing ? { ...field, value } : field))
}

export function serializeEntity(entity: PantheonEntity): string {
  const name = fieldValue(entity.identity, 'Nome').trim() || entity.name
  const out = [`# ${name}`]

  if (entity.image.trim()) {
    const suffix = entity.position.trim() ? `#${entity.position.trim()}` : ''
    out.push(`![${name}](${entity.image.trim()}${suffix})`)
  }
  if (entity.quote.trim()) {
    out.push(
      entity.quote
        .trim()
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    )
  }

  const identity = entity.identity.length ? entity.identity : IDENTITY_LABELS.map((label) => ({ label, value: '' }))
  const identityBody = identity
    .map((field) => `- **${field.label}:**${field.value ? ' ' + field.value : ''}`)
    .join('\n')
  out.push(`## Identità\n\n${identityBody}`)

  if (entity.personality.trim()) out.push(`## Personalità\n\n${entity.personality.trim()}`)

  const cult = entity.cult.length ? entity.cult : CULT_LABELS.map((label) => ({ label, value: '' }))
  out.push(
    `## Culto\n\n${cult.map((field) => `- **${field.label}:**${field.value ? ' ' + field.value : ''}`).join('\n')}`
  )

  return out.join('\n\n')
}

export function serializePantheon(doc: PantheonDoc): string {
  return [
    doc.intro.trim(),
    ...doc.parts.map((part) => (part.kind === 'entity' ? serializeEntity(part) : part.raw.trim()))
  ]
    .filter(Boolean)
    .join('\n\n---\n\n')
    .trim()
}

export function createEntity(name: string, id = `entity-new-${Date.now().toString(36)}`): PantheonEntity {
  return {
    kind: 'entity',
    id,
    name,
    image: '',
    position: '',
    quote: '',
    identity: IDENTITY_LABELS.map((label) => ({ label, value: label === 'Nome' ? name : '' })),
    personality: '',
    cult: CULT_LABELS.map((label) => ({ label, value: '' }))
  }
}

/* Helper usati dal form: ogni modifica restituisce una nuova entità,
   così Vue rileva il cambiamento e il markdown viene riserializzato. */
export function updateEntity(
  entity: PantheonEntity,
  patch: { name?: string; image?: string; position?: string; quote?: string; personality?: string }
): PantheonEntity {
  const next = { ...entity, ...patch }
  if (patch.name !== undefined) {
    next.identity = setField(next.identity, 'Nome', patch.name)
    next.name = patch.name
  }
  return next
}

export function updateField(
  entity: PantheonEntity,
  section: 'identity' | 'cult',
  label: string,
  value: string
): PantheonEntity {
  return { ...entity, [section]: setField(entity[section], label, value) }
}
