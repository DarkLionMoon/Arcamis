import { test, expect } from 'playwright/test'

/*
  Smoke test del SITO pubblico. Si esegue contro il build o il dev server:
    PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test e2e/public-site.spec.ts --project=chromium

  Non richiede autenticazione.
*/
test('il sito carica e mostra il titolo del server', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Arcamis/)
})

test('la homepage mostra un carosello', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#carousel-wrap')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#carousel-wrap .slide').first()).toBeVisible()
})

/*
  Stati di pubblicazione sul sito reale: il contenuto di una pagina non
  pubblicata non deve comparire, e al suo posto c'è l'avviso di stato.
  Il JSON della pagina viene sostituito nella risposta: è l'unico modo di
  provare il gate senza committare una pagina in bozza nel repository.
*/
test.describe('pagine non pubblicate', () => {
  const DRAFT = {
    k: 'regole-del-server',
    title: 'Regole del Server',
    icon: '📋',
    layout: 'regole',
    status: 'draft',
    isDraft: true,
    content: '# Regole del Server\n\n## Regola 1 — Segreto\n\nTesto che non deve uscire.',
    lastModified: '2026-10-01T00:00:00.000Z'
  }

  async function openPage(page: import('playwright/test').Page, payload: unknown) {
    await page.route('**/content/pages/regole-del-server.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
    )
    await page.goto('/')
    await page.evaluate(() => {
      const gp = (window as unknown as { gp?: (id: string, label: string, icon: string) => void }).gp
      gp?.('pag-regole-del-server', 'Regole del Server', '📋')
    })
    await expect(page.locator('#pbody')).toBeVisible()
  }

  test('una bozza mostra lo stato al posto del contenuto', async ({ page }) => {
    await openPage(page, DRAFT)

    const body = page.locator('#pbody')
    await expect(body.locator('.n-empty-title')).toHaveText('Bozza')
    await expect(body.locator('.n-empty-msg')).toContainText('in lavorazione')
    await expect(body).not.toContainText('Testo che non deve uscire')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })

  test('una pagina programmata dice da quando sarà pubblica', async ({ page }) => {
    await openPage(page, {
      ...DRAFT,
      status: 'scheduled',
      isDraft: false,
      publishAt: '2099-01-15T09:30:00.000Z'
    })

    const body = page.locator('#pbody')
    await expect(body.locator('.n-empty-title')).toHaveText('In arrivo')
    await expect(body.locator('.n-empty-msg')).toContainText('2099')
  })

  test('una pagina pubblicata mostra il contenuto come sempre', async ({ page }) => {
    await openPage(page, { ...DRAFT, status: 'published', isDraft: false })

    const body = page.locator('#pbody')
    await expect(body).toContainText('Testo che non deve uscire')
    await expect(body.locator('.n-empty-title')).toHaveCount(0)
  })
})