/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Modelli di pagina (template)

   Un modello è un documento JSON dichiarativo: descrive i campi del
   form, come raggrupparli e — soprattutto — come trasformarli nel
   markdown che il sito pubblico già sa rendere.

   · `fields`      campi della pagina (frontespizio, intro…)
   · `collections` elenchi di schede ripetute (divinità, regole…)
   · `item`        intestazione + sezioni di ogni scheda

   La forma è validata con zod e poi controllata in `assertIntegrity()`:
   ogni blocco deve riferire un campo che esiste davvero. Così un
   modello importato da JSON non può produrre una UI vuota o un
   markdown con placeholder irrisolti.
   ════════════════════════════════════════════════════════════════ */

import { z } from 'zod'

export const FIELD_TYPES = ['text', 'markdown', 'select', 'image', 'tags', 'number', 'boolean', 'url'] as const
export type FieldType = (typeof FIELD_TYPES)[number]

export const fieldSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*$/, 'chiave campo non valida (a-z, 0-9, _)'),
    label: z.string().min(1),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    help: z.string().optional(),
    options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    rows: z.number().int().min(2).max(40).optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.enum(['slug', 'page-key', 'url']).optional(),
    default: z.string().optional(),
    unit: z.string().optional()
  })
  .superRefine((field, ctx) => {
    if (field.type === 'select' && !field.options?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `il campo select «${field.key}» richiede options`,
        path: ['options']
      })
    }
  })

export type TemplateField = z.infer<typeof fieldSchema>

const blockSchema = z.discriminatedUnion('kind', [
  /* Markdown libero: il valore finisce nel documento così com'è. */
  z.object({ kind: z.literal('markdown'), field: z.string() }),
  /* Citazione: ogni riga diventa `> riga`. */
  z.object({ kind: z.literal('quote'), field: z.string() }),
  /* Immagine: il campo contiene il percorso, `posField` il ritaglio x,y. */
  z.object({
    kind: z.literal('image'),
    field: z.string(),
    altField: z.string().optional(),
    posField: z.string().optional()
  }),
  /* Elenco `- **Etichetta:** valore`: la forma letta dai renderer del sito
     (e il segnale che accende il badge bozza sui campi vuoti). */
  z.object({ kind: z.literal('definition'), fields: z.array(z.string()).min(1) }),
  /* Array di stringhe → elenco puntato, con etichetta in grassetto opzionale
     ("**Eccezioni:**" + voci) per restare dentro lo stesso blocco del sito. */
  z.object({ kind: z.literal('bullets'), field: z.string(), label: z.string().optional() })
])

export type TemplateBlock = z.infer<typeof blockSchema>

const sectionSchema = z.object({
  heading: z.string().optional(),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  blocks: z.array(blockSchema).min(1)
})

export type TemplateSection = z.infer<typeof sectionSchema>

const itemSchema = z.object({
  /* Titolo della scheda con segnaposto: "{nome}", "Regola {numero} — {titolo}" */
  heading: z.string().min(1),
  level: z.number().int().min(1).max(3),
  titleField: z.string(),
  sections: z.array(sectionSchema).min(1)
})

export type TemplateItem = z.infer<typeof itemSchema>

const collectionSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/, 'chiave collezione non valida'),
  label: z.string().min(1),
  singular: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
  item: itemSchema,
  min: z.number().int().min(0).optional(),
  max: z.number().int().positive().optional()
})

export type TemplateCollection = z.infer<typeof collectionSchema>

const templateSchema = z.object({
  version: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
  /* Layout del sito con cui viene reso il markdown compilato. */
  layout: z.string(),
  page: z.object({
    title: z.string().optional(),
    fields: z.array(fieldSchema),
    sections: z.array(sectionSchema)
  }),
  collections: z.array(collectionSchema),
  /* Separatore tra schede: `hr` = `---` (pantheon, regole, lavoro),
     `none` per i layout che si dividono sui titoli `##` (lore). */
  separator: z.enum(['hr', 'none']).optional()
})

export type PageTemplate = z.infer<typeof templateSchema>

export class TemplateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateError'
  }
}

/** Tutte le chiavi di campo riferibili da una sezione. */
export function blockFieldKeys(section: TemplateSection): string[] {
  const keys: string[] = []
  for (const block of section.blocks) {
    if (block.kind === 'definition') {
      keys.push(...block.fields)
      continue
    }
    keys.push(block.field)
    if (block.kind === 'image') {
      if (block.altField) keys.push(block.altField)
      if (block.posField) keys.push(block.posField)
    }
  }
  return keys
}

