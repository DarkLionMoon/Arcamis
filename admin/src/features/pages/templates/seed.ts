/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Import del markdown esistente

   Applicare un modello a una pagina già scritta non deve ricominciare
   da zero. Questo modulo è un parser "best effort" delle forme che il
   sito già usa:

     - schede separate da `---`
     - titoli `# Nome` / `## Regola N — Titolo`
     - immagini `![alt](/images/x.jpg#50,50)`
     - righe `- **Etichetta:** valore`
     - blocchi `**Eccezioni:**` con elenchi puntati
     - citazioni `> …`

   Non inventa contenuto: ciò che non riconosce resta fuori e viene
   segnalato in `notes`, così l'utente lo ritrova nel markdown libero.
   ════════════════════════════════════════════════════════════════ */

import { isBlank } from './compile'
import { emptyRecord, type FieldValue, type PageTemplate, type TemplateData, type TemplateField } from './schema'

export interface SeedResult {
  data: TemplateData
  notes: string[]
  /** Schede riconosciute e importate. */
  imported: number
}

interface ParsedSection {
  heading: string
  body: string
}

interface ParsedItem {
  heading: string
  image: string
  pos: string
  quote: string
  labels: Map<string, string>
  tagBlocks: Map<string, string[]>
  preamble: string
  sections: ParsedSection[]
}

const LABEL_BULLET = /^[-*]\s+\*\*(.+?)\*\*\s*:?\s*(.*)$/
const STANDALONE_LABEL = /^\*\*(.+?)\*\*\s*:?\s*$/
const BULLET = /^[-*]\s+(.+)$/

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** `"Regola {numero} — {titolo}"` → `^Regola (.+?) — (.+?)$` con i nomi delle chiavi. */
export function headingPattern(heading: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = []
  let pattern = ''
  let index = 0
  for (const match of heading.matchAll(/\{([a-z][a-z0-9_]*)\}/g)) {
    pattern += escapeRegExp(heading.slice(index, match.index))
    pattern += '(.+?)'
    keys.push(match[1])
    index = match.index + match[0].length
  }
  pattern += escapeRegExp(heading.slice(index))
  return { regex: new RegExp(`^${pattern}$`, 'i'), keys }
}

function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[:*]+$/g, '')
    .trim()
    .toLowerCase()
}

function fieldByLabel(fields: TemplateField[], label: string): TemplateField | undefined {
  const wanted = normalizeLabel(label)
  return fields.find((field) => normalizeLabel(field.label) === wanted)
}

