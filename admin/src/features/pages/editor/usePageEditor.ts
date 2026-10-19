/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Stato dell'editor di pagina

   Un solo posto per: caricamento, dati del modello, compilazione live,
   validazione, cronologia, salvataggio e autosave. Le viste restano
   presentazionali; qui c'è il comportamento verificabile.
   ════════════════════════════════════════════════════════════════ */

import { computed, onBeforeUnmount, shallowRef, ref, watch } from 'vue'

import { errorText, pagesApi, registryApi } from '@/shared/api'
import { ApiError } from '@/shared/api/http'
import type { PageContent } from '@/types'
import type { PageRegistryEntry } from '@/types'
import { confirmAction } from '@/shared/confirm'
import { useAuthStore, useEditorStore, useRegistryStore, useUIStore } from '@/app/store'
import {
  applyAction,
  canRunAction,
  findAction,
  isPublic,
  sameWorkflow,
  statusOf,
  validateSchedule,
  workflowChip,
  workflowFields,
  type WorkflowActionId
} from '../workflow'
import { compileTemplate, isBlank } from '../templates/compile'
import { getTemplate } from '../templates'
import { seedFromMarkdown } from '../templates/seed'
import {
  emptyRecord,
  emptyTemplateData,
  setValueAtPath,
  type FieldValue,
  type PageTemplate,
  type TemplateData
} from '../templates/schema'
import { validateTemplateData } from '../templates/validate'
import { canRedo, canUndo, createHistory, record, redo, shouldCoalesce, undo, type HistoryState } from './history'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function snapshot(value: TemplateData | null): TemplateData | null {
  return value ? (JSON.parse(JSON.stringify(value)) as TemplateData) : null
}

