import { test, expect, type Page } from 'playwright/test'

/*
  La Home View (#hv) contiene hero, mappe, Arcadia, Misteri e Guida rapida.
  Le altre pagine vivono in #pv. Questi test proteggono il confine fra le
  due viste anche dopo transizioni, navigazioni rapide e richieste fuori
  ordine: un errore di annidamento HTML o un timer/fetch vecchio non deve
  far comparire la home dentro una pagina interna.
*/

const HOME_MARKERS = [
  '#misteri-regno-title',
  '.mys-cin-grid',
  '#come-iniziare-title',
  '.start-sec .steps',
  '.start-sec .cta-row'
]

async function waitForShell(page: Page) {
  await expect(page.locator('#site-loader')).toBeHidden()
  const acknowledge = page.getByRole('button', { name: 'HO CAPITO', exact: true })
  if (await acknowledge.isVisible().catch(() => false)) await acknowledge.click()
}

async function expectHomeView(page: Page) {
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('#hv')).toBeVisible()
  await expect(page.locator('#pv')).toBeHidden()
  for (const marker of HOME_MARKERS) {
    await expect(page.locator(marker).first()).toBeVisible()
    expect(await page.locator(`#hv ${marker}`).count()).toBeGreaterThan(0)
  }

  /* Nessun blocco della home può vivere fuori da #hv. */
  expect(
    await page.evaluate((markers) => {
      const hv = document.getElementById('hv')
      if (!hv) return markers.length
      return markers.flatMap((marker) => [...document.querySelectorAll(marker)]).filter((node) => !hv.contains(node))
        .length
    }, HOME_MARKERS)
  ).toBe(0)

  /* Anche a transizione conclusa lo stato DOM deve restare quello giusto. */
  await page.waitForTimeout(350)
  await expect(page.locator('#hv')).toBeVisible()
  await expect(page.locator('#pv')).toBeHidden()
}

async function expectInternalView(page: Page, path: string, pageClass: string) {
  await expect(page).toHaveURL(new RegExp(`${path}/?$`))
  await expect(page.locator('#hv')).toBeHidden()
  await expect(page.locator('#pv')).toBeVisible()
  await expect(page.locator('#pbody .nc').first()).toBeVisible()
  await expect(page.locator('#pbody')).toHaveClass(new RegExp(`\\b${pageClass}\\b`))
  await expect(page.locator('#ph-title')).not.toBeEmpty()

  for (const marker of HOME_MARKERS) {
    await expect(page.locator(marker).first()).toBeHidden()
    expect(await page.locator(`#pbody ${marker}`).count()).toBe(0)
  }

  /* Il contenuto della home deve essere ancora dentro #hv, non sparse in #main. */
  expect(
    await page.evaluate((markers) => {
      const hv = document.getElementById('hv')
      if (!hv) return markers.length
      return markers.flatMap((marker) => [...document.querySelectorAll(marker)]).filter((node) => !hv.contains(node))
        .length
    }, HOME_MARKERS)
  ).toBe(0)

  /* Le transizioni non devono riaprire la Home View dopo la resa. */
  await page.waitForTimeout(400)
  await expect(page.locator('#hv')).toBeHidden()
  await expect(page.locator('#pv')).toBeVisible()
  for (const marker of HOME_MARKERS) {
    await expect(page.locator(marker).first()).toBeHidden()
  }
}

async function spaGp(page: Page, id: string, label: string) {
  await page.evaluate(
    ({ id, label }: { id: string; label: string }) => {
      const api = window as unknown as {
        gp: (id: string, label: string, icon: string) => void
      }
      api.gp(id, label, '📄')
    },
    { id, label }
  )
}

async function spaHome(page: Page) {
  await page.evaluate(() => {
    const api = window as unknown as { showHome: () => void }
    api.showHome()
  })
}

test('la Home mostra tutte le sezioni dentro #hv', async ({ page }) => {
  await page.goto('/')
  await waitForShell(page)
  await expectHomeView(page)

  await expect(page.locator('#misteri-regno-title')).toHaveText('MISTERI DEL REGNO')
  await expect(page.locator('#come-iniziare-title')).toContainText('CREA IL TUO PERSONAGGIO')
  await expect(page.locator('.start-sec .step')).toHaveCount(3)
  await expect(page.locator('#hv #carousel-wrap')).toBeVisible()
})

