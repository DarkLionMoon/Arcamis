/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — Flusso di pubblicazione di una pagina

   Il badge «bozza» diventa uno stato dichiarato, salvato nell'JSON
   della pagina:

     draft      → in lavorazione, non pubblica
     review     → inviata in revisione, non pubblica
     scheduled  → pubblica da `publishAt`, non prima
     published  → pubblica

   Due regole governano tutto il resto:

     · `scheduled` scaduto vale `published`: la pagina è pubblica anche
       se la build non è ancora stata rifatta (`isDue` lo dice alla UI,
       così l'autore sa che serve un deploy per sitemap e prerender);
     · `scheduled` senza data valida non è programmabile: decade a
       `draft`. Meglio un errore visibile che una pagina che non esce
       mai o che esce subito.

   Le pagine storiche non hanno `status`: si continua a leggere
   `isDraft` e `publishAt`, quindi nulla va migrato a mano.

   Questo file è la specifica lato pannello. Il sito e la build hanno
   la stessa specifica in `scripts/js/page-status.js` e
   `scripts/lib/routes.mjs`: `scripts/__tests__/page-status.test.js`
   verifica che le tre implementazioni concordino, così non possono
   divergere in silenzio.
   ════════════════════════════════════════════════════════════════ */

import { PAGE_STATUSES, type PageReview, type PageStatus, type PageWorkflowFields, type UserRole } from '@/types'

export { PAGE_STATUSES }
export type { PageStatus }
/** Compatibilità con i nomi usati nell'editor. */
export type WorkflowReview = PageReview
export type WorkflowFields = PageWorkflowFields

export type WorkflowActionId = 'request-review' | 'approve' | 'publish' | 'schedule' | 'back-to-draft'

export interface WorkflowAction {
  id: WorkflowActionId
  label: string
  /** Ruolo minimo per eseguirla. */
  minRole: 'editor' | 'admin'
  to: PageStatus
  danger?: boolean
}

export interface StatusMeta {
  label: string
  /** Tono per la UI: riusa i token dei chip esistenti. */
  tone: 'neutral' | 'info' | 'warn' | 'good'
  hint: string
}

const META: Record<PageStatus, StatusMeta> = {
  draft: {
    label: 'Bozza',
    tone: 'neutral',
    hint: 'Non pubblica: la pagina non compare nel sito e il contenuto resta nel pannello.'
  },
  review: {
    label: 'In revisione',
    tone: 'warn',
    hint: 'Non pubblica: in attesa di approvazione da parte di un amministratore.'
  },
  scheduled: {
    label: 'Programmata',
    tone: 'info',
    hint: 'Diventa pubblica da sola alla data indicata; sitemap e prerender si allineano alla build successiva.'
  },
  published: {
    label: 'Pubblicata',
    tone: 'good',
    hint: 'Visibile nel sito pubblico.'
  }
}

const RANK: Record<PageStatus, number> = { draft: 0, review: 1, scheduled: 2, published: 3 }

export function statusMeta(status: PageStatus): StatusMeta {
  return META[status]
}

export function statusRank(status: PageStatus): number {
  return RANK[status]
}

export function isPageStatus(value: unknown): value is PageStatus {
  return typeof value === 'string' && (PAGE_STATUSES as readonly string[]).includes(value)
}

/** Data ISO valida (o `null`). */
export function parseWhen(value: string | undefined | null): number | null {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

/**
 * Stato dichiarato, senza guardare l'orologio.
 * `scheduled` senza data valida decade a `draft`: non è pubblicabile
 * "prima o poi", è lavoro da finire.
 */
export function declaredStatus(page: WorkflowFields | null | undefined): PageStatus {
  if (!page) return 'draft'
  if (page.status && isPageStatus(page.status)) {
    if (page.status === 'scheduled' && parseWhen(page.publishAt) === null) return 'draft'
    if (page.status === 'published' && page.isDraft === true) return 'draft'
    return page.status
  }
  /* Pagine storiche, senza `status`: `isDraft` decide. Una `publishAt`
     senza stato viene ignorata, come faceva il sito prima di questo
     flusso: una pagina già online non deve sparire perché qualcuno le
     ha scritto accanto una data. */
  if (page.isDraft === true) return 'draft'
  return 'published'
}

/** Stato effettivo: una programmata scaduta è pubblica. */
export function statusOf(page: WorkflowFields | null | undefined, now: number = Date.now()): PageStatus {
  const declared = declaredStatus(page)
  if (declared !== 'scheduled') return declared
  const when = parseWhen(page?.publishAt)
  if (when === null) return 'draft'
  return when <= now ? 'published' : 'scheduled'
}

export function isPublic(page: WorkflowFields | null | undefined, now: number = Date.now()): boolean {
  return statusOf(page, now) === 'published'
}

/**
 * Programmata e già scaduta: la pagina è pubblica, ma il dist (sitemap,
 * prerender, voce di menu) è rimasto indietro e va ricostruito.
 */
export function isDue(page: WorkflowFields | null | undefined, now: number = Date.now()): boolean {
  return declaredStatus(page) === 'scheduled' && statusOf(page, now) === 'published'
}

/** Giorni/mesi rimanenti alla pubblicazione, per il riepilogo leggibile. */
export function scheduleHint(page: WorkflowFields | null | undefined, now: number = Date.now()): string {
  const when = parseWhen(page?.publishAt)
  if (when === null) return ''
  const diff = when - now
  if (diff <= 0) return 'data raggiunta'
  const days = Math.ceil(diff / 86400000)
  if (days > 1) return `tra ${days} giorni`
  const hours = Math.ceil(diff / 3600000)
  return hours > 1 ? `tra ${hours} ore` : 'tra meno di un’ora'
}

/* ─────────────── Azioni e ruoli ───────────────
   Un editor prepara e chiede la revisione; approvare, programmare e
   pubblicare sono atti di un amministratore: sono le uniche azioni che
   cambiano ciò che vede il pubblico. */

/* L'ordine è quello con cui le azioni vengono proposte nella UI: prima
   ciò che fa avanzare la pagina, per ultima l'unica distruttiva. */
export const WORKFLOW_ACTIONS: readonly WorkflowAction[] = [
  { id: 'request-review', label: 'Invia in revisione', minRole: 'editor', to: 'review' },
  { id: 'approve', label: 'Approva e pubblica', minRole: 'admin', to: 'published' },
  { id: 'publish', label: 'Pubblica ora', minRole: 'admin', to: 'published' },
  { id: 'schedule', label: 'Programma', minRole: 'admin', to: 'scheduled' },
  { id: 'back-to-draft', label: 'Riporta in bozza', minRole: 'editor', to: 'draft', danger: true }
]

const ROLE_LEVEL: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2 }

export function roleSatisfies(role: UserRole, min: 'editor' | 'admin'): boolean {
  const needed = min === 'admin' ? 2 : 1
  return ROLE_LEVEL[role] >= needed
}

/** Azioni proponibili in uno stato, per ruolo. */
export function availableActions(role: UserRole, status: PageStatus): WorkflowAction[] {
  const allowed = WORKFLOW_ACTIONS.filter((action) => roleSatisfies(role, action.minRole))
  switch (status) {
    case 'draft':
      return allowed.filter((action) => action.id === 'request-review' || action.id === 'publish' || action.id === 'schedule')
    case 'review':
      return allowed.filter((action) => action.id === 'approve' || action.id === 'publish' || action.id === 'schedule' || action.id === 'back-to-draft')
    case 'scheduled':
      return allowed.filter((action) => action.id === 'publish' || action.id === 'back-to-draft')
    default:
      return allowed.filter((action) => action.id === 'back-to-draft')
  }
}

export function findAction(id: WorkflowActionId): WorkflowAction | undefined {
  return WORKFLOW_ACTIONS.find((action) => action.id === id)
}

/** L'azione è eseguibile? (ruolo giusto + azione prevista dallo stato) */
export function canRunAction(
  role: UserRole,
  status: PageStatus,
  id: WorkflowActionId
): boolean {
  return availableActions(role, status).some((action) => action.id === id)
}

export interface ApplyOptions {
  actor?: string
  /** Istante dell'azione in ISO; default: adesso. */
  at?: string
  note?: string
  /** Data di pubblicazione per `schedule`/`publish`. */
  publishAt?: string
}

export interface ApplyResult {
  status: PageStatus
  publishAt?: string
  isDraft: boolean
  review?: WorkflowReview
  /** Messaggio per il toast, con la stessa terminologia della UI. */
  message: string
}

/**
 * Nuovi campi del flusso dopo un'azione. È pura: chi la usa decide dove
 * scriverli (pagina, registro, entrambi).
 */
export function applyAction(
  action: WorkflowActionId,
  page: WorkflowFields | null | undefined,
  options: ApplyOptions = {}
): ApplyResult {
  const at = options.at || new Date().toISOString()
  const previous = page?.review ? { ...page.review } : {}
  const current = statusOf(page)
  const actor = options.actor

  switch (action) {
    case 'request-review':
      return {
        status: 'review',
        isDraft: true,
        publishAt: undefined,
        review: { ...previous, requestedBy: actor, requestedAt: at, note: options.note ?? previous.note },
        message: 'Pagina inviata in revisione'
      }
    case 'back-to-draft':
      return {
        status: 'draft',
        isDraft: true,
        publishAt: undefined,
        review: { ...previous, note: options.note ?? previous.note },
        message: current === 'scheduled' ? 'Programmazione annullata: la pagina è di nuovo in bozza' : 'Pagina riportata in bozza'
      }
    case 'approve':
      return {
        status: 'published',
        isDraft: false,
        publishAt: undefined,
        review: { ...previous, reviewedBy: actor, reviewedAt: at, note: options.note ?? previous.note },
        message: 'Revisione approvata: pagina pubblicata'
      }
    case 'publish':
      return {
        status: 'published',
        isDraft: false,
        publishAt: undefined,
        review: { ...previous, reviewedBy: actor ?? previous.reviewedBy, reviewedAt: at, note: options.note ?? previous.note },
        message: 'Pagina pubblicata'
      }
    case 'schedule':
      return {
        status: 'scheduled',
        isDraft: false,
        publishAt: options.publishAt,
        review: { ...previous, reviewedBy: actor ?? previous.reviewedBy, reviewedAt: at, note: options.note ?? previous.note },
        message: 'Pagina programmata'
      }
    default:
      return { status: current, isDraft: !isPublic(page), review: page?.review, message: '' }
  }
}

export interface ScheduleProblem {
  message: string
}

/** La data di programmazione deve esistere, essere valida e futura. */
export function validateSchedule(value: string | undefined | null, now: number = Date.now()): ScheduleProblem | null {
  const when = parseWhen(value)
  if (!value || when === null) return { message: 'Indica data e ora di pubblicazione' }
  // Un minuto di tolleranza: l'autore sceglie i minuti, non i secondi.
  if (when <= now - 60000) return { message: 'La data scelta è già passata: pubblica subito o scegline una futura' }
  return null
}

/* ─────────────── Conversioni per `<input type="datetime-local">` ─────────────── */

/** ISO → `YYYY-MM-DDTHH:mm` nell'ora locale (o '' se assente/non valida). */
export function toLocalInput(iso: string | undefined | null): string {
  const when = parseWhen(iso)
  if (when === null) return ''
  const date = new Date(when)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** `YYYY-MM-DDTHH:mm` (ora locale) → ISO UTC. */
export function fromLocalInput(value: string | undefined | null): string | undefined {
  if (!value) return undefined
  const time = Date.parse(value)
  return Number.isNaN(time) ? undefined : new Date(time).toISOString()
}

/** Formattazione leggibile della data programmata. */
export function formatWhen(iso: string | undefined | null): string {
  const when = parseWhen(iso)
  if (when === null) return ''
  return new Date(when).toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short' })
}

/* ─────────────── Ponte con il registro ed i dati salvati ─────────────── */

/** I soli campi del flusso, nell forma che il registro e il sito leggono. */
export function workflowFields(page: WorkflowFields | null | undefined): Required<Pick<WorkflowFields, 'status' | 'isDraft'>> &
  Pick<WorkflowFields, 'publishAt' | 'review'> {
  const status = declaredStatus(page)
  return {
    status,
    isDraft: status !== 'published',
    publishAt: page?.publishAt,
    review: page?.review
  }
}

/**
 * La revisione conta solo per i valori che ci sono davvero: `{}` e
 * `undefined` sono la stessa cosa, altrimenti ogni salvataggio
 * riscriverebbe il registro per una differenza che non esiste.
 */
function reviewFingerprint(review?: WorkflowReview): string {
  if (!review) return ''
  const entries = Object.entries(review)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
  return entries.length ? JSON.stringify(entries) : ''
}

/** Il flusso è già quello che si vuole scrivere? (evita PUT inutili sul registro) */
export function sameWorkflow(a: WorkflowFields | null | undefined, b: WorkflowFields | null | undefined): boolean {
  return (
    declaredStatus(a) === declaredStatus(b) &&
    (a?.publishAt ?? '') === (b?.publishAt ?? '') &&
    reviewFingerprint(a?.review) === reviewFingerprint(b?.review)
  )
}

/** Etichetta compatta per la barra di stato dell'editor. */
export function workflowChip(page: WorkflowFields | null | undefined, now: number = Date.now()): string {
  const status = statusOf(page, now)
  if (status === 'scheduled') return `${META.scheduled.label} · ${scheduleHint(page, now)}`
  if (status === 'published' && isDue(page, now)) return 'In pubblicazione: serve una build'
  return META[status].label
}