export function usePageEditor() {
  const editor = useEditorStore()
  const ui = useUIStore()
  const auth = useAuthStore()
  const registry = useRegistryStore()

  const loading = ref(false)
  const saveState = ref<SaveState>('idle')
  const firstError = ref<string | null>(null)
  const historyState = shallowRef<HistoryState<TemplateData | null>>(createHistory(null))
  let lastPath: string | null = null
  let lastAt = 0
  let autosaveTimer: ReturnType<typeof setInterval> | null = null

  const page = computed(() => editor.currentPage)
  const template = computed<PageTemplate | undefined>(() => getTemplate(page.value?.template))
  const templateMissing = computed(() => Boolean(page.value?.template) && !template.value)
  const data = computed<TemplateData | null>(() => {
    if (!template.value) return null
    return page.value?.templateData ?? emptyTemplateData(template.value)
  })
  const drafts = computed<string[]>(() => page.value?.draftFields || [])

  const compiled = computed(() => {
    if (!template.value) return null
    return compileTemplate(template.value, data.value ?? emptyTemplateData(template.value), drafts.value)
  })

  /** Ciò che vede il sito: markdown compilato o testo libero. */
  const markdown = computed(() => (template.value ? (compiled.value?.markdown ?? '') : (page.value?.content ?? '')))

  const validation = computed(() => {
    if (!template.value || !data.value) return { issues: [], errors: [], warnings: [] }
    return validateTemplateData(template.value, data.value, drafts.value)
  })

  const stats = computed(() => {
    const text = markdown.value
    const chars = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const filled = compiled.value?.filled ?? 0
    const total = compiled.value?.total ?? 0
    return { chars, words, filled, total, drafts: drafts.value.length }
  })

  const dirty = computed(() => editor.hasUnsavedChanges)
  const undoAvailable = computed(() => canUndo(historyState.value))
  const redoAvailable = computed(() => canRedo(historyState.value))

  /* Flusso di pubblicazione: lo stato vive sulla pagina, l'etichetta e le
     azioni dipendono da ruolo e orologio. */
  const workflowStatus = computed(() => statusOf(page.value))
  const workflowLabel = computed(() => workflowChip(page.value))
  const isPublicPage = computed(() => isPublic(page.value))

  function resetHistory(): void {
    historyState.value = createHistory(snapshot(data.value))
    lastPath = null
    lastAt = 0
  }

  async function load(key: string): Promise<void> {
    loading.value = true
    try {
      const loaded = await pagesApi.get(key)
      if (loaded.template) {
        const found = getTemplate(loaded.template)
        if (found && !loaded.templateData) loaded.templateData = emptyTemplateData(found)
      }
      editor.setPage(loaded)
      /* Le pagine libere si aprono nei blocchi ("struttura" senza modello):
         il markdown resta a un click, con il testo già sincronizzato. */
      editor.setMode('structure')
      resetHistory()
      saveState.value = 'idle'
      firstError.value = null
    } catch (e) {
      ui.toast('Errore apertura pagina: ' + errorText(e), 'error')
    } finally {
      loading.value = false
    }
  }

  function commit(next: TemplateData, path: string): void {
    const previous = snapshot(data.value)
    if (!previous) return
    const now = Date.now()
    if (shouldCoalesce(lastPath, path, lastAt, now)) {
      historyState.value = { ...historyState.value, present: snapshot(next), future: [] }
    } else {
      historyState.value = record(historyState.value, snapshot(next))
    }
    lastPath = path
    lastAt = now
    editor.setTemplateData(next)
    if (saveState.value === 'saved') saveState.value = 'idle'
  }

  function setField(path: string, value: FieldValue): void {
    if (!data.value) return
    commit(setValueAtPath(data.value, path, value), path)
  }

  function toggleDraft(path: string): void {
    const set = new Set(drafts.value)
    if (set.has(path)) set.delete(path)
    else set.add(path)
    editor.setDraftFields([...set])
  }

  function reindexDraftPaths(collection: string, map: (index: number) => number | undefined): void {
    const prefix = `collections.${collection}.`
    const next: string[] = []
    for (const path of drafts.value) {
      if (!path.startsWith(prefix)) {
        next.push(path)
        continue
      }
      const rest = path.slice(prefix.length).split('.')
      const target = map(Number(rest[0]))
      if (target === undefined) continue
      next.push(prefix + [target, ...rest.slice(1)].join('.'))
    }
    editor.setDraftFields(next)
  }

  function addItem(collectionKey: string): void {
    const collection = template.value?.collections.find((candidate) => candidate.key === collectionKey)
    if (!collection || !data.value) return
    if (collection.max !== undefined && (data.value.collections[collectionKey] || []).length >= collection.max) {
      ui.toast(`Massimo ${collection.max} schede per ${collection.label.toLowerCase()}`, 'warning')
      return
    }
    const items = data.value.collections[collectionKey] || []
    commit(
      {
        ...data.value,
        collections: { ...data.value.collections, [collectionKey]: [...items, emptyRecord(collection.fields)] }
      },
      `add:${collectionKey}`
    )
  }

  async function removeItem(collectionKey: string, index: number): Promise<boolean> {
    const collection = template.value?.collections.find((candidate) => candidate.key === collectionKey)
    const items = data.value?.collections[collectionKey] || []
    const target = items[index]
    if (!collection || !data.value || !target) return false

    if (collection.fields.some((field) => !isBlank(target[field.key]))) {
      const ok = await confirmAction({
        title: `Elimina ${collection.singular}`,
        message: `Eliminare «${collection.fields.find((f) => f.key === collection.item.titleField) ? target[collection.item.titleField] || collection.singular : collection.singular}»?`,
        detail: 'La scheda viene rimossa dalla pagina al prossimo salvataggio.',
        confirmLabel: 'Elimina scheda',
        danger: true
      })
      if (!ok) return false
    }

    const next = items.filter((_, i) => i !== index)
    commit(
      { ...data.value, collections: { ...data.value.collections, [collectionKey]: next } },
      `remove:${collectionKey}`
    )
    reindexDraftPaths(collectionKey, (current) => {
      if (current === index) return undefined
      return current > index ? current - 1 : current
    })
    return true
  }

  function moveItem(collectionKey: string, from: number, to: number): void {
    const items = data.value?.collections[collectionKey] || []
    if (!data.value || to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(
      { ...data.value, collections: { ...data.value.collections, [collectionKey]: next } },
      `move:${collectionKey}`
    )
    reindexDraftPaths(collectionKey, (current) => {
      if (current === from) return to
      if (from < to && current > from && current <= to) return current - 1
      if (from > to && current >= to && current < from) return current + 1
      return current
    })
  }

  function undoEdit(): void {
    if (!undoAvailable.value) return
    historyState.value = undo(historyState.value)
    editor.setTemplateData(snapshot(historyState.value.present) ?? undefined)
    lastPath = null
  }

  function redoEdit(): void {
    if (!redoAvailable.value) return
    historyState.value = redo(historyState.value)
    editor.setTemplateData(snapshot(historyState.value.present) ?? undefined)
    lastPath = null
  }

  /** Applica un modello: importa il testo esistente invece di azzerarlo. */
  async function applyTemplate(templateId: string): Promise<boolean> {
    const next = getTemplate(templateId)
    if (!next || !page.value) {
      ui.toast('Modello non trovato', 'error')
      return false
    }
    if (page.value.template && page.value.templateData) {
      const ok = await confirmAction({
        title: 'Cambia modello',
        message: `Sostituire i campi attuali con il modello «${next.label}»?`,
        detail:
          'Il testo compilato viene reimportato nei campi del nuovo modello, ma i dati strutturati precedenti vengono sostituiti.',
        confirmLabel: 'Cambia modello'
      })
      if (!ok) return false
    }

    const existing = (page.value.content || '').trim()
    const seeded = existing ? seedFromMarkdown(next, page.value.content) : null
    const seededData = seeded?.data ?? emptyTemplateData(next)

    editor.setMetadata({ template: next.id, templateData: seededData, layout: next.layout, draftFields: [] })
    editor.setContent(compileTemplate(next, seededData, []).markdown)
    editor.setMode('structure')
    resetHistory()
    firstError.value = null

    if (seeded?.imported) {
      ui.toast(`${seeded.imported} schede importate nel modello «${next.label}»`, 'success')
    } else if (existing) {
      ui.toast(`Modello applicato: il testo è rimasto nell'introduzione`, 'info')
    } else {
      ui.toast(`Modello «${next.label}» pronto`, 'success')
    }
    if (seeded?.notes.length) ui.toast(seeded.notes.join(' '), 'warning', { title: 'Import parziale' })
    return true
  }

  function removeTemplate(): void {
    editor.setMetadata({ template: undefined, templateData: undefined, draftFields: undefined })
    editor.setMode('markdown')
    resetHistory()
    ui.toast('Modello rimosso: la pagina resta come markdown', 'info')
  }

  /** Cambio modalità: il markdown manuale va reimportato nella struttura. */
  async function setMode(next: 'structure' | 'markdown'): Promise<boolean> {
    if (!page.value) return false
    if (next === 'markdown') {
      if (template.value) editor.setContent(compiled.value?.markdown ?? page.value.content)
      editor.setMode('markdown')
      return true
    }
    if (!page.value.template || !template.value) {
      /* Nessun modello: la vista Struttura mostra lo stato vuoto con il
         pulsante «Scegli un modello». Bloccare lo switch con un toast
         lasciava il pulsante di scoperta irraggiungibile. */
      editor.setMode('structure')
      return true
    }
    if (page.value.templateData) {
      const current = (page.value.content || '').trim()
      const expected = (compiled.value?.markdown ?? '').trim()
      if (current !== expected) {
        const ok = await confirmAction({
          title: 'Markdown modificato a mano',
          message: 'Reimportare il testo nei campi del modello?',
          detail:
            'La struttura viene ricostruita dal markdown corrente; ciò che non è riconosciuto resta fuori dai campi.',
          confirmLabel: 'Reimporta'
        })
        if (!ok) return false
        const seeded = seedFromMarkdown(template.value, page.value.content)
        editor.setTemplateData(seeded.data)
        editor.setDraftFields([])
        resetHistory()
        if (seeded.notes.length) ui.toast(seeded.notes.join(' '), 'warning', { title: 'Import parziale' })
      }
    }
    editor.setMode('structure')
    return true
  }

  async function save(options: { silent?: boolean } = {}): Promise<boolean> {
    if (!page.value || editor.saving) return false

    if (template.value) {
      const errors = validation.value.errors
      if (errors.length) {
        firstError.value = errors[0].path
        saveState.value = 'error'
        ui.toast(
          `${errors.length} ${errors.length === 1 ? 'campo da correggere' : 'campi da correggere'} prima di salvare`,
          'error',
          {
            title: 'Salvataggio bloccato'
          }
        )
        return false
      }
      editor.setContent(compiled.value?.markdown ?? '')
    }

    editor.saving = true
    saveState.value = 'saving'
    firstError.value = null
    try {
      const payload = { ...page.value, lastModified: new Date().toISOString() }
      let sha: string
      try {
        sha = (await pagesApi.save(payload, `admin: update page ${payload.k}`)).sha
      } catch (e) {
        /* SHA non più valido: qualcun altro ha salvato nel frattempo. */
        if (!isShaConflict(e)) throw e
        const retried = await resolveConflict(payload)
        if (!retried) {
          saveState.value = 'error'
          return false
        }
        sha = retried
      }
      editor.setPage({ ...payload, sha })
      await syncRegistryWorkflow()
      saveState.value = 'saved'
      if (!options.silent) ui.toast('Pagina salvata — deploy in corso (~30s)', 'success')
      return true
    } catch (e) {
      saveState.value = 'error'
      ui.toast('Errore salvataggio: ' + errorText(e), 'error')
      return false
    } finally {
      editor.saving = false
    }
  }

  /** GitHub risponde 422 quando lo SHA non è più quello corrente. */
  function isShaConflict(e: unknown): boolean {
    if (e instanceof ApiError) {
      if (e.status === 422 || e.status === 409) return true
      return /\bsha\b|conflitto|conflict|version/i.test(e.message)
    }
    return /\bsha\b|conflitto|conflict/i.test(e instanceof Error ? e.message : String(e))
  }

  /** Salva la copia locale nel browser e propone la sovrascrittura. */
  function backupConflict(payload: PageContent): void {
    try {
      localStorage.setItem(
        `arcamis-conflict-${payload.k}`,
        JSON.stringify({ date: new Date().toISOString(), page: payload })
      )
    } catch {
      /* storage pieno: il conflitto resta comunque gestibile a mano */
    }
  }

  /**
   * Risolve un salvataggio in conflitto: ricarica la versione remota per
   * lo SHA fresco e, solo con conferma esplicita, riprova con i contenuti
   * locali. Ritorna lo SHA salvato oppure null se l'utente annulla.
   */
  async function resolveConflict(payload: PageContent): Promise<string | null> {
    let remote: PageContent
    try {
      remote = await pagesApi.get(payload.k)
    } catch {
      ui.toast('Conflitto di salvataggio e pagina remota non leggibile: riprova', 'error')
      return null
    }
    backupConflict(payload)
    const remoteWhen = remote.lastModified ? new Date(remote.lastModified).toLocaleString('it-IT') : 'sconosciuta'
    const ok = await confirmAction({
      title: 'Modifica concorrente',
      message: `«${payload.title || payload.k}» è stata modificata da un altro editor (remota: ${remoteWhen}).`,
      detail:
        'La tua copia è al sicuro nel browser. Sovrascrivere la versione remota con la tua, o annullare e confrontare a mano?',
      confirmLabel: 'Sovrascrivi con la mia',
      cancelLabel: 'Annulla',
      danger: true
    })
    if (!ok) {
      ui.toast('Salvataggio annullato: la tua bozza resta aperta', 'warning')
      return null
    }
    payload.sha = remote.sha
    const result = await pagesApi.save(payload, `admin: resolve conflict ${payload.k}`)
    return result.sha
  }

  /**
   * Ripristina una versione (cronologia o snapshot) in memoria: i campi
   * tornano quelli dello snapshot, lo SHA resta quello corrente così il
   * salvataggio funziona e risulta come modifica da salvare.
   */
  function restoreVersion(snapshot: PageContent): void {
    const current = page.value
    if (!current) return
    const { sha: _sha, lastModified: _lastModified, k: _k, ...rest } = snapshot
    Object.assign(current, rest)
    resetHistory()
    saveState.value = 'idle'
    firstError.value = null
    ui.toast('Versione ripristinata in memoria — salva per applicarla', 'warning', { title: 'Cronologia' })
  }

  function updateMeta(updates: Record<string, unknown>): void {
    editor.setMetadata(updates)
    if (saveState.value === 'saved') saveState.value = 'idle'
  }

  /**
   * Esegue un'azione del flusso (revisione, approvazione, programmazione,
   * pubblicazione). Le azioni che rendono pubblica la pagina si fermano
   * finché la validazione trova errori: pubblicare un campo obbligatorio
   * vuoto manderebbe online un segnaposto.
   */
  function runWorkflowAction(id: WorkflowActionId, options: { publishAt?: string; note?: string } = {}): boolean {
    const current = page.value
    if (!current) return false
    const action = findAction(id)
    if (!action) return false
    if (!canRunAction(auth.role, statusOf(current), id)) {
      ui.toast(`Il tuo ruolo non può «${action.label.toLowerCase()}»`, 'error')
      return false
    }
    if (id === 'schedule') {
      const problem = validateSchedule(options.publishAt)
      if (problem) {
        ui.toast(problem.message, 'error')
        return false
      }
    }
    if ((id === 'publish' || id === 'approve') && validation.value.errors.length) {
      ui.toast(
        `${validation.value.errors.length} camp${validation.value.errors.length === 1 ? 'o' : 'i'} da correggere prima di pubblicare`,
        'error',
        { title: 'Pubblicazione bloccata' }
      )
      return false
    }

    const result = applyAction(id, current, {
      actor: auth.user || undefined,
      publishAt: options.publishAt,
      note: options.note
    })
    editor.setMetadata({
      status: result.status,
      publishAt: result.publishAt,
      isDraft: result.isDraft,
      review: result.review
    })
    if (saveState.value === 'saved') saveState.value = 'idle'
    if (result.message) ui.toast(result.message, 'success')
    return true
  }

  /** Il registro è la voce di menu del sito: se il flusso cambia, va allineato. */
  async function syncRegistryWorkflow(): Promise<void> {
    const current = page.value
    if (!current) return
    /* Aprendo l'editor da un link diretto il registro può non essere mai
       stato caricato: senza questo, la voce di menu resterebbe indietro. */
    if (!registry.pages.length) {
      try {
        const doc = await registryApi.get()
        registry.setRegistry(doc.pages as PageRegistryEntry[], doc.sections || [], doc.ui)
      } catch (e) {
        ui.toast('Stato salvato sulla pagina, ma il registro non è leggibile: ' + errorText(e), 'warning')
        return
      }
    }
    const entry = registry.pages.find((candidate) => candidate.k === current.k)
    if (!entry || sameWorkflow(entry, current)) return
    const previous = workflowFields(entry)
    Object.assign(entry, workflowFields(current))
    try {
      await registryApi.save(registry.pages)
      registry.clearDirty()
    } catch (e) {
      /* Il file della pagina è salvato; qui si perde solo la voce di menu. */
      Object.assign(entry, previous)
      ui.toast('Stato salvato sulla pagina, ma il registro non è stato aggiornato: ' + errorText(e), 'warning')
    }
  }

  /* In modalità struttura il markdown pubblicato è sempre quello compilato:
     resta allineato per anteprima, salvataggio e passaggio a markdown. */
  watch(compiled, (value) => {
    if (value && page.value && !editor.saving) editor.setContent(value.markdown)
  })

  function startAutosave(): void {
    stopAutosave()
    autosaveTimer = setInterval(() => {
      if (editor.autosaveEnabled && editor.hasUnsavedChanges && !editor.saving && !validation.value.errors.length) {
        void save({ silent: true })
      }
    }, 15000)
  }

  function stopAutosave(): void {
    if (autosaveTimer) clearInterval(autosaveTimer)
    autosaveTimer = null
  }

  onBeforeUnmount(stopAutosave)

  return {
    loading,
    saveState,
    firstError,
    page,
    template,
    templateMissing,
    data,
    drafts,
    compiled,
    markdown,
    validation,
    stats,
    dirty,
    undoAvailable,
    redoAvailable,
    workflowStatus,
    workflowLabel,
    isPublicPage,
    runWorkflowAction,
    load,
    setField,
    toggleDraft,
    addItem,
    removeItem,
    moveItem,
    undo: undoEdit,
    redo: redoEdit,
    applyTemplate,
    removeTemplate,
    setMode,
    save,
    restoreVersion,
    updateMeta,
    startAutosave,
    stopAutosave
  }
}
