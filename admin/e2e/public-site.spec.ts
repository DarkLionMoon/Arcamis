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
/* ── Contenuti importati: integrazione visiva reale ─────────
   Non fixture: le rotte del build contengono i file migrati. Le pagine
   lunghe non usano più i vecchi listoni: il pattern è quello configurato
   in `explore` e reso da `explorer.js`. */
test.describe('contenuti migrati sul sito', () => {
  test('le specie sono un master-detail: 33 schede, filtro per tipologia e deep link', async ({ page }) => {
    await page.goto('/lore/specie-homebrew')
    await expect(page.locator('.exp-item')).toHaveCount(33)
    await expect(page.locator('.exp-sidebar-count')).toHaveText('33 specie')
    await expect(page.locator('.exp-pill', { hasText: 'Umanoide' })).toBeVisible()
    await expect(page.locator('.exp-title')).not.toBeEmpty()

    await page.locator('.exp-item').filter({ hasText: 'Besheb' }).click()
    await expect(page.locator('.exp-title')).toHaveText('Besheb')
    expect(page.url()).toContain('#specie/besheb')

    await page.locator('.exp-pill', { hasText: 'Umanoide' }).click()
    const filtered = await page.locator('.exp-item').count()
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(33)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })

  test('le sottoclassi sono un catalogo per classe: colonna classi, linguette e scheda', async ({ page }) => {
    await page.goto('/lore/sottoclassi-homebrew')
    const classi = page.locator('.exp-gt-class')
    await expect(classi).toHaveCount(12)
    await expect(page.locator('.exp-sidebar-count')).toHaveText('12 classi · 18 sottoclassi')

    /* Barbaro ha tre sottoclassi: linguette a destra, la prima attiva. */
    await classi.filter({ hasText: 'Barbaro' }).click()
    await expect(page.locator('.exp-gt-title')).toHaveText('Barbaro')
    await expect(page.locator('.exp-gt-tab')).toHaveCount(3)
    await expect(page.locator('.exp-gt-tab').first()).toHaveClass(/is-active/)
    await expect(page.locator('.exp-gt-body')).toContainText('Dono degli Annegati')

    await page.locator('.exp-gt-tab', { hasText: 'Sentiero del gelo' }).click()
    await expect(page.locator('.exp-gt-body')).toContainText('Vene di ghiaccio')
    expect(page.url()).toContain('#sottoclassi/sentiero-del-gelo')

    /* La ricerca filtra sia i gruppi sia le linguette. */
    await page.locator('[data-exp-search]').fill('Bandle')
    await expect(classi).toHaveCount(1)
    await expect(classi).toContainText('Stregone')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })

  test('il pantheon è una griglia con drawer laterale, inclusa l’entità senza immagine', async ({ page }) => {
    await page.goto('/lore/pantheon')
    await expect(page.locator('.exp-tile')).toHaveCount(20)
    await expect(page.locator('.exp-tile img')).toHaveCount(19)
    expect(
      await page.locator('.exp-tile img').evaluateAll((nodes) => nodes.filter((n) => n.getAttribute('loading') !== 'lazy').length)
    ).toBe(0)

    await page.locator('.exp-tile').filter({ hasText: 'Nocturne' }).click()
    const drawer = page.locator('.exp-drawer')
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('Il Demone degli Incubi')
    expect(page.url()).toContain('#pantheon/')

    await drawer.locator('[data-exp-close]').first().click()
    await expect(drawer).toBeHidden()
  })

  test('i lavori sono un master-detail con 10 schede e la copertina nella scheda', async ({ page }) => {
    await page.goto('/personaggio/lavori')
    await expect(page.locator('.exp-item')).toHaveCount(10)
    await page.locator('.exp-item').filter({ hasText: 'Biblioteca' }).click()
    await expect(page.locator('.exp-hero img')).toHaveAttribute('src', /biblioteca/)
  })

  test('la mappa della home carica i 12 pin reali con coordinate valide', async ({ page }) => {
    await page.goto('/')
    const pins = page.locator('#dynamic-pins .mpin')
    await expect(pins).toHaveCount(12)
    const invalid = await pins.evaluateAll((nodes) =>
      nodes.filter((n) => {
        const left = Number.parseFloat((n as HTMLElement).style.left)
        const top = Number.parseFloat((n as HTMLElement).style.top)
        return !Number.isFinite(left) || !Number.isFinite(top) || left <= 0 || top <= 0
      }).length
    )
    expect(invalid).toBe(0)
  })
})

