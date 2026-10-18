import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

import { describe, expect, it, beforeAll } from 'vitest'

import {
  applyAction,
  availableActions,
  canRunAction,
  declaredStatus,
  findAction,
  formatWhen,
  fromLocalInput,
  isDue,
  isPageStatus,
  isPublic,
  roleSatisfies,
  sameWorkflow,
  scheduleHint,
  statusMeta,
  statusOf,
  statusRank,
  toLocalInput,
  validateSchedule,
  workflowChip,
  workflowFields
} from './workflow'

const NOW = Date.parse('2026-10-17T12:00:00.000Z')
const FUTURE = '2026-11-01T09:00:00.000Z'
const PAST = '2026-10-01T09:00:00.000Z'

describe('stato dichiarato', () => {
  it('legge le pagine storiche senza `status`', () => {
    expect(declaredStatus({ isDraft: true })).toBe('draft')
    expect(declaredStatus({})).toBe('published')
    expect(declaredStatus(null)).toBe('draft')
    /* Una data senza stato non nasconde una pagina già online. */
    expect(declaredStatus({ publishAt: FUTURE })).toBe('published')
  })

  it('rispetta lo stato dichiarato', () => {
    expect(declaredStatus({ status: 'draft' })).toBe('draft')
    expect(declaredStatus({ status: 'review' })).toBe('review')
    expect(declaredStatus({ status: 'scheduled', publishAt: FUTURE })).toBe('scheduled')
    expect(declaredStatus({ status: 'published' })).toBe('published')
  })

  it('una programmata senza data non è programmabile: torna bozza', () => {
    expect(declaredStatus({ status: 'scheduled' })).toBe('draft')
    expect(declaredStatus({ status: 'scheduled', publishAt: 'non-una-data' })).toBe('draft')
  })

  it('dati incoerenti non pubblicano per sbaglio', () => {
    /* `isDraft` residuo su una pagina dichiarata pubblica: vince la bozza. */
    expect(declaredStatus({ status: 'published', isDraft: true })).toBe('draft')
  })

  it('riconosce solo gli stati previsti', () => {
    expect(isPageStatus('review')).toBe(true)
    expect(isPageStatus('archiviata')).toBe(false)
    expect(isPageStatus(undefined)).toBe(false)
  })
})

describe('stato effettivo e visibilità', () => {
  it('una programmata futura non è pubblica', () => {
    const page = { status: 'scheduled' as const, publishAt: FUTURE }
    expect(statusOf(page, NOW)).toBe('scheduled')
    expect(isPublic(page, NOW)).toBe(false)
    expect(isDue(page, NOW)).toBe(false)
  })

  it('una programmata scaduta è pubblica e da ricostruire', () => {
    const page = { status: 'scheduled' as const, publishAt: PAST }
    expect(statusOf(page, NOW)).toBe('published')
    expect(isPublic(page, NOW)).toBe(true)
    expect(isDue(page, NOW)).toBe(true)
  })

  it('solo `published` è pubblico', () => {
    expect(isPublic({ status: 'draft' }, NOW)).toBe(false)
    expect(isPublic({ status: 'review' }, NOW)).toBe(false)
    expect(isPublic({ status: 'published' }, NOW)).toBe(true)
  })

  it('il riepilogo della programmazione è leggibile', () => {
    expect(scheduleHint({ status: 'scheduled', publishAt: PAST }, NOW)).toBe('data raggiunta')
    expect(scheduleHint({ status: 'scheduled', publishAt: FUTURE }, NOW)).toBe('tra 15 giorni')
    expect(scheduleHint({ status: 'scheduled', publishAt: '2026-10-17T18:00:00.000Z' }, NOW)).toBe('tra 6 ore')
    expect(scheduleHint({ status: 'scheduled', publishAt: '2026-10-17T12:30:00.000Z' }, NOW)).toBe('tra meno di un’ora')
    expect(scheduleHint({}, NOW)).toBe('')
  })

  it('la barra di stato distingue la programmata e quella da ricostruire', () => {
    expect(workflowChip({ status: 'scheduled', publishAt: FUTURE }, NOW)).toBe('Programmata · tra 15 giorni')
    expect(workflowChip({ status: 'scheduled', publishAt: PAST }, NOW)).toBe('In pubblicazione: serve una build')
    expect(workflowChip({ status: 'review' }, NOW)).toBe('In revisione')
    expect(workflowChip({ isDraft: true }, NOW)).toBe('Bozza')
  })

  it('ordina gli stati dal più acerbo al pubblico', () => {
    expect(statusRank('draft')).toBeLessThan(statusRank('review'))
    expect(statusRank('review')).toBeLessThan(statusRank('scheduled'))
    expect(statusRank('scheduled')).toBeLessThan(statusRank('published'))
    expect(statusMeta('scheduled').tone).toBe('info')
    expect(statusMeta('published').tone).toBe('good')
  })
})