function normalizeValue(field: TemplateField, raw: string): FieldValue {
  const value = raw.trim()
  if (field.type === 'tags') {
    return value
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (field.type === 'number') {
    const digits = value.match(/\d+/)
    return digits ? Number(digits[0]) : value
  }
  if (field.type === 'select') {
    const match = field.options?.find((option) => normalizeLabel(option.value) === normalizeLabel(value))
    return match ? match.value : value
  }
  return value
}

function parseItem(block: string, level: number): ParsedItem | null {
  const lines = block.split('\n')
  const headingPrefix = new RegExp(`^#{${level}}\\s+`)
  let heading = ''
  let image = ''
  let pos = ''
  let quote = ''
  const labels = new Map<string, string>()
  const tagBlocks = new Map<string, string[]>()
  const body: string[] = []
  let activeTag: string | null = null

  for (const line of lines) {
    if (!heading && headingPrefix.test(line)) {
      heading = line.replace(/^#+\s+/, '').trim()
      continue
    }

    const img = line.match(/^!\[[^\]]*\]\(([^)]+)\)/)
    if (img && !image) {
      const raw = img[1].trim()
      const posMatch = raw.match(/#(\d{1,3})[.,](\d{1,3})$/)
      if (posMatch) {
        image = raw.slice(0, posMatch.index)
        pos = `${posMatch[1]},${posMatch[2]}`
      } else {
        image = raw
      }
      continue
    }

    if (/^>\s?/.test(line)) {
      const text = line.replace(/^>\s?/, '').trim()
      if (text) quote = quote ? `${quote}\n${text}` : text
      continue
    }

    const labelLine = line.match(LABEL_BULLET)
    if (labelLine) {
      labels.set(normalizeLabel(labelLine[1]), labelLine[2].trim())
      activeTag = null
      continue
    }

    const standalone = line.match(STANDALONE_LABEL)
    if (standalone) {
      activeTag = normalizeLabel(standalone[1])
      if (!tagBlocks.has(activeTag)) tagBlocks.set(activeTag, [])
      continue
    }

    if (activeTag) {
      const bullet = line.match(BULLET)
      if (bullet) {
        tagBlocks.get(activeTag)!.push(bullet[1].trim())
        continue
      }
      if (!line.trim()) continue
      activeTag = null
    }

    body.push(line)
  }

  if (!heading) return null

  /* Corpo → sezioni `## …` / `### …` */
  const preamble: string[] = []
  const sections: ParsedSection[] = []
  let current: ParsedSection | null = null
  for (const line of body) {
    const headingMatch = line.match(/^#{2,4}\s+(.+)$/)
    if (headingMatch) {
      current = { heading: headingMatch[1].trim(), body: '' }
      sections.push(current)
      continue
    }
    if (current) current.body += (current.body ? '\n' : '') + line
    else preamble.push(line)
  }

  return {
    heading,
    image,
    pos,
    quote,
    labels,
    tagBlocks,
    preamble: preamble.join('\n').trim(),
    sections: sections.map((section) => ({ heading: section.heading, body: section.body.trim() }))
  }
}

function sameHeading(a: string, b: string): boolean {
  return normalizeLabel(a) === normalizeLabel(b)
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
}

function fillItem(template: PageTemplate, collectionIndex: number, parsed: ParsedItem): Record<string, FieldValue> {
  const collection = template.collections[collectionIndex]
  const record = emptyRecord(collection.fields)
  const titleShape = headingPattern(collection.item.heading)
  const titleMatch = parsed.heading.match(titleShape.regex)
  if (titleMatch) {
    titleShape.keys.forEach((key, index) => {
      const field = collection.fields.find((candidate) => candidate.key === key)
      if (field) record[key] = normalizeValue(field, titleMatch[index + 1])
    })
  } else {
    record[collection.item.titleField] = parsed.heading
  }

  for (const [label, value] of parsed.labels) {
    const field = fieldByLabel(collection.fields, label)
    /* Il titolo della scheda resta quello dell'intestazione: è da lì che il
       sito ricava lo slug della sottopagina, e rinominarlo cambierebbe l'URL. */
    if (field && value && field.key !== collection.item.titleField) record[field.key] = normalizeValue(field, value)
  }

  for (const [label, items] of parsed.tagBlocks) {
    const field = fieldByLabel(collection.fields, label)
    if (field && items.length) record[field.key] = field.type === 'tags' ? items : items.join(', ')
  }

  if (parsed.image) {
    const imageBlock = collection.item.sections
      .flatMap((section) => section.blocks)
      .find((block) => block.kind === 'image')
    if (imageBlock && imageBlock.kind === 'image') {
      record[imageBlock.field] = parsed.image
      if (imageBlock.posField && parsed.pos) record[imageBlock.posField] = parsed.pos
    }
  }

  for (const section of collection.item.sections) {
    const source = section.heading
      ? parsed.sections.find((candidate) => sameHeading(candidate.heading, section.heading!))
      : { heading: '', body: parsed.preamble }
    const body = source ? cleanMarkdown(source.body) : ''
    for (const block of section.blocks) {
      if (block.kind === 'quote' && parsed.quote && isBlank(record[block.field])) {
        record[block.field] = parsed.quote
        continue
      }
      if (block.kind === 'markdown' && body) {
        const field = collection.fields.find((candidate) => candidate.key === block.field)
        if (field && isBlank(record[field.key])) record[field.key] = body
      }
      if (block.kind === 'bullets' && body) {
        const field = collection.fields.find((candidate) => candidate.key === block.field)
        const items = body
          .split('\n')
          .filter((line) => BULLET.test(line))
          .map((line) => line.replace(BULLET, '$1').trim())
        if (field && items.length && isBlank(record[field.key])) record[field.key] = items
      }
    }
  }

  return record
}

function splitHead(markdown: string, template: PageTemplate): { head: string; blocks: string[] } {
  const normalized = markdown.replace(/\r\n/g, '\n')

  if ((template.separator ?? 'hr') === 'none') {
    const parts = normalized.split(/^##\s+/m)
    const pageSections = new Set(
      template.page.sections
        .map((section) => (section.heading ? normalizeLabel(section.heading) : ''))
        .filter(Boolean)
    )
    let head = parts.shift() || ''
    const blocks: string[] = []
    for (const part of parts) {
      const firstLine = part.split('\n')[0]?.trim() || ''
      /* «Informazioni» è una sezione della pagina, non una scheda: i suoi
         bullet vanno letti come campi del frontespizio. */
      if (pageSections.has(normalizeLabel(firstLine))) head += `\n\n## ${part.trim()}`
      else blocks.push(`## ${part.trim()}`)
    }
    return { head, blocks }
  }

  const blocks = normalized.split(/\n[ \t]*---[ \t]*\n/).map((block) => block.trim())
  const first = blocks[0] || ''
  const level = template.collections[0]?.item.level ?? 1
  const firstHeading = first.match(new RegExp(`^#{${level}}\\s+(.+)$`, 'm'))
  const pageTitle = template.page.title ? normalizeLabel(template.page.title) : ''
  /* Il primo blocco è una scheda solo se apre con un titolo al livello delle
     schede e non è il titolo della pagina (es. "# Divinità" nel pantheon). */
  const looksLikeItem = Boolean(firstHeading && !(pageTitle && normalizeLabel(firstHeading[1]) === pageTitle))

  let head = looksLikeItem ? '' : blocks.shift() || ''

  /* Contenuti storici come pantheon.json aprono con un blocco «# Divinità»
     vuoto e poi ripetono il titolo sopra l'introduzione: entrambi sono
     frontespizio, non schede. */
  while (blocks.length) {
    const repeated = blocks[0].match(new RegExp(`^#{${level}}\\s+(.+)$`, 'm'))
    if (!repeated || !pageTitle || normalizeLabel(repeated[1]) !== pageTitle) break
    const body = blocks.shift()!.split('\n').slice(1).join('\n').trim()
    if (body) head += (head ? '\n\n' : '') + body
  }

  return { head, blocks }
}

/** Importa una pagina markdown esistente nei dati del modello. */
export function seedFromMarkdown(template: PageTemplate, markdown: string): SeedResult {
  const notes: string[] = []
  const data: TemplateData = { fields: emptyRecord(template.page.fields), collections: {} }
  for (const collection of template.collections) data.collections[collection.key] = []

  const { head, blocks } = splitHead(markdown || '', template)
  const headLines = head.split('\n').filter((line) => !/^#{1,6}\s+/.test(line))
  const headLabels = new Map<string, string>()
  const headText: string[] = []
  for (const line of headLines) {
    const label = line.match(LABEL_BULLET)
    if (label) headLabels.set(normalizeLabel(label[1]), label[2].trim())
    else headText.push(line)
  }

  for (const field of template.page.fields) {
    if (field.type !== 'markdown' && headLabels.has(normalizeLabel(field.label))) {
      data.fields[field.key] = normalizeValue(field, headLabels.get(normalizeLabel(field.label))!)
    }
  }

  const introField = template.page.fields.find((field) => field.type === 'markdown')
  const intro = cleanMarkdown(headText.join('\n'))
  if (introField && intro) data.fields[introField.key] = intro

  let imported = 0
  const collection = template.collections[0]
  const parsedItems = blocks
    .map((block) => parseItem(block, collection?.item.level ?? 1))
    .filter((item): item is ParsedItem => item !== null)

  if (collection) {
    data.collections[collection.key] = parsedItems.map((item) => fillItem(template, 0, item))
    imported = parsedItems.length
    if (!parsedItems.length && (blocks.length || head.trim())) {
      notes.push('Nessuna scheda riconosciuta: il testo è stato importato come introduzione.')
    }
    if (parsedItems.length < blocks.length) {
      notes.push(`${blocks.length - parsedItems.length} blocchi senza titolo riconoscibile sono stati ignorati.`)
    }
    if (template.collections.length > 1) {
      notes.push('Il modello ha più collezioni: solo la prima è stata popolata automaticamente.')
    }
  } else if (blocks.length) {
    notes.push('Il modello non ha collezioni: il resto del contenuto è rimasto nel markdown.')
  }

  return { data, notes, imported }
}
