import fs from 'node:fs'
import path from 'node:path'

import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════
   Editor strutturato: modelli, anteprima live, salvataggio,
   cassetto media e guard delle modifiche.

   Il backend non esiste in e2e: /api/gh viene simulato con la stessa
   forma del proxy reale ({ data: … }) e le richieste di salvataggio
   vengono ispezionate per verificare cosa finisce nel repository.
   ════════════════════════════════════════════════════════════ */

const PAGE = {
  k: 'pantheon',
  title: 'Pantheon',
  icon: '🛐',
  layout: 'pantheon',
  template: 'divinita',
  templateData: {
    fields: { intro: 'Gli dèi di Aetherion.' },
    collections: {
      entita: [
        {
          nome: 'Anivia',
          epiteto: 'La Criofenice',
          allineamento: 'Legale Buono',
          sfere: ['Gelo', 'Speranza'],
          simbolo: 'Piuma di ghiaccio',
          immagine: '/images/anivia.jpg',
          ritaglio: '42,32',
          citazione: 'I am the fury of the blizzard.',
          personalita: 'Calma e implacabile.',
          tempio: 'Santuario di ghiaccio',
          rituali: 'Canti al solstizio',
          seguaci: 'Nomadi del nord'
        }
      ]
    }
  },
  draftFields: [],
  status: 'draft',
  isDraft: true,
  review: {},
  content: '# Divinità',
  lastModified: '2026-01-01T00:00:00.000Z'
}

const REGISTRY = {
  root: 'root',
  guild: 'guild',
  pages: [
    {
      k: 'pantheon',
      l: 'Pantheon',
      i: '🛐',
      id: 'pag-pantheon',
      sec: 'lore',
      c: 1,
      layout: 'pantheon',
      status: 'draft',
      isDraft: true
    }
  ],
  sections: [{ v: 'lore', l: 'Lore' }]
}

const MEDIA = [
  { name: 'anivia.jpg', path: 'images/anivia.jpg', sha: 'media-1', size: 2048, type: 'file' },
  { name: 'janna.jpg', path: 'images/janna.jpg', sha: 'media-2', size: 3072, type: 'file' }
]

interface GhCall {
  action: string
  payload: Record<string, unknown>
}

function b64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function decode(value: unknown): string {
  return Buffer.from(String(value), 'base64').toString('utf8')
}

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockBackend(page: Page, role: 'editor' | 'admin' = 'admin'): Promise<GhCall[]> {
  const calls: GhCall[] = []

  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: role + '-user', role, csrf: 'e2e-csrf' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  /* Stati remoti: nel test il registro è già allineato, quindi la lista
     non deve riscrivere i chip. */
  await page.route('**/api/admin?action=pages_status', (route) =>
    json(route, { pantheon: { status: 'draft', isDraft: true } })
  )

  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as GhCall
    calls.push(body)
    const path = String(body.payload.path || '')

    if (body.action === 'get' && path === 'content/pages/pantheon.json') {
      return json(route, { data: { content: b64(JSON.stringify(PAGE)), sha: 'sha-page' } })
    }
    if (body.action === 'get' && path === 'content/pages/registry.json') {
      return json(route, { data: { content: b64(JSON.stringify(REGISTRY)), sha: 'sha-registry' } })
    }
    if (body.action === 'get' && path === 'images') {
      return json(route, { data: MEDIA })
    }
    if (body.action === 'put') {
      return json(route, { data: { content: { sha: 'sha-new' } } })
    }
    return json(route, { data: null })
  })

  return calls
}

async function openEditor(page: Page) {
  await page.goto('/admin/app.html#/editor/pantheon')
  await expect(page.locator('.arc-ws-title')).toHaveValue('Pantheon')
  await expect(page.locator('.arc-ws-editor')).toBeVisible()
}