const INTERNAL_PAGES = [
  { path: '/lore/arcamis', pageClass: 'page-pag-arcamis', name: 'Lore' },
  { path: '/regole/regole-del-server', pageClass: 'page-pag-regole-del-server', name: 'Regole' },
  { path: '/personaggio/lavori', pageClass: 'page-pag-lavori', name: 'Personaggio' },
  { path: '/lore/pantheon/anivia', pageClass: 'page-pantheon-anivia', name: 'sottocollezione' }
]

for (const target of INTERNAL_PAGES) {
  test(`la pagina ${target.name} non mostra le sezioni della Home`, async ({ page }) => {
    await page.goto(target.path)
    await waitForShell(page)
    await expectInternalView(page, target.path, target.pageClass)
  })
}

test('Home → pagina interna → altra pagina interna → Home', async ({ page }) => {
  await page.goto('/')
  await waitForShell(page)
  await expectHomeView(page)

  await spaGp(page, 'pag-arcamis', 'Arcamis')
  await expectInternalView(page, '/lore/arcamis', 'page-pag-arcamis')

  await spaGp(page, 'pag-regole-del-server', 'Regole del Server')
  await expectInternalView(page, '/regole/regole-del-server', 'page-pag-regole-del-server')

  await spaHome(page)
  await expectHomeView(page)
})

test('indietro e avanti ripristinano la vista corretta', async ({ page }) => {
  await page.goto('/')
  await waitForShell(page)
  await expectHomeView(page)

  await spaGp(page, 'pag-arcamis', 'Arcamis')
  await expectInternalView(page, '/lore/arcamis', 'page-pag-arcamis')
  await spaGp(page, 'pag-regole-del-server', 'Regole del Server')
  await expectInternalView(page, '/regole/regole-del-server', 'page-pag-regole-del-server')

  await page.goBack()
  await expectInternalView(page, '/lore/arcamis', 'page-pag-arcamis')

  await page.goForward()
  await expectInternalView(page, '/regole/regole-del-server', 'page-pag-regole-del-server')

  await page.goBack()
  await expectInternalView(page, '/lore/arcamis', 'page-pag-arcamis')

  await page.goBack()
  await expectHomeView(page)
})

test('apertura diretta e refresh di una pagina interna restano su #pv', async ({ page }) => {
  await page.goto('/regole/regole-del-server')
  await waitForShell(page)
  await expectInternalView(page, '/regole/regole-del-server', 'page-pag-regole-del-server')

  await page.reload()
  await waitForShell(page)
  await expectInternalView(page, '/regole/regole-del-server', 'page-pag-regole-del-server')
})

test('navigazioni rapide: vince l’ultima pagina, non la richiesta più lenta', async ({ page }) => {
  await page.goto('/')
  await waitForShell(page)
  await expectHomeView(page)

  /* Arcamis arriva per ultima: senza token di render sovrascriverebbe Lavori. */
  await page.route('**/content/pages/arcamis.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.continue()
  })

  await spaGp(page, 'pag-arcamis', 'Arcamis')
  await spaGp(page, 'pag-regole-del-server', 'Regole del Server')
  await spaGp(page, 'pag-lavori', 'Lavori')

  await expectInternalView(page, '/personaggio/lavori', 'page-pag-lavori')
  await page.waitForTimeout(500)
  await expectInternalView(page, '/personaggio/lavori', 'page-pag-lavori')

  await spaHome(page)
  await expectHomeView(page)
  await page.waitForTimeout(400)
  await expectHomeView(page)
})

test('tornare alla Home durante il caricamento non riapre la pagina', async ({ page }) => {
  await page.goto('/')
  await waitForShell(page)
  await expectHomeView(page)

  await page.route('**/content/pages/arcamis.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.continue()
  })

  await spaGp(page, 'pag-arcamis', 'Arcamis')
  await page.waitForTimeout(50)
  await spaHome(page)

  await expectHomeView(page)
  await page.waitForTimeout(500)
  await expectHomeView(page)
  await expect(page.locator('#pbody')).toBeHidden()
})
