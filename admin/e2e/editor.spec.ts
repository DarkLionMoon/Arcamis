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