test.describe('editor di pagina', () => {
  test('mostra i campi del modello e l’anteprima live', async ({ page }) => {
    await mockBackend(page)
    await openEditor(page)

    const name = page.locator('#f-collections\\.entita\\.0\\.nome')
    await expect(name).toHaveValue('Anivia')
    await expect(page.locator('#f-collections\\.entita\\.0\\.epiteto')).toHaveValue('La Criofenice')

    const preview = page.locator('.arc-ws-preview')
    await expect(preview).toContainText('Identità')
    await expect(preview).toContainText('La Criofenice')
    await expect(preview).toContainText('I am the fury of the blizzard.')

    await page.locator('#f-collections\\.entita\\.0\\.epiteto').fill('La Fenice del Gelo')
    await expect(preview).toContainText('La Fenice del Gelo')
  })

  test('l’indice dell’anteprima punta a titoli esistenti', async ({ page }) => {
    await mockBackend(page)
    await openEditor(page)

    const links = page.locator('.arc-md-toc a')
    /* Divinità · Anivia · Identità · Personalità · Culto */
    await expect(links).toHaveCount(5)
    /* Il renderer del sito non emette id: senza l'assegnazione in
       MarkdownPreview gli href finivano su «#undefined». */
    for (const href of await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))) {
      expect(href).toMatch(/^#[a-z0-9-]+$/)
    }
    await expect(links.nth(1)).toHaveAttribute('href', '#anivia')
    await expect(page.locator('.arc-md-preview h1#anivia')).toHaveCount(1)
  })

  test('Ctrl+S salva il markdown compilato e i dati del modello', async ({ page }) => {
    const calls = await mockBackend(page)
    await openEditor(page)

    await page.locator('#f-collections\\.entita\\.0\\.epiteto').fill('La Fenice del Gelo')
    await expect(page.locator('.arc-ws-save')).toContainText('Modifiche non salvate')

    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    const put = calls.filter((call) => call.action === 'put' && call.payload.path === 'content/pages/pantheon.json').pop()
    expect(put?.payload.path).toBe('content/pages/pantheon.json')
    const saved = JSON.parse(decode(put?.payload.content)) as typeof PAGE
    expect(saved.content).toContain('![Anivia](/images/anivia.jpg#42,32)')
    expect(saved.content).toContain('- **Epiteto:** La Fenice del Gelo')
    expect(saved.content).toContain('\n---\n')
    expect(saved.template).toBe('divinita')
    expect(saved.templateData?.collections.entita[0].epiteto).toBe('La Fenice del Gelo')
  })

  test('blocca il salvataggio se un campo obbligatorio è vuoto', async ({ page }) => {
    const calls = await mockBackend(page)
    await openEditor(page)

    await page.locator('#f-collections\\.entita\\.0\\.nome').fill('')
    await page.locator('#f-collections\\.entita\\.0\\.nome').blur()
    await expect(page.locator('.arc-statusbar')).toContainText('da correggere')

    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Salvataggio non riuscito')
    expect(calls.filter((call) => call.action === 'put')).toHaveLength(0)
  })

  test('il cassetto media elenca le immagini e riempie il campo', async ({ page }) => {
    await mockBackend(page)
    await openEditor(page)

    const imageField = page.locator('#f-collections\\.entita\\.0\\.immagine')
    await imageField.focus()
    await page.locator('.arc-field').filter({ has: imageField }).getByRole('button', { name: 'Scegli' }).click()

    const drawer = page.locator('.arc-drawer')
    await expect(drawer).toBeVisible()
    await drawer.getByTitle('janna.jpg').click()

    await expect(imageField).toHaveValue('/images/janna.jpg')
    await expect(drawer).toBeHidden()
  })

  test('il filtro rapido trova un campo e dice quanti ne nasconde', async ({ page }) => {
    await mockBackend(page)
    await openEditor(page)

    const filter = page.locator('.arc-form-filter')
    await filter.getByRole('searchbox', { name: 'Cerca un campo del modello' }).fill('tempio')

    await expect(page.locator('#f-collections\\.entita\\.0\\.tempio')).toBeVisible()
    await expect(page.locator('#f-fields\\.intro')).toHaveCount(0)
    await expect(filter).toContainText('1 campo nascosto')

    await filter.getByRole('button', { name: /azzera filtro/ }).click()
    await expect(page.locator('#f-fields\\.intro')).toHaveCount(1)
  })

  test('la lista pagine propone i modelli alla creazione', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/admin/app.html#/pagine')
    await expect(page.locator('.arc-page-title')).toHaveText('Pagine')

    await page.getByRole('button', { name: /Nuova pagina/ }).click()
    const picker = page.locator('.arc-picker')
    await expect(picker).toBeVisible()
    await expect(picker.getByText('Scheda Divinità')).toBeVisible()
    await expect(picker.getByText('Regolamento', { exact: true })).toBeVisible()
    await expect(picker.getByText('Pagina Lore')).toBeVisible()
    await expect(picker.getByText('Mestiere / Lavoro')).toBeVisible()
    await expect(picker.getByText('Pagina libera')).toBeVisible()
  })

  test('il flusso di pubblicazione mostra stato e azioni del ruolo', async ({ page }) => {
    await mockBackend(page)
    await openEditor(page)
    await page.getByRole('button', { name: 'Dettagli' }).click()

    const workflow = page.locator('.arc-workflow')
    await expect(workflow).toBeVisible()
    await expect(workflow.locator('.arc-status-draft')).toHaveText('Bozza')
    await expect(workflow.getByRole('button', { name: 'Invia in revisione' })).toBeVisible()
    await expect(workflow.getByRole('button', { name: 'Pubblica ora' })).toBeVisible()
    await expect(workflow.getByRole('button', { name: 'Programma' })).toBeVisible()
  })

  test('un editor può chiedere la revisione ma non pubblicare', async ({ page }) => {
    await mockBackend(page, 'editor')
    await openEditor(page)
    await page.getByRole('button', { name: 'Dettagli' }).click()

    const workflow = page.locator('.arc-workflow')
    await expect(workflow.getByRole('button', { name: 'Invia in revisione' })).toBeVisible()
    await expect(workflow.getByRole('button', { name: 'Pubblica ora' })).toHaveCount(0)
    await expect(workflow.getByRole('button', { name: 'Programma' })).toHaveCount(0)

    await workflow.getByRole('button', { name: 'Invia in revisione' }).click()
    await expect(workflow.locator('.arc-status-review')).toHaveText('In revisione')
    await expect(page.locator('.arc-ws-save')).toContainText('Modifiche non salvate')
  })

  test('programmare salva data e stato su pagina e registro', async ({ page }) => {
    const calls = await mockBackend(page)
    await openEditor(page)
    await page.getByRole('button', { name: 'Dettagli' }).click()

    const workflow = page.locator('.arc-workflow')
    await workflow.locator('input[type="datetime-local"]').fill('2027-01-15T09:30')
    await workflow.getByRole('button', { name: 'Programma' }).click()
    await expect(workflow.locator('.arc-status-scheduled')).toHaveText('Programmata')

    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    const puts = calls.filter((call) => call.action === 'put')
    const saved = JSON.parse(decode(puts.find((call) => call.payload.path === 'content/pages/pantheon.json')?.payload.content)) as {
      status: string
      publishAt: string
      isDraft: boolean
    }
    expect(saved.status).toBe('scheduled')
    expect(saved.isDraft).toBe(false)
    expect(Date.parse(saved.publishAt)).toBe(Date.parse(new Date('2027-01-15T09:30').toISOString()))

    const registryPut = puts.find((call) => call.payload.path === 'content/pages/registry.json')
    const registry = JSON.parse(decode(registryPut?.payload.content)) as { pages: Array<{ status?: string; publishAt?: string }> }
    expect(registry.pages[0].status).toBe('scheduled')
    expect(registry.pages[0].publishAt).toBe(saved.publishAt)
  })

  test('la pubblicazione si ferma se un campo obbligatorio è vuoto', async ({ page }) => {
    const calls = await mockBackend(page)
    await openEditor(page)
    await page.getByRole('button', { name: 'Dettagli' }).click()

    await page.locator('#f-collections\\.entita\\.0\\.nome').fill('')
    await expect(page.locator('.arc-statusbar')).toContainText('da correggere')

    const workflow = page.locator('.arc-workflow')
    await workflow.getByRole('button', { name: 'Pubblica ora' }).click()

    /* Lo stato non cambia e nulla viene scritto: prima si corregge. */
    await expect(workflow.locator('.arc-status-draft')).toHaveText('Bozza')
    await expect(page.locator('[role="status"]')).toContainText('prima di pubblicare')
    expect(calls.filter((call) => call.action === 'put')).toHaveLength(0)
  })

  test('la lista filtra per stato e propone l’approvazione', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/admin/app.html#/pagine')
    await expect(page.locator('.arc-page-title')).toHaveText('Pagine')

    const filters = page.locator('.arc-filter-chip')
    await expect(filters.first()).toContainText('Tutte')
    await expect(filters.nth(1)).toContainText('Bozza 1')

    /* La pagina del registro è in bozza: il chip lo dice e c'è l'azione. */
    await expect(page.locator('tbody .arc-status-draft')).toHaveText('Bozza')
    await expect(page.getByRole('button', { name: 'Invia in revisione' })).toBeVisible()

    await page.locator('.arc-filter-chip', { hasText: 'Pubblicata' }).click()
    await expect(page.locator('.arc-page-link')).toHaveCount(0)

    await page.locator('.arc-filter-chip', { hasText: 'Bozza' }).click()
    await expect(page.locator('.arc-page-link')).toHaveCount(1)
  })

  test('avvisa prima di abbandonare modifiche non salvate', async ({ page }) => {
    await mockBackend(page)
    await openEditor(page)

    await page.locator('#f-collections\\.entita\\.0\\.epiteto').fill('Modifica pendente')
    await page.locator('.arc-nav-link', { hasText: 'Dashboard' }).click()

    await expect(page.locator('.arc-modal-backdrop')).toContainText('Modifiche non salvate')
    await page.getByRole('button', { name: 'Resta qui' }).click()
    await expect(page.locator('.arc-ws-title')).toHaveValue('Pantheon')
  })
})