/* Il menu mobile è montato da custom-nav.js, che può girare più di una volta
   in attesa dei dati: le sezioni non devono comparire due volte. */
test('il menu mobile non duplica sezioni e voci', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('#hamburger').click()
  const nav = page.locator('#mobile-nav')
  await expect(nav).toBeVisible()
  await expect(nav.locator('.mn-item').first()).toBeVisible()

  const ids = await nav.locator('.mn-section[id]').evaluateAll((nodes) => nodes.map((n) => n.id))
  expect(new Set(ids).size).toBe(ids.length)
  const items = await nav.locator('.mn-item').evaluateAll((nodes) => nodes.map((n) => (n.textContent || '').trim()))
  expect(new Set(items).size).toBe(items.length)
})

/* ── Pagina entità (Fase 1) ────────────────────────────────── */
test.describe('scheda entità pilota', () => {
  test('hero, rail dei metadati e tab su una divinità', async ({ page }) => {
    await page.goto('/lore/pantheon/anivia')

    await expect(page.locator('.arc-entity')).toBeVisible()
    await expect(page.locator('.arc-hero-title')).toHaveText('Anivia')
    await expect(page.locator('.arc-hero-img')).toHaveAttribute('src', /pantheon/)
    await expect
      .poll(() => page.locator('.arc-hero-img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true)

    /* La vecchia testata di pagina non si sovrappone all'hero nuovo. */
    await expect(page.locator('#page-hero')).toBeHidden()

    await expect(page.locator('.arc-meta dt')).toHaveText(['Epiteto', 'Allineamento', 'Sfere', 'Simbolo'])
    await expect(page.locator('.arc-meta dd').first()).toHaveText('La Criofenice')

    const tabs = page.locator('.arc-tab')
    await expect(tabs).toHaveCount(2)
    await expect(page.locator('.arc-tab[aria-selected="true"]')).toHaveText('Personalità')
    await expect(page.locator('#arc-panel-0')).toBeVisible()
    await expect(page.locator('#arc-panel-1')).toBeHidden()

    await tabs.filter({ hasText: 'Culto' }).click()
    await expect(page.locator('#arc-panel-1')).toBeVisible()
    await expect(page.locator('#arc-panel-0')).toBeHidden()
    await expect(page.locator('#arc-panel-1')).toContainText('Tempio')

    /* Frecce: il tab selezionato si sposta e riceve il focus. */
    await page.locator('.arc-tab[aria-selected="true"]').press('ArrowLeft')
    await expect(page.locator('.arc-tab[aria-selected="true"]')).toHaveText('Personalità')
    await expect(page.locator('#arc-panel-0')).toBeVisible()

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })

  test('su mobile il rail precede il testo e le tab restano usabili', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/lore/pantheon/anivia')

    const rail = await page.locator('.arc-rail').boundingBox()
    const tabs = await page.locator('.arc-tabs').boundingBox()
    expect(rail!.y).toBeLessThan(tabs!.y)

    await page.locator('.arc-tab').filter({ hasText: 'Culto' }).click()
    await expect(page.locator('#arc-panel-1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })
})

/* ── Topbar con mega-menu ─────────────────────────────────── */
test.describe('mega-menu della topbar', () => {
  test('si apre al passaggio del mouse, resta nella finestra e naviga', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/lore/pantheon')

    const lore = page.locator('#dd-lore')
    await lore.hover()
    const menu = lore.locator('.tn-menu')
    await expect(menu).toBeVisible()
    await expect(lore.locator('.tn-mega-links .tn-item')).toHaveCount(2)
    await expect(lore.locator('.tn-mega-count')).toHaveText('2 voci')
    await expect(lore.locator('.tn-mega-feature-title')).toHaveText('La Storia di Gandora')

    const box = (await menu.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(1280)

    await menu.locator('.tn-item', { hasText: 'Pantheon' }).click()
    await expect(page.locator('.exp-tile').first()).toBeVisible()
    await expect(menu).toBeHidden()
  })

  test('nelle sezioni con una sola voce il pannello resta compatto', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')

    const pg = page.locator('#dd-pg')
    await pg.hover()
    const menu = pg.locator('.tn-menu')
    await expect(menu).toBeVisible()
    await expect(pg.locator('.tn-mega-count')).toHaveText('1 voce')
    await expect(pg.locator('.tn-mega-feature')).toBeHidden()
    expect((await menu.boundingBox())!.width).toBeLessThanOrEqual(440)

    /* Escape chiude il pannello. */
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })
})

/* ── I quattro pattern sulle pagine reali ─────────────────── */
test.describe('pattern di esplorazione', () => {
  test('la lore lunga usa schede orizzontali e indice sticky', async ({ page }) => {
    await page.goto('/lore/introduzione')
    await expect(page.locator('.exp-tab')).toHaveCount(5)
    await expect(page.locator('.exp-tab-section')).toHaveCount(3)
    await expect(page.locator('.exp-toc a')).toHaveCount(3)

    await page.locator('.exp-tab', { hasText: 'Valoran e città' }).click()
    await expect(page.locator('.exp-tab-section')).toHaveCount(6)
    await expect(page.locator('.exp-toc a')).toHaveCount(6)
    expect(page.url()).toContain('#introduzione/valoran')
  })

  test('anche la storia di Gandora e i crediti usano le schede', async ({ page }) => {
    await page.goto('/lore/la-storia-di-gandora')
    await expect(page.locator('.exp-tab')).toHaveCount(4)
    await page.locator('.exp-tab', { hasText: 'Il Soffio' }).click()
    await expect(page.locator('.exp-tab-section')).toContainText('Il Drago non concedeva udienze')

    await page.goto('/credits')
    await expect(page.locator('.exp-tab')).toHaveCount(4)
    await page.locator('.exp-tab', { hasText: 'Privacy' }).click()
    await expect(page.locator('.exp-tab-section')).toContainText('Dati tecnici')
  })

  test('le regole sono macro-categorie richiudibili con ricerca', async ({ page }) => {
    await page.goto('/regole/regole-del-server')
    await expect(page.locator('.exp-acc-group')).toHaveCount(3)
    await expect(page.locator('.exp-acc-item')).toHaveCount(22)
    await expect(page.locator('.exp-acc-group[open]')).toHaveCount(1)

    await page.locator('[data-exp-search]').fill('Erotic-Roleplay')
    await expect(page.locator('.exp-acc-item:visible')).toHaveCount(1)
    /* Azzerare la ricerca riporta l'accordion allo stato di partenza:
       solo la prima macro-categoria aperta. */
    await page.locator('[data-exp-search]').fill('')
    await expect(page.locator('.exp-acc-group[open]')).toHaveCount(1)
    await expect(page.locator('.exp-acc-item:visible')).toHaveCount(9)
  })

  test('su mobile il master-detail diventa lista → dettaglio', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/lore/specie-homebrew')
    await expect(page.locator('.exp-sidebar')).toBeVisible()
    await expect(page.locator('.exp-detail')).toBeHidden()

    await page.locator('.exp-item').first().click()
    await expect(page.locator('.exp-detail')).toBeVisible()
    await expect(page.locator('.exp-sidebar')).toBeHidden()

    await page.locator('.exp-back').click()
    await expect(page.locator('.exp-sidebar')).toBeVisible()
    await expect(page.locator('.exp-detail')).toBeHidden()
  })
})

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