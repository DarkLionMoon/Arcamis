/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Compilatore modelli → markdown

   Il sito pubblico non conosce i modelli: legge `content/pages/*.json`
   e rende il campo `content` con i renderer di `notion-nav.js`. Quindi
   il compilatore produce ESATTAMENTE le forme che quei renderer si
   aspettano:

     pantheon → blocchi `# Nome`, immagine, `- **Epiteto:**`, `---`
     regole   → blocchi `## Regola N — Titolo`, `---`
     lore     → sezioni `## Titolo`
     lavoro   → primo blocco `# Titolo`, poi `## Nome`, `---`

   Regola d'oro: i campi vuoti NON spariscono in silenzio. Un campo
   obbligatorio (o marcato "in lavorazione") lascia un segnaposto che
   il sito riconosce già come bozza (`_isDraftMd`), così la scheda
   mostra il badge senza rompere il layout.
   ════════════════════════════════════════════════════════════════ */

import {
  emptyTemplateData,
  itemFieldPath,
  pageFieldPath,
  type FieldValue,
  type PageTemplate,
  type TemplateBlock,
  type TemplateCollection,
  type TemplateData,
  type TemplateField,
  type TemplateSection
} from './schema'

/** Segnaposto riconosciuto dal sito (`_DRAFT_MARKERS` in notion-nav.js). */
export const BLANK_MARKER = 'Da scrivere'

export interface CompileResult {
  markdown: string
  /** Percorsi dei campi vuoti (compresi i segnaposto). */
  blanks: string[]
  /** Sottoinsieme di `blanks` marcato esplicitamente "in lavorazione". */
  drafts: string[]
  filled: number
  total: number
}

const LIST_SEPARATOR = '\n\n---\n\n'
const SOFT_SEPARATOR = '\n\n'

export function isBlank(value: FieldValue): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.every((item) => String(item).trim() === '')
  return false
}