/** Segnaposto `{campo}` dentro un titolo di scheda. */
export function headingPlaceholders(heading: string): string[] {
  return Array.from(heading.matchAll(/\{([a-z][a-z0-9_]*)\}/g)).map((m) => m[1])
}

/** Controllo di coerenza: i riferimenti dei blocchi devono esistere. */
export function assertIntegrity(template: PageTemplate): void {
  const pageKeys = new Set(template.page.fields.map((f) => f.key))
  const check = (keys: string[], available: Set<string>, where: string) => {
    for (const key of keys) {
      if (!available.has(key)) throw new TemplateError(`${where}: il campo «${key}» non è dichiarato`)
    }
  }

  for (const section of template.page.sections) check(blockFieldKeys(section), pageKeys, `pagina ${template.id}`)

  for (const collection of template.collections) {
    const keys = new Set(collection.fields.map((f) => f.key))
    check(
      [...headingPlaceholders(collection.item.heading), collection.item.titleField],
      keys,
      `${template.id}/${collection.key}`
    )
    for (const section of collection.item.sections) {
      check(blockFieldKeys(section), keys, `${template.id}/${collection.key}`)
    }
  }
}

/** Valida un modello (JSON importato o file built-in) e ne verifica i riferimenti. */
export function parseTemplate(raw: unknown): PageTemplate {
  const result = templateSchema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    throw new TemplateError(first ? `${first.path.join('.') || 'modello'}: ${first.message}` : 'modello non valido')
  }
  assertIntegrity(result.data)
  return result.data
}

/* ─────────────── Dati compilati ─────────────── */

export type FieldValue = string | number | boolean | string[] | null | undefined

export interface TemplateData {
  fields: Record<string, FieldValue>
  collections: Record<string, Array<Record<string, FieldValue>>>
}

export function defaultFieldValue(field: TemplateField): FieldValue {
  if (field.type === 'tags') return field.default ? field.default.split(',').map((s) => s.trim()) : []
  if (field.type === 'boolean') return field.default === 'true'
  return field.default ?? ''
}

export function emptyRecord(fields: TemplateField[]): Record<string, FieldValue> {
  const record: Record<string, FieldValue> = {}
  for (const field of fields) record[field.key] = defaultFieldValue(field)
  return record
}

/** Dati iniziali vuoti, coerenti con la forma del modello. */
export function emptyTemplateData(template: PageTemplate): TemplateData {
  const collections: TemplateData['collections'] = {}
  for (const collection of template.collections) collections[collection.key] = []
  return { fields: emptyRecord(template.page.fields), collections }
}

/* ─────────────── Percorsi dei campi ───────────────
   Un solo formato per validazione, cronologia e stato "in lavorazione":
     fields.intro
     collections.entita.2.personalita                */

export interface FieldPath {
  scope: 'fields' | 'collections'
  collection?: string
  index?: number
  key: string
}

export function pageFieldPath(key: string): string {
  return `fields.${key}`
}

export function itemFieldPath(collection: string, index: number, key: string): string {
  return `collections.${collection}.${index}.${key}`
}

export function parseFieldPath(path: string): FieldPath | null {
  const parts = path.split('.')
  if (parts[0] === 'fields' && parts.length === 2) return { scope: 'fields', key: parts[1] }
  if (parts[0] === 'collections' && parts.length === 4) {
    const index = Number(parts[2])
    if (!Number.isInteger(index) || index < 0) return null
    return { scope: 'collections', collection: parts[1], index, key: parts[3] }
  }
  return null
}

export function getValueAtPath(data: TemplateData, path: string): FieldValue {
  const parsed = parseFieldPath(path)
  if (!parsed) return undefined
  if (parsed.scope === 'fields') return data.fields[parsed.key]
  return data.collections[parsed.collection!]?.[parsed.index!]?.[parsed.key]
}

/** Copia immutabile: il chiamante decide quando pubblicare il nuovo stato. */
export function setValueAtPath(data: TemplateData, path: string, value: FieldValue): TemplateData {
  const parsed = parseFieldPath(path)
  if (!parsed) return data
  if (parsed.scope === 'fields') {
    return { ...data, fields: { ...data.fields, [parsed.key]: value } }
  }
  const items = data.collections[parsed.collection!] || []
  if (parsed.index! >= items.length) return data
  const next = items.map((item, i) => (i === parsed.index ? { ...item, [parsed.key]: value } : item))
  return { ...data, collections: { ...data.collections, [parsed.collection!]: next } }
}
