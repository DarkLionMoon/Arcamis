import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   Editor del carousel

   Prima si poteva salvare solo l'immagine: qui si modificano testi e
   bottoni, si sceglie lo sfondo dalla libreria media e si verifica cosa
   arriva davvero a `set_carousel`.
   ════════════════════════════════════════════════════════════════ */

const MEDIA = [
  { name: 'porto.webp', path: 'images/porto.webp', sha: 'm1', size: 2048, type: 'file' },
  { name: 'foresta.webp', path: 'images/foresta.webp', sha: 'm2', size: 4096, type: 'file' }
]

const SLIDES = [
  {
    key: 'carousel_0',
    img: '',
    meta: { tag: 'Città Portuale', tit: 'ARCAMIS', desc: 'Porta d’ingresso al regno.' },
    btns: [{ label: 'Entra nel Discord', href: 'https://discord.gg/x' }]
  },
  { key: 'carousel_1', img: '', meta: {}, btns: [] },
  { key: 'carousel_2', img: '', meta: {}, btns: [] }
]

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
)

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

interface Saved {
  savedCarousel?: unknown[]
}

async function mockBackend(page: Page): Promise<Saved> {
  const state: Saved = {}
  await page.route('**/images/*', (route) =>
    route.fulfill({ status: 200, contentType: 'image/webp', body: PNG })
  )
  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'brian', role: 'admin', csrf: 'e2e' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/admin?action=get_carousel', (route) => json(route, { slides: SLIDES }))
  await page.route('**/api/admin?action=set_carousel', async (route) => {
    state.savedCarousel = (state.savedCarousel || []).concat([route.request().postDataJSON()])
    return json(route, { ok: true })
  })
  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as { action: string; payload: Record<string, unknown> }
    if (body.action === 'get' && String(body.payload.path) === 'images') {
      return json(route, { data: MEDIA })
    }
    return json(route, { data: null })
  })
  return state
}

test.describe('editor del carousel', () => {
  test('modifica testi e bottoni con anteprima immediata e li salva', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    await expect(page.getByRole('heading', { name: 'Carousel Homepage' })).toBeVisible()
    await expect(page.locator('.arc-carousel-card')).toHaveCount(3)

    const card = page.locator('.arc-carousel-card').first()
    await expect(card.locator('.arc-slide-title')).toHaveText('ARCAMIS')

    /* Anteprima istantanea: si scrive nel campo, la card cambia subito. */
    await card.locator('input[placeholder="ARCAMIS"]').fill('ARCAMIS — IL PORTO')
    await expect(card.locator('.arc-slide-title')).toHaveText('ARCAMIS — IL PORTO')

    /* Immagine dalla libreria media, non un URL incollato a mano. */
    await card.getByRole('button', { name: 'Libreria' }).click()
    await expect(page.locator('.arc-drawer-item')).toHaveCount(2)
    await page.locator('.arc-drawer-item[title="porto.webp"]').click()
    await expect(card.locator('.arc-slide-preview')).toHaveAttribute('style', /\/images\/porto\.webp/)

    /* Bottone: testo modificato e nuovo bottone aggiunto. */
    await card.locator('.arc-btn-editor input').first().fill('Entra ora')
    await card.getByRole('button', { name: 'Aggiungi bottone' }).click()
    const rows = card.locator('.arc-btn-editor')
    await rows.nth(1).locator('input').first().fill('Scopri di più')
    await rows.nth(1).locator('input').nth(1).fill('/arcamis')

    await expect(card.locator('.arc-slide-btn')).toHaveText(['Entra ora', 'Scopri di più'])

    await card.getByRole('button', { name: 'Salva slide' }).click()
    await expect.poll(() => state.savedCarousel?.length).toBe(1)
    expect(state.savedCarousel?.[0]).toEqual({
      key: 'carousel_0',
      img: '/images/porto.webp',
      meta: { tag: 'Città Portuale', tit: 'ARCAMIS — IL PORTO', desc: 'Porta d’ingresso al regno.' },
      btns: [
        { label: 'Entra ora', href: 'https://discord.gg/x' },
        { label: 'Scopri di più', href: '/arcamis' }
      ]
    })
    await expect(card.locator('.arc-slide-state')).toHaveText('Salvata')
  })

  test('senza modifiche non riscrive la slide', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    const card = page.locator('.arc-carousel-card').first()
    await expect(card.locator('.arc-slide-state')).toHaveText('Salvata')
    await expect(card.getByRole('button', { name: 'Salva slide' })).toBeDisabled()
    expect(state.savedCarousel || []).toHaveLength(0)
  })
})
