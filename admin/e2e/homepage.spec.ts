import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   Homepage Builder — flusso completo.

   Il backend non esiste in e2e: /api/gh e /api/admin sono simulati,
   come negli altri spec editoriali. Si verificano le azioni reali
   dell'editor (testi, visibilità, drag & drop), l'anteprima con lo
   stesso renderer del sito, la bozza locale e il payload che arriva
   al commit. Dopo il salvataggio si simula la home pubblicata con
   l'impronta attesa: il pannello deve dire "Pubblicata e verificata"
   solo al riscontro, non prima.

   Esecuzione:
     npm --prefix admin run test:e2e -- e2e/homepage.spec.ts
   ════════════════════════════════════════════════════════════════ */

const HOMEPAGE_PATH = 'content/homepage.json'
const REGISTRY_PATH = 'content/pages/registry.json'

const SEED = {
  version: 1,
  updatedAt: null,
  sections: [
    {
      id: 'marche',
      type: 'marche',
      label: 'Marche di Arcamis',
      visible: true,
      divider: true,
      eyebrow: 'Regione Esplorabile',
      title: 'MARCHE TEST',
      description: 'La regione intorno alla città.',
      showMap: true
    },
    {
      id: 'arcadia',
      type: 'arcadia',
      label: 'Arcadia',
      visible: true,
      divider: true,
      eyebrow: 'Il Regno',
      title: 'ARCADIA TEST',
      description: 'Il regno e le sue gilde.',
      guildsTitle: 'Le Grandi Gilde',
      factions: [],
      guilds: []
    },
    {
      id: 'come-iniziare',
      type: 'steps',
      label: 'Come iniziare',
      visible: false,
      divider: false,
      eyebrow: 'Guida rapida',
      title: 'GUIDA TEST',
      description: 'Tre passi per iniziare.',
      steps: [{ icon: '💬', title: 'Entra nel Discord', description: 'Leggi le regole.' }],
      cta: []
    }
  ]
}

const REGISTRY = {
  pages: [
    { k: 'home', l: 'Home', i: '🏠', id: 'pag-home', path: '' },
    { k: 'regole', l: 'Regole', i: '📋', id: 'pag-regole', path: 'regole/regole-del-server' }
  ],
  sections: [{ v: 'regole', l: 'Regole' }],
  ui: { bottomNav: [] }
}

interface HomepageDocument {
  version: number
  updatedAt: string | null
  sections: Array<{ id: string; visible: boolean; title: string }>
}

interface PutCall {
  path: string
  document: HomepageDocument
  sha: string
}

interface BackendState {
  puts: PutCall[]
  /** HTML servito alla verifica del deploy (impronta inclusa dal PUT). */
  verifyHtml: string
}

function b64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

/** Stessa FNV-1a di scripts/lib/homepage.mjs, applicata al payload salvato. */
function homepageHash(document: HomepageDocument): string {
  const payload = JSON.stringify({ version: 1, sections: document.sections })
  let hash = 0x811c9dc5
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

async function mockBackend(page: Page): Promise<BackendState> {
  const state: BackendState = { puts: [], verifyHtml: '<!doctype html><html><body></body></html>' }

  /* Fallback per le chiamate di contorno della shell (covers, impostazioni,
     analytics): rispondere 401 farebbe scattare il logout globale. Le route
     più specifiche si registrano dopo e hanno la precedenza. */
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => json(route, {})
  )
  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'editor-user', role: 'editor', csrf: 'e2e-csrf' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/admin?action=get_site_settings', (route) => json(route, { settings: {} }))

  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as { action: string; payload: Record<string, unknown> }
    const path = String(body.payload.path || '')

    if (body.action === 'get' && path === HOMEPAGE_PATH) {
      return json(route, { data: { content: b64(JSON.stringify(SEED)), sha: 'sha-homepage' } })
    }
    if (body.action === 'get' && path === REGISTRY_PATH) {
      return json(route, { data: { content: b64(JSON.stringify(REGISTRY)), sha: 'sha-registry' } })
    }
    if (body.action === 'put' && path === HOMEPAGE_PATH) {
      const document = JSON.parse(
        Buffer.from(String(body.payload.content), 'base64').toString('utf8')
      ) as HomepageDocument
      state.puts.push({ path, document, sha: String(body.payload.sha || '') })
      /* Il deploy simulato serve l'HTML con l'impronta che il pannello
         cercherà subito dopo il salvataggio. */
      state.verifyHtml = `<!doctype html><html><body><!-- homepage:${homepageHash(document)} --></body></html>`
      return json(route, { data: { content: { sha: 'sha-new' } } })
    }
    return json(route, { data: null })
  })

  /* La verifica del pubblicato legge `/` con un cache-buster. */
  await page.route(
    (url) => url.pathname === '/' && url.searchParams.has('v'),
    (route) => route.fulfill({ status: 200, contentType: 'text/html', body: state.verifyHtml })
  )

  return state
}

/* L'headless shell non sintetizza in modo affidabile il drag HTML5 nativo
   con `dragTo`: gli eventi arrivano al documento ma non al handler Vue.
   Qui si inviano gli stessi eventi (dragstart/dragover/drop/dragend) con un
   DataTransfer reale, esercitando il codice di riordino dell'editor. */