/* ── Contenuto reale importato da Notion ─────────────────────
   Non una fixture: il file pubblicato del compendio sottoclassi, con
   tutti i suoi blocchi. Serve a dimostrare che una pagina migrata
   arriva nell'editor a blocchi e torna nel repository con lo stesso
   contenuto, usando lo sha della lettura. */
const REAL_PAGE = {
  ...(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../content/pages/sottoclassi-homebrew.json'), 'utf8')) as Record<string, unknown>),
  sha: 'sha-imported'
}

const REAL_PANTHEON = {
  ...(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../content/pages/pantheon.json'), 'utf8')) as Record<string, unknown>),
  sha: 'sha-pantheon'
}

const REAL_SPECIES = {
  ...(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../content/pages/specie-homebrew.json'), 'utf8')) as Record<string, unknown>),
  sha: 'sha-species'
}

async function mockImportedContent(page: Page): Promise<GhCall[]> {
  const calls: GhCall[] = []
  const registry = {
    root: 'root',
    guild: 'guild',
    pages: [
      {
        k: 'sottoclassi-homebrew',
        l: 'Sottoclassi Homebrew',
        i: '⚔️',
        id: 'pag-sottoclassi-homebrew',
        sec: 'homebrew',
        admin: true,
        layout: 'compendio'
      }
    ],
    sections: [{ v: 'homebrew', l: 'Homebrew' }]
  }

  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'admin-user', role: 'admin', csrf: 'e2e-csrf' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as GhCall
    calls.push(body)
    const path = String(body.payload.path || '')
    if (body.action === 'get' && path === 'content/pages/sottoclassi-homebrew.json')
      return json(route, { data: { content: b64(JSON.stringify(REAL_PAGE)), sha: 'sha-imported' } })
    if (body.action === 'get' && path === 'content/pages/registry.json')
      return json(route, { data: { content: b64(JSON.stringify(registry)), sha: 'sha-registry' } })
    if (body.action === 'get' && path === 'images') return json(route, { data: [] })
    if (body.action === 'put') return json(route, { data: { content: { sha: 'sha-new' } } })
    return json(route, { data: null })
  })
  return calls
}

async function mockSpeciesContent(page: Page): Promise<GhCall[]> {
  const calls: GhCall[] = []
  const registry = {
    root: 'root',
    guild: 'guild',
    pages: [
      {
        k: 'specie-homebrew',
        l: 'Specie Homebrew',
        i: '🧬',
        id: 'pag-specie-homebrew',
        sec: 'homebrew',
        admin: true,
        layout: 'compendio'
      }
    ],
    sections: [{ v: 'homebrew', l: 'Homebrew' }]
  }

  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'admin-user', role: 'admin', csrf: 'e2e-csrf' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as GhCall
    calls.push(body)
    const path = String(body.payload.path || '')
    if (body.action === 'get' && path === 'content/pages/specie-homebrew.json')
      return json(route, { data: { content: b64(JSON.stringify(REAL_SPECIES)), sha: 'sha-species' } })
    if (body.action === 'get' && path === 'content/pages/registry.json')
      return json(route, { data: { content: b64(JSON.stringify(registry)), sha: 'sha-registry' } })
    if (body.action === 'get' && path === 'images') return json(route, { data: [] })
    if (body.action === 'put') return json(route, { data: { content: { sha: 'sha-new' } } })
    return json(route, { data: null })
  })
  return calls
}