describe('revisione e ruoli', () => {
  it('un editor prepara e chiede la revisione, ma non approva', () => {
    const draft = availableActions('editor', 'draft').map((action) => action.id)
    expect(draft).toContain('request-review')
    expect(draft).not.toContain('approve')
    expect(draft).not.toContain('publish')
    expect(canRunAction('editor', 'draft', 'request-review')).toBe(true)
    expect(canRunAction('editor', 'draft', 'publish')).toBe(false)
    expect(canRunAction('editor', 'review', 'approve')).toBe(false)
  })

  it('l’amministratore approva, pubblica e programma', () => {
    expect(canRunAction('admin', 'review', 'approve')).toBe(true)
    expect(canRunAction('admin', 'draft', 'publish')).toBe(true)
    expect(canRunAction('admin', 'draft', 'schedule')).toBe(true)
    /* Su una pagina già pubblica resta solo il ritorno in bozza. */
    expect(availableActions('admin', 'published').map((action) => action.id)).toEqual(['back-to-draft'])
    /* Su una programmata: pubblica subito o annulla la programmazione. */
    expect(availableActions('admin', 'scheduled').map((action) => action.id)).toEqual(['publish', 'back-to-draft'])
  })

  it('il visualizzatore non ha azioni di flusso', () => {
    for (const status of ['draft', 'review', 'scheduled', 'published'] as const) {
      expect(availableActions('viewer', status)).toEqual([])
    }
    expect(roleSatisfies('viewer', 'editor')).toBe(false)
    expect(roleSatisfies('editor', 'admin')).toBe(false)
    expect(roleSatisfies('admin', 'admin')).toBe(true)
    expect(findAction('approve')?.minRole).toBe('admin')
  })
})

describe('azioni', () => {
  const AT = '2026-10-17T12:00:00.000Z'

  it('inviare in revisione traccia chi e quando', () => {
    const result = applyAction(
      'request-review',
      { status: 'draft' },
      { actor: 'brian', at: AT, note: 'Controlla le regole' }
    )
    expect(result.status).toBe('review')
    expect(result.isDraft).toBe(true)
    expect(result.publishAt).toBeUndefined()
    expect(result.review).toMatchObject({ requestedBy: 'brian', requestedAt: AT, note: 'Controlla le regole' })
  })

  it('approvare pubblica e firma la revisione', () => {
    const result = applyAction(
      'approve',
      { status: 'review', review: { requestedBy: 'brian', requestedAt: AT } },
      { actor: 'admin-user', at: AT }
    )
    expect(result.status).toBe('published')
    expect(result.isDraft).toBe(false)
    expect(result.review).toMatchObject({ requestedBy: 'brian', reviewedBy: 'admin-user', reviewedAt: AT })
  })

  it('programmare conserva la data, ripubblicare la cancella', () => {
    const scheduled = applyAction('schedule', { status: 'review' }, { actor: 'admin-user', publishAt: FUTURE })
    expect(scheduled.status).toBe('scheduled')
    expect(scheduled.publishAt).toBe(FUTURE)
    expect(isPublic(scheduled, NOW)).toBe(false)

    const published = applyAction('publish', scheduled, { actor: 'admin-user' })
    expect(published.status).toBe('published')
    expect(published.publishAt).toBeUndefined()
    expect(isPublic(published, NOW)).toBe(true)
  })

  it('riportare in bozza annulla la programmazione', () => {
    const result = applyAction('back-to-draft', { status: 'scheduled', publishAt: FUTURE }, {})
    expect(result.status).toBe('draft')
    expect(result.publishAt).toBeUndefined()
    expect(result.isDraft).toBe(true)
    expect(result.message).toMatch(/Programmazione annullata/)
  })
})

describe('validazione della programmazione', () => {
  it('rifiuta data assente, non valida o già passata', () => {
    expect(validateSchedule('', NOW)?.message).toMatch(/Indica data e ora/)
    expect(validateSchedule('domani', NOW)?.message).toMatch(/Indica data e ora/)
    expect(validateSchedule(PAST, NOW)?.message).toMatch(/già passata/)
  })

  it('accetta una data futura e tollera lo scarto dei minuti', () => {
    expect(validateSchedule(FUTURE, NOW)).toBeNull()
    expect(validateSchedule(new Date(NOW - 30_000).toISOString(), NOW)).toBeNull()
  })
})