/** Valore di un campo come testo inline (grassetto, elenchi, didascalie). */
export function formatFieldValue(field: TemplateField, value: FieldValue): string {
  if (field.type === 'tags') {
    const list = Array.isArray(value) ? value : String(value ?? '').split(',')
    return list
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(', ')
  }
  if (field.type === 'boolean') return value === true || value === 'true' ? 'Sì' : 'No'
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

/** `{nome}` / `{numero}` dentro i titoli delle schede. */
export function interpolateHeading(
  heading: string,
  fields: TemplateField[],
  record: Record<string, FieldValue>
): string {
  const rendered = heading.replace(/\{([a-z][a-z0-9_]*)\}/g, (_, key: string) => {
    const field = fields.find((candidate) => candidate.key === key)
    return field ? formatFieldValue(field, record[key]) : ''
  })
  return rendered
    .replace(/\s+/g, ' ')
    .replace(/^[\s—–-]+|[\s—–-]+$/g, '')
    .trim()
}

function fieldOf(fields: TemplateField[], key: string): TemplateField {
  const field = fields.find((candidate) => candidate.key === key)
  /* assertIntegrity() impedisce che accada; il fallback evita un crash
     se un modello arriva da localStorage dopo un cambio di schema. */
  return field ?? { key, label: key, type: 'text' }
}

/** Un `---` dentro una scheda la spezzerebbe in due: lo si rende come `***`. */
function escapeSeparators(markdown: string): string {
  return markdown.replace(/^[ \t]*---[ \t]*$/gm, '***')
}

/** Segnala i titoli scritti a mano che spezzerebbero la scheda. */
export function unsafeHeadings(markdown: string, maxLevel: number): number {
  const pattern = new RegExp(`^\\s*#{1,${Math.max(1, maxLevel)}}\\s+`, 'gm')
  return (markdown.match(pattern) || []).length
}

interface RenderCtx {
  draftPaths: Set<string>
}

function isDraftField(ctx: RenderCtx, path: string, field: TemplateField): boolean {
  return Boolean(field.required) || ctx.draftPaths.has(path)
}

function renderBlock(
  block: TemplateBlock,
  fields: TemplateField[],
  record: Record<string, FieldValue>,
  basePath: (key: string) => string,
  ctx: RenderCtx,
  inItem: boolean
): string {
  switch (block.kind) {
    case 'markdown': {
      const field = fieldOf(fields, block.field)
      const value = formatFieldValue(field, record[block.field])
      if (!value) return isDraftField(ctx, basePath(block.field), field) ? BLANK_MARKER : ''
      return inItem ? escapeSeparators(value) : value
    }
    case 'quote': {
      const field = fieldOf(fields, block.field)
      const value = formatFieldValue(field, record[block.field])
      if (!value) return ''
      return value
        .split('\n')
        .map((line) => '> ' + line.trim())
        .join('\n')
    }
    case 'image': {
      const path = formatFieldValue(fieldOf(fields, block.field), record[block.field])
      if (!path) return ''
      const alt = block.altField ? formatFieldValue(fieldOf(fields, block.altField), record[block.altField]) : ''
      const pos = block.posField ? formatFieldValue(fieldOf(fields, block.posField), record[block.posField]) : ''
      const suffix = pos && !path.includes('#') ? `#${pos.replace(/[^\d.,]/g, '')}` : ''
      return `![${alt || 'immagine'}](${path}${suffix})`
    }
    case 'definition': {
      /* L'etichetta resta anche col valore vuoto: il renderer del sito la
         riconosce (`_isDraftMd`) e accende il badge «Bozza». Se però l'autore
         ha marcato il campo «in lavorazione», il segnaposto lo dice anche a
         chi legge, invece di lasciare una riga senza valore. */
      return block.fields
        .map((key) => {
          const field = fieldOf(fields, key)
          const value = formatFieldValue(field, record[key])
          if (value) return `- **${field.label}:** ${value}`
          const explicitDraft = ctx.draftPaths.has(basePath(key))
          return `- **${field.label}:**${explicitDraft ? ' ' + BLANK_MARKER : ''}`
        })
        .join('\n')
    }
    case 'bullets': {
      const field = fieldOf(fields, block.field)
      const raw = record[block.field]
      const items = (Array.isArray(raw) ? raw : String(raw ?? '').split(','))
        .map((item) => String(item).trim())
        .filter(Boolean)
      if (!items.length) {
        if (!isDraftField(ctx, basePath(block.field), field)) return ''
        return block.label ? `**${block.label}:** ${BLANK_MARKER}` : `- ${BLANK_MARKER}`
      }
      const list = items.map((item) => `- ${item}`).join('\n')
      return block.label ? `**${block.label}:**\n${list}` : list
    }
    default:
      return ''
  }
}

function renderSection(
  section: TemplateSection,
  fields: TemplateField[],
  record: Record<string, FieldValue>,
  basePath: (key: string) => string,
  ctx: RenderCtx,
  inItem: boolean
): string {
  const body = section.blocks
    .map((block) => renderBlock(block, fields, record, basePath, ctx, inItem))
    .filter((text) => text.trim().length > 0)
    .join('\n\n')
  if (!body) return ''
  if (!section.heading) return body
  const level = section.level ?? 2
  return `${'#'.repeat(level)} ${section.heading}\n\n${body}`
}

function isRecordBlank(fields: TemplateField[], record: Record<string, FieldValue>): boolean {
  return fields.every((field) => isBlank(record[field.key]))
}

function countRecord(
  fields: TemplateField[],
  record: Record<string, FieldValue>,
  basePath: (key: string) => string,
  draftPaths: Set<string>,
  result: CompileResult
): void {
  for (const field of fields) {
    result.total++
    const path = basePath(field.key)
    if (!isBlank(record[field.key])) {
      result.filled++
      continue
    }
    result.blanks.push(path)
    if (draftPaths.has(path)) result.drafts.push(path)
  }
}

function renderItem(
  collection: TemplateCollection,
  record: Record<string, FieldValue>,
  index: number,
  ctx: RenderCtx
): string {
  const basePath = (key: string) => itemFieldPath(collection.key, index, key)
  const title = interpolateHeading(collection.item.heading, collection.fields, record)
  const heading = `${'#'.repeat(collection.item.level)} ${title || `${collection.singular} ${index + 1}`}`
  const body = collection.item.sections
    .map((section) => renderSection(section, collection.fields, record, basePath, ctx, true))
    .filter(Boolean)
    .join('\n\n')
  return [heading, body].filter(Boolean).join('\n\n')
}

/**
 * Compila i dati strutturati nel markdown pubblicato.
 * `draftPaths` sono i campi marcati "in lavorazione" nell'editor.
 */
export function compileTemplate(
  template: PageTemplate,
  data: TemplateData = emptyTemplateData(template),
  draftPaths: string[] = []
): CompileResult {
  const result: CompileResult = { markdown: '', blanks: [], drafts: [], filled: 0, total: 0 }
  const ctx: RenderCtx = { draftPaths: new Set(draftPaths) }

  const headParts: string[] = []
  if (template.page.title) headParts.push(`# ${template.page.title}`)

  const pageBase = (key: string) => pageFieldPath(key)
  countRecord(template.page.fields, data.fields, pageBase, ctx.draftPaths, result)
  for (const section of template.page.sections) {
    const rendered = renderSection(section, template.page.fields, data.fields, pageBase, ctx, false)
    if (rendered) headParts.push(rendered)
  }

  const chunks: string[] = []
  const head = headParts.filter(Boolean).join('\n\n')
  if (head) chunks.push(head)

  for (const collection of template.collections) {
    const items = data.collections[collection.key] || []
    items.forEach((record, index) => {
      countRecord(collection.fields, record, (key) => itemFieldPath(collection.key, index, key), ctx.draftPaths, result)
      if (isRecordBlank(collection.fields, record)) return
      chunks.push(renderItem(collection, record, index, ctx))
    })
  }

  const separator = (template.separator ?? 'hr') === 'hr' ? LIST_SEPARATOR : SOFT_SEPARATOR
  result.markdown = chunks
    .join(separator)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return result
}

/** Comodità per la UI: numero di campi compilati. */
export function filledRatio(result: CompileResult): number {
  if (!result.total) return 1
  return result.filled / result.total
}
