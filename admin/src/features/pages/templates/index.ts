/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Registro dei modelli

   I modelli built-in vivono in `definitions/*.json`: sono la fonte di
   verità, non codice. Qui vengono validati una volta e resi disponibili
   all'editor. I modelli personalizzati (importati come JSON dall'utente)
   restano in localStorage e passano la stessa validazione.
   ════════════════════════════════════════════════════════════════ */

import creatura from './definitions/creatura.json'
import cronologia from './definitions/cronologia.json'
import divinita from './definitions/divinita.json'
import fazione from './definitions/fazione.json'
import lore from './definitions/lore.json'
import luogo from './definitions/luogo.json'
import mestiere from './definitions/mestiere.json'
import npc from './definitions/npc.json'
import oggetto from './definitions/oggetto.json'
import regola from './definitions/regola.json'
import sessione from './definitions/sessione.json'
import { parseTemplate, TemplateError, type PageTemplate } from './schema'

export const CUSTOM_TEMPLATES_KEY = 'arcamis.custom-templates'

/** Modelli di authoring per gli scopi editoriali del sito. */
export const BUILT_IN_TEMPLATES: readonly PageTemplate[] = [
  divinita,
  regola,
  lore,
  mestiere,
  luogo,
  fazione,
  npc,
  creatura,
  oggetto,
  sessione,
  cronologia
].map((raw) => parseTemplate(raw))

/* `getTemplate` è chiamato a ogni compilazione (ogni battitura): la
   lettura di localStorage va fatta una volta sola, non per campo. */
let customCache: PageTemplate[] | null = null

function customTemplates(): PageTemplate[] {
  if (!customCache) customCache = loadCustomTemplates()
  return customCache
}

export function getTemplate(id: string | null | undefined): PageTemplate | undefined {
  if (!id) return undefined
  return (
    BUILT_IN_TEMPLATES.find((template) => template.id === id) ??
    customTemplates().find((template) => template.id === id)
  )
}

/** Solo i built-in: usato quando un modello salvato non deve sparire dai dati. */
export function getBuiltInTemplate(id: string | null | undefined): PageTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((template) => template.id === id)
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    /* Safari in modalità privata può lanciare sull'accesso. */
    return null
  }
}

/** Modelli importati dall'utente; un JSON rotto viene ignorato, non blocca l'editor. */
export function loadCustomTemplates(): PageTemplate[] {
  const raw = storage()?.getItem(CUSTOM_TEMPLATES_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const templates: PageTemplate[] = []
    for (const candidate of parsed) {
      try {
        templates.push(parseTemplate(candidate))
      } catch {
        /* voce corrotta: la saltiamo */
      }
    }
    return templates
  } catch {
    return []
  }
}

export function saveCustomTemplates(templates: PageTemplate[]): void {
  storage()?.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates))
}

export function allTemplates(): PageTemplate[] {
  return [...BUILT_IN_TEMPLATES, ...customTemplates()]
}

/** Import da testo JSON: messaggi leggibili invece di un `<pre>` di zod. */
export function importTemplateText(text: string): PageTemplate {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    throw new TemplateError('JSON non valido: ' + (e instanceof Error ? e.message : String(e)))
  }
  const template = parseTemplate(raw)
  if (BUILT_IN_TEMPLATES.some((builtin) => builtin.id === template.id)) {
    throw new TemplateError(`l'id «${template.id}» è già usato da un modello built-in`)
  }
  const custom = customTemplates()
  if (custom.some((existing) => existing.id === template.id)) {
    throw new TemplateError(`esiste già un modello personalizzato con id «${template.id}»`)
  }
  customCache = [...custom, template]
  saveCustomTemplates(customCache)
  return template
}

export function removeCustomTemplate(id: string): void {
  saveCustomTemplates(loadCustomTemplates().filter((template) => template.id !== id))
  customCache = null
}

export { parseTemplate, TemplateError } from './schema'
export type { PageTemplate } from './schema'