async function mockPantheonContent(page: Page): Promise<GhCall[]> {
  const calls: GhCall[] = []
  const registry = {
    root: 'root',
    guild: 'guild',
    pages: [
      {
        k: 'pantheon',
        l: 'Pantheon',
        i: '🛐',
        id: 'pag-pantheon',
        sec: 'lore',
        admin: true,
        layout: 'pantheon'
      }
    ],
    sections: [{ v: 'lore', l: 'Lore' }]
  }

  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'admin-user', role: 'admin', csrf: 'e2e-csrf' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as GhCall
    calls.push(body)
    const path = String(body.payload.path || '')
    if (body.action === 'get' && path === 'content/pages/pantheon.json')
      return json(route, { data: { content: b64(JSON.stringify(REAL_PANTHEON)), sha: 'sha-pantheon' } })
    if (body.action === 'get' && path === 'content/pages/registry.json')
      return json(route, { data: { content: b64(JSON.stringify(registry)), sha: 'sha-registry' } })
    if (body.action === 'get' && path === 'images') return json(route, { data: [] })
    if (body.action === 'put') return json(route, { data: { content: { sha: 'sha-new' } } })
    return json(route, { data: null })
  })
  return calls
}

test.describe('contenuti importati da Notion', () => {
  test('il form Divinità apre 20 schede reali e salva i campi senza perdere le sezioni speciali', async ({ page }) => {
    const calls = await mockPantheonContent(page)
    await page.goto('/admin/app.html#/editor/pantheon')
    await expect(page.locator('.arc-ws-title')).toHaveValue('Pantheon')

    await page.getByRole('tab', { name: /Divinità/ }).click()
    await expect(page.locator('.arc-pantheon-card:not(.is-raw)')).toHaveCount(20)
    const first = page.locator('.arc-pantheon-card').filter({ hasText: 'Anivia' }).first()
    await first.locator('.arc-pantheon-card-head').click()
    await first.locator('input').nth(1).fill('La Fenice del Gelo')
    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    const put = calls.filter((call) => call.action === 'put' && call.payload.path === 'content/pages/pantheon.json').pop()
    expect(put?.payload.sha).toBe('sha-pantheon')
    const saved = JSON.parse(decode(put?.payload.content)) as { content: string }
    expect(saved.content).toContain('- **Epiteto:** La Fenice del Gelo')
    expect(saved.content).toContain('# Nota sulle fonti')
  })

  test('la pagina reale si apre nell’editor a blocchi e si salva senza perdere contenuto', async ({ page }) => {
    const calls = await mockImportedContent(page)
    const before = String(REAL_PAGE.content)

    await page.goto('/admin/app.html#/editor/sottoclassi-homebrew')
    await expect(page.locator('.arc-ws-title')).toHaveValue('Sottoclassi Homebrew')
    await expect(page.locator('.arc-blocks')).toBeVisible()
    await expect(page.locator('.arc-block')).not.toHaveCount(0)

    const firstHeading = page.locator('.arc-block input.in').first()
    await firstHeading.fill('Chemtecnico — prova editor')
    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    const put = calls.filter((call) => call.action === 'put' && call.payload.path === 'content/pages/sottoclassi-homebrew.json').pop()
    expect(put?.payload.sha).toBe('sha-imported')
    const saved = JSON.parse(decode(put?.payload.content)) as { content: string; layout: string; sha?: string }
    expect(saved.layout).toBe('compendio')
    expect(saved.content).toContain('Chemtecnico — prova editor')
    expect(saved.content.length).toBeGreaterThan(before.length - 200)
    expect(saved.content.length).toBeLessThan(before.length + 300)
  })

  test('il catalogo Schede apre tutte le 33 specie e salva una scheda senza perderne nessuna', async ({ page }) => {
    const calls = await mockSpeciesContent(page)

    await page.goto('/admin/app.html#/editor/specie-homebrew')
    await expect(page.locator('.arc-ws-title')).toHaveValue('Specie Homebrew')
    await page.getByRole('tab', { name: /Schede/ }).click()
    await expect(page.locator('.arc-compendio-card:not(.is-raw)')).toHaveCount(33)
    await expect(page.locator('.arc-compendio-group-title').first()).toBeVisible()

    const first = page.locator('.arc-compendio-card').filter({ hasText: 'Ascesi' }).first()
    await first.locator('.arc-compendio-card-title').click()
    await first.locator('.arc-compendio-fields input').first().fill('Ascesi — prova catalogo')
    const body = first.locator('textarea.arc-compendio-body')
    await body.fill((await body.inputValue()) + '\n\nTratto aggiornato dall’Admin.')
    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    const put = calls.filter((call) => call.action === 'put' && call.payload.path === 'content/pages/specie-homebrew.json').pop()
    expect(put?.payload.sha).toBe('sha-species')
    const saved = JSON.parse(decode(put?.payload.content)) as { content: string; layout: string; sha?: string }
    expect(saved.layout).toBe('compendio')
    expect(saved.content).toContain('# Ascesi — prova catalogo')
    expect(saved.content).toContain('Tratto aggiornato dall’Admin.')
    expect(saved.content.split('\n').filter((line) => /^#\s+/.test(line))).toHaveLength(33)
    expect(saved.sha).toBeUndefined()
  })

  test('la scheda Esplorazione crea schede, riordina, elimina e salva il pattern', async ({ page }) => {
    const calls = await mockPantheonContent(page)

    await page.goto('/admin/app.html#/editor/pantheon')
    await expect(page.locator('.arc-ws-title')).toHaveValue('Pantheon')
    await page.getByRole('tab', { name: /Esplorazione/ }).click()
    await expect(page.locator('.arc-explorer')).toBeVisible()
    await expect(page.locator('.arc-explorer-head .arc-chip')).toContainText('30 divinità')

    /* Cambio di pattern: il drawer del pantheon diventa schede orizzontali. */
    await page.getByRole('radio', { name: /Schede \+ indice/ }).click()
    await expect(page.locator('.arc-explorer-mode[aria-checked="true"]')).toContainText('Schede + indice')
    await expect(page.locator('.arc-explorer-block').first()).toContainText('Schede orizzontali')

    /* Creazione, rinomina, associazione di una sezione e riordino di due schede. */
    await page.getByRole('button', { name: /Nuova scheda/ }).click()
    await page.getByRole('button', { name: /Nuova scheda/ }).click()
    await expect(page.locator('.arc-explorer-group')).toHaveCount(2)

    const names = page.locator('.arc-explorer-group-name')
    await names.nth(0).fill('Divinità')
    await names.nth(1).fill('Aspetti')
    await page.locator('.arc-explorer-group').first().locator('.arc-section-chip', { hasText: 'Identità' }).first().click()

    await page.locator('.arc-explorer-group').nth(1).locator('[title="Sposta su"]').click()
    expect(await names.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))).toEqual(['Aspetti', 'Divinità'])

    await page.locator('.arc-explorer-group').nth(0).locator('[title="Elimina gruppo"]').click()
    await expect(page.locator('.arc-explorer-group')).toHaveCount(1)

    /* I filtri si eliminano e si ricreano senza toccare il codice. */
    await page.locator('.arc-explorer-filter').first().locator('[title="Elimina filtro"]').click()
    await expect(page.locator('.arc-explorer-filter')).toHaveCount(0)
    await page.getByRole('button', { name: /Nuovo filtro/ }).click()
    const filter = page.locator('.arc-explorer-filter').first()
    await filter.locator('input').nth(0).fill('Fonte')
    await filter.locator('input').nth(1).fill('Fonte')

    await page.keyboard.press('Control+s')
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    const put = calls.filter((call) => call.action === 'put' && call.payload.path === 'content/pages/pantheon.json').pop()
    expect(put?.payload.sha).toBe('sha-pantheon')
    const saved = JSON.parse(decode(put?.payload.content)) as {
      content: string
      explore?: { mode: string; tabs: Array<{ label: string; sections: string[] }>; filters: Array<{ label: string; field: string }> }
    }
    expect(saved.explore?.mode).toBe('tabs')
    expect(saved.explore?.tabs).toHaveLength(1)
    expect(saved.explore?.tabs[0].label).toBe('Divinità')
    expect(saved.explore?.tabs[0].sections).toContain('Identità')
    expect(saved.explore?.filters).toEqual([{ id: 'filtro-1', label: 'Fonte', field: 'Fonte' }])
    /* Il contenuto della pagina resta quello importato: qui si salva solo il pattern. */
    expect(saved.content).toContain('# Anivia')
    expect(Math.abs(saved.content.length - String(REAL_PANTHEON.content).length)).toBeLessThan(400)
  })
})
