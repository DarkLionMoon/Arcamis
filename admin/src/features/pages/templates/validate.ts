/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Validazione dei dati di un modello

   Tre livelli:
     · error   blocca il salvataggio (obbligatori, formati, duplicati)
     · warning non blocca, ma spiega cosa il sito non renderà bene
     · vuoti   campi non compilati: non sono errori, sono il lavoro che
               resta. L'editor li mostra come "da completare" e il sito
               li trasforma nel badge bozza.

   Nessun errore viene lanciato: la funzione è pura e viene ricalcolata
   a ogni battitura, quindi deve essere tollerante a dati parziali.
   ════════════════════════════════════════════════════════════════ */

import { formatFieldValue, isBlank, unsafeHeadings } from './compile'
import {
  itemFieldPath,
  pageFieldPath,
  type FieldValue,
  type PageTemplate,
  type TemplateData,
  type TemplateField
} from './schema'

export type IssueSeverity = 'error' | 'warning'

export interface ValidationIssue {
  /** Percorso del campo (`fields.intro`, `collections.regole.0.corpo`) o ''. */
  path: string
  label: string
  message: string
  severity: IssueSeverity
}

export interface ValidationResult {
  issues: ValidationIssue[]
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const URL_RE = /^(https?:\/\/|\/)[^\s]*$/
const IMAGE_RE = /^(\/|https?:\/\/)[^\s]*$/
const SEPARATOR_RE = /^[ \t]*---[ \t]*$/m

function text(value: FieldValue): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === undefined || value === null) return ''
  return String(value)
}

function checkField(field: TemplateField, value: FieldValue, path: string, issues: ValidationIssue[]): void {
  const blank = isBlank(value)
  const rendered = formatFieldValue(field, value)

  if (blank) {
    if (field.required) {
      issues.push({ path, label: field.label, message: 'campo obbligatorio', severity: 'error' })
    }
    return
  }

  if (field.maxLength && rendered.length > field.maxLength) {
    issues.push({
      path,
      label: field.label,
      message: `testo troppo lungo (${rendered.length}/${field.maxLength} caratteri)`,
      severity: 'error'
    })
  }

  if (field.type === 'number' && !/^\d+$/.test(text(value).trim())) {
    issues.push({ path, label: field.label, message: 'deve essere un numero intero', severity: 'error' })
  }

  if (field.pattern === 'slug' && !SLUG_RE.test(rendered)) {
    issues.push({
      path,
      label: field.label,
      message: 'usa solo minuscole, numeri e trattini (es. «la-criofenice»)',
      severity: 'error'
    })
  }

  if (field.pattern === 'page-key' && !SLUG_RE.test(rendered)) {
    issues.push({ path, label: field.label, message: 'la chiave deve essere uno slug valido', severity: 'error' })
  }

  if (field.pattern === 'url' && !URL_RE.test(rendered)) {
    issues.push({ path, label: field.label, message: 'URL non valido: usa /percorso o https://…', severity: 'error' })
  }

  if (field.type === 'image' && !IMAGE_RE.test(rendered)) {
    issues.push({
      path,
      label: field.label,
      message: 'percorso immagine non valido: scegli dalla libreria o usa /images/…',
      severity: 'error'
    })
  }

  if (field.type === 'select' && field.options?.length) {
    const allowed = field.options.map((option) => option.value)
    if (!allowed.includes(text(value))) {
      issues.push({
        path,
        label: field.label,
        message: `«${text(value)}» non è tra le opzioni del modello`,
        severity: 'warning'
      })
    }
  }
}

/** Campi markdown che, scritti con titoli troppo alti, spezzerebbero la scheda. */
function checkHeadings(
  blockFieldKeys: string[],
  fields: TemplateField[],
  record: Record<string, FieldValue>,
  basePath: (key: string) => string,
  maxLevel: number,
  issues: ValidationIssue[]
): void {
  for (const key of blockFieldKeys) {
    const field = fields.find((candidate) => candidate.key === key)
    if (!field || field.type !== 'markdown') continue
    const value = record[key]
    if (isBlank(value)) continue
    const broken = unsafeHeadings(text(value), maxLevel)
    if (broken > 0) {
      issues.push({
        path: basePath(key),
        label: field.label,
        message: `contiene ${broken} titolo/i di livello troppo alto: spezzano la scheda, usa ### o lascia che il modello generi i titoli`,
        severity: 'warning'
      })
    }
  }
}

function checkSeparator(
  fields: TemplateField[],
  record: Record<string, FieldValue>,
  basePath: (key: string) => string,
  issues: ValidationIssue[]
): void {
  for (const field of fields) {
    if (field.type !== 'markdown') continue
    if (!SEPARATOR_RE.test(text(record[field.key]))) continue
    issues.push({
      path: basePath(field.key),
      label: field.label,
      message: 'una riga «---» divide le schede sul sito; qui diventa comunque «***»',
      severity: 'warning'
    })
  }
}

export function validateTemplateData(
  template: PageTemplate,
  data: TemplateData,
  draftPaths: string[] = []
): ValidationResult {
  const issues: ValidationIssue[] = []
  const drafts = new Set(draftPaths)

  /* Pagina */
  for (const field of template.page.fields) {
    const path = pageFieldPath(field.key)
    /* Un campo marcato "in lavorazione" è una scelta editoriale:
       resta vuoto, ma non è un errore da correggere. */
    if (drafts.has(path) && isBlank(data.fields[field.key])) continue
    checkField(field, data.fields[field.key], path, issues)
  }

  for (const collection of template.collections) {
    const items = data.collections[collection.key] || []
    const seen = new Map<string, number>()

    items.forEach((record, index) => {
      const basePath = (key: string) => itemFieldPath(collection.key, index, key)

      for (const field of collection.fields) {
        const path = basePath(field.key)
        if (drafts.has(path) && isBlank(record[field.key])) continue
        checkField(field, record[field.key], path, issues)
      }

      const titleField = collection.fields.find((field) => field.key === collection.item.titleField)
      const title = titleField ? formatFieldValue(titleField, record[titleField.key]).toLowerCase() : ''
      if (title) {
        const previous = seen.get(title)
        if (previous !== undefined) {
          issues.push({
            path: basePath(titleField!.key),
            label: titleField!.label,
            message: `duplicato: la scheda ${previous + 1} ha già questo valore`,
            severity: 'error'
          })
        } else {
          seen.set(title, index)
        }
      }

      const itemMarkdownKeys = collection.item.sections.flatMap((section) =>
        section.blocks.flatMap((block) => {
          if (block.kind === 'markdown') return [block.field]
          if (block.kind === 'bullets') return [block.field]
          return [] as string[]
        })
      )
      checkHeadings(itemMarkdownKeys, collection.fields, record, basePath, collection.item.level, issues)
      if ((template.separator ?? 'hr') === 'hr') {
        checkSeparator(collection.fields, record, basePath, issues)
      }
    })

    if (collection.min && items.length < collection.min) {
      issues.push({
        path: '',
        label: collection.label,
        message: `servono almeno ${collection.min} schede`,
        severity: 'warning'
      })
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  return { issues, errors, warnings }
}

/** Etichetta breve per la barra di stato. */
export function issueSummary(result: ValidationResult): string {
  const parts: string[] = []
  if (result.errors.length) parts.push(`${result.errors.length} error${result.errors.length === 1 ? 'e' : 'i'}`)
  if (result.warnings.length) parts.push(`${result.warnings.length} avvis${result.warnings.length === 1 ? 'o' : 'i'}`)
  return parts.join(' · ') || 'nessun problema'
}