async function dragCard(page: Page, from: number, to: number): Promise<void> {
  await page.evaluate(
    ({ fromIndex, toIndex }) => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.hp-section'))
      if (!cards[fromIndex] || !cards[toIndex]) throw new Error('Sezione non trovata per il drag')
      const dataTransfer = new DataTransfer()
      const fire = (element: HTMLElement, type: string) =>
        element.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }))
      fire(cards[fromIndex], 'dragstart')
      fire(cards[toIndex], 'dragover')
      fire(cards[toIndex], 'drop')
      fire(cards[fromIndex], 'dragend')
    },
    { fromIndex: from, toIndex: to }
  )
}

async function openBuilder(page: Page): Promise<void> {
  await page.goto('/admin/app.html#/homepage')
  await expect(page.locator('.arc-page-title')).toHaveText('Homepage')
  await expect(page.locator('.hp-section')).toHaveCount(3)
  await expect(page.locator('.hp-frame')).toBeVisible()
}

test.describe('Homepage Builder', () => {
  test('modifica testi, nasconde una sezione, riordina con drag & drop e salva il payload', async ({ page }) => {
    const state = await mockBackend(page)
    await openBuilder(page)

    const cards = page.locator('.hp-section')
    const preview = page.frameLocator('.hp-frame')
    const save = page.getByRole('button', { name: /Salva e pubblica/ })

    /* Allineata al pubblicato: il pulsante non deve permettere un commit vuoto. */
    await expect(save).toBeDisabled()
    await expect(page.locator('.hp-status')).toContainText('2/3 sezioni visibili')
    await expect(preview.getByRole('heading', { name: 'MARCHE TEST' })).toBeVisible()

    /* Testo: l'anteprima usa lo stesso renderer del build, quindi cambia subito. */
    await page.getByLabel('Titolo della sezione').fill('MARCHE DEL PORTO')
    await expect(preview.getByRole('heading', { name: 'MARCHE DEL PORTO' })).toBeVisible()

    /* Visibilità: la sezione sparisce dall'anteprima, non solo dalla lista. */
    await cards.first().getByTitle('Nascondi sezione').click()
    await expect(page.locator('.hp-status')).toContainText('1/3 sezioni visibili')
    await expect(preview.getByRole('heading', { name: 'MARCHE DEL PORTO' })).toHaveCount(0)

    /* Riordino: la seconda sezione viene trascinata in cima. */
    await dragCard(page, 1, 0)
    await expect(cards.first()).toContainText('Arcadia')
    await expect(save).toBeEnabled()

    await save.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Pubblica la homepage')
    await dialog.getByRole('button', { name: 'Salva e pubblica', exact: true }).click()

    await expect.poll(() => state.puts.length).toBe(1)
    const put = state.puts[0]
    expect(put.path).toBe(HOMEPAGE_PATH)
    expect(put.sha).toBe('sha-homepage')
    expect(put.document.sections.map((section) => section.id)).toEqual(['arcadia', 'marche', 'come-iniziare'])

    const marche = put.document.sections.find((section) => section.id === 'marche')
    expect(marche).toMatchObject({ visible: false, title: 'MARCHE DEL PORTO' })
    expect(put.document.sections.find((section) => section.id === 'arcadia')?.visible).toBe(true)
    expect(put.document.updatedAt).toBeTruthy()

    /* Solo l'impronta giusta vale come "pubblicata". */
    await expect(page.getByText('Pubblicata e verificata: la home online serve questa versione.')).toBeVisible()
    await expect(page.locator('.hp-banner.is-ok')).toContainText('Pubblicata e verificata')
  })

  test('l’anteprima riflette visibilità e dispositivo; la bozza locale sopravvive al reload', async ({ page }) => {
    await mockBackend(page)
    await openBuilder(page)

    const cards = page.locator('.hp-section')
    const preview = page.frameLocator('.hp-frame')

    /* La sezione Guida è nascosta nel seed: non deve esistere nell'anteprima. */
    await expect(preview.getByRole('heading', { name: 'GUIDA TEST' })).toHaveCount(0)

    await cards.nth(2).getByTitle('Mostra sezione').click()
    await expect(preview.getByRole('heading', { name: 'GUIDA TEST' })).toBeVisible()

    /* Anteprima mobile: il frame si restringe davvero. */
    await page.locator('.hp-device').filter({ hasText: 'mobile' }).click()
    await expect(page.locator('.hp-frame')).toHaveAttribute('style', /width: 390px/)

    /* Bozza locale: autosave, poi recupero dopo un reload. Il banner compare
       al caricamento, non nell'istante in cui si scrive. */
    await page.getByLabel('Titolo della sezione').fill('MARCHE BOZZA')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('arc-homepage-draft-v1'))).not.toBeNull()

    await page.reload()
    await expect(page.locator('.hp-section')).toHaveCount(3)
    await expect(page.getByLabel('Titolo della sezione')).toHaveValue('MARCHE BOZZA')
    await expect(page.locator('.hp-banner').filter({ hasText: 'Bozza locale' })).toBeVisible()

    await page.getByRole('button', { name: 'Scarta bozza' }).click()
    await expect(page.getByLabel('Titolo della sezione')).toHaveValue('MARCHE TEST')
    await expect(page.locator('.hp-banner').filter({ hasText: 'Bozza locale' })).toHaveCount(0)
  })
})