describe('conversioni per il campo data', () => {
  it('fa andata e ritorno fra ISO e ora locale', () => {
    const local = toLocalInput(FUTURE)
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(fromLocalInput(local)).toBe(FUTURE)
  })

  it('tollera valori assenti o rotti', () => {
    expect(toLocalInput(undefined)).toBe('')
    expect(toLocalInput('x')).toBe('')
    expect(fromLocalInput('')).toBeUndefined()
    expect(fromLocalInput('x')).toBeUndefined()
    expect(formatWhen(undefined)).toBe('')
    expect(formatWhen(PAST)).toMatch(/2026/)
  })
})

/*
  Parità con il sito: la stessa specifica vive in scripts/js/page-status.js
  (script classico, valutato qui in un contesto vm con un finto `window`).
  Se le due implementazioni divergono, il pannello mostrerebbe uno stato che
  il sito non applica: una pagina "pubblicata" nel pannello resterebbe
  invisibile ai lettori (o il contrario).
*/
describe('parità con la specifica del sito', () => {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const siteFile = path.resolve(here, '../../../../scripts/js/page-status.js')
  let site: Record<string, (...args: unknown[]) => unknown>

  const CASES: Array<[string, Record<string, unknown> | null]> = [
    ['storica senza campi', {}],
    ['bozza storica', { isDraft: true }],
    ['bozza dichiarata', { status: 'draft' }],
    ['in revisione', { status: 'review', isDraft: true }],
    ['programmata futura', { status: 'scheduled', publishAt: FUTURE }],
    ['programmata scaduta', { status: 'scheduled', publishAt: PAST }],
    ['programmata senza data', { status: 'scheduled' }],
    ['pubblicata', { status: 'published' }],
    ['pubblicata con bozza residua', { status: 'published', isDraft: true }],
    ['data futura senza stato', { publishAt: FUTURE }]
  ]

  beforeAll(() => {
    const code = fs.readFileSync(siteFile, 'utf8')
    const sandbox = { window: {} as Record<string, unknown>, console }
    vm.createContext(sandbox)
    vm.runInContext(code, sandbox)
    site = sandbox.window.arcPageWorkflow as Record<string, (...args: unknown[]) => unknown>
    expect(site, 'scripts/js/page-status.js non espone window.arcPageWorkflow').toBeTruthy()
  })

  it.each(CASES)('stato identico a quello del sito: %s', (_label, page) => {
    const input = page as never
    expect(declaredStatus(input)).toBe(site.declaredStatus(input))
    expect(statusOf(input, NOW)).toBe(site.statusOf(input, NOW))
    expect(isPublic(input, NOW)).toBe(site.isPublic(input, NOW))
    expect(isDue(input, NOW)).toBe(site.isDue(input, NOW))
  })

  it('il gate del sito blocca esattamente le pagine non pubbliche', () => {
    for (const [label, page] of CASES) {
      const blocked = (site.gate(page, NOW) as { blocked: boolean }).blocked
      expect(blocked, `gate incoerente su: ${label}`).toBe(!isPublic(page as never, NOW))
    }
  })
})

describe('ponte con registro e salvataggio', () => {
  it('deriva i campi da scrivere e evita scritture inutili', () => {
    expect(workflowFields({ status: 'review' })).toMatchObject({ status: 'review', isDraft: true })
    expect(workflowFields({ status: 'published' })).toMatchObject({ status: 'published', isDraft: false })

    const page = { status: 'scheduled' as const, publishAt: FUTURE, review: { requestedBy: 'brian' } }
    expect(sameWorkflow(page, { ...page })).toBe(true)
    expect(sameWorkflow(page, { ...page, publishAt: PAST })).toBe(false)
    expect(sameWorkflow(page, { ...page, review: { requestedBy: 'altro' } })).toBe(false)
    expect(sameWorkflow({ status: 'draft' }, { isDraft: true })).toBe(true)
    /* Una revisione vuota non è una differenza: altrimenti ogni
       salvataggio riscriverebbe il registro per nulla. */
    expect(sameWorkflow({ status: 'draft', review: {} }, { status: 'draft' })).toBe(true)
    expect(sameWorkflow({ status: 'draft', review: { note: '' } }, { status: 'draft' })).toBe(true)
    expect(sameWorkflow({ status: 'draft', review: { note: 'x' } }, { status: 'draft' })).toBe(false)
  })
})
