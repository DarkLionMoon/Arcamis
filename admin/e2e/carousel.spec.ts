import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   Editor del carousel — manifest dinamico.

   Numero, ordine, visibilità, contenuti e rotazione si salvano in
   un'unica scrittura (`set_carousel_config`); qui si verifica cosa
   arriva davvero al backend e che reset cancella il manifest.
   ════════════════════════════════════════════════════════════════ */

const MEDIA = [
  { name: 'porto.webp', path: 'images/porto.webp', sha: 'm1', size: 2048, type: 'file' },
  { name: 'foresta.webp', path: 'images/foresta.webp', sha: 'm2', size: 4096, type: 'file' }
]

function seedSlide(id: string, label: string, tit: string) {
  return {
    id,
    label,
    img: '',
    tag: `Tag ${tit}`,
    tit,
    desc: `Descrizione ${tit}.`,
    btns: [{ label: `Bottone ${tit}`, href: '' }],
    hidden: false
  }
}

const SEED = {
  managed: false,
  slides: [seedSlide('carousel_0', 'Slide 1 — Arcamis Porto', 'ARCAMIS'), seedSlide('carousel_1', 'Slide 2 — Pantheon', 'PANTHEON'), seedSlide('carousel_2', 'Slide 3 — Personaggio', 'EROE')],
  settings: { intervalMs: 6000, pauseOnHover: true }
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
)

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

interface Saved {
  savedConfig?: unknown[]
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
  await page.route('**/api/admin?action=get_carousel_config', (route) => json(route, SEED))
  await page.route('**/api/admin?action=set_carousel_config', async (route) => {
    state.savedConfig = (state.savedConfig || []).concat([route.request().postDataJSON()])
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
  test('modifica testi, rotazione e salva tutto in una sola chiamata', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    await expect(page.getByRole('heading', { name: 'Carousel Homepage' })).toBeVisible()
    await expect(page.locator('.arc-carousel-card')).toHaveCount(3)
    await expect(page.locator('.arc-chip').first()).toHaveText('Default del sito')

    const card = page.locator('.arc-carousel-card').first()
    await expect(card.locator('.arc-slide-title')).toHaveText('ARCAMIS')

    /* Anteprima istantanea: si scrive nel campo, la card cambia subito. */
    await card.locator('input[placeholder="Titolo della slide"]').fill('ARCAMIS — IL PORTO')
    await expect(card.locator('.arc-slide-title')).toHaveText('ARCAMIS — IL PORTO')

    /* Sottotitolo: campo nuovo, anteprima e payload lo riportano. */
    await card.locator('input[placeholder="Sottotitolo della slide"]').fill('La città sul mare')
    await expect(card.locator('.arc-slide-sub')).toHaveText('La città sul mare')

    /* Immagine dalla libreria media, non un URL incollato a mano. */
    await card.getByRole('button', { name: 'Libreria' }).click()
    await expect(page.locator('.arc-drawer-item')).toHaveCount(2)
    await page.locator('.arc-drawer-item[title="porto.webp"]').click()
    await expect(card.locator('.arc-slide-preview')).toHaveAttribute('style', /\/images\/porto\.webp/)

    /* Rotazione: 9 secondi, senza pausa su hover. */
    await page.locator('.arc-panel input[type="number"]').fill('9')
    await page.locator('.arc-toggle-line input[type="checkbox"]').uncheck()

    await page.getByRole('button', { name: 'Salva tutto' }).first().click()
    await expect.poll(() => state.savedConfig?.length).toBe(1)
    const payload = state.savedConfig?.[0] as { slides: Array<Record<string, unknown>>; settings: Record<string, unknown> }
    expect(payload.slides).toHaveLength(3)
    expect(payload.slides[0]).toMatchObject({
      id: 'carousel_0',
      img: '/images/porto.webp',
      tag: 'Tag ARCAMIS',
      tit: 'ARCAMIS — IL PORTO',
      sub: 'La città sul mare'
    })
    expect(payload.settings).toEqual({ intervalMs: 9000, pauseOnHover: false })
    await expect(card.locator('.arc-chip')).toHaveText('Salvato')
  })

  test('aggiunge, nasconde e riordina le slide', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    await expect(page.locator('.arc-carousel-card')).toHaveCount(3)

    /* Nuova slide in coda. */
    await page.getByRole('button', { name: /Aggiungi slide/ }).click()
    await expect(page.locator('.arc-carousel-card')).toHaveCount(4)
    const last = page.locator('.arc-carousel-card').nth(3)
    await last.locator('input[placeholder="Titolo della slide"]').fill('EVENTO SPECIALE')

    /* Nasconde la seconda e sposta la prima in basso. */
    await page.locator('.arc-carousel-card').nth(1).getByRole('button', { name: 'Nascondi' }).click()
    await page.locator('.arc-carousel-card').first().getByRole('button', { name: 'Sposta giù' }).click()

    await page.getByRole('button', { name: 'Salva tutto' }).first().click()
    await expect.poll(() => state.savedConfig?.length).toBe(1)
    const payload = state.savedConfig?.[0] as { slides: Array<Record<string, unknown>> }
    expect(payload.slides.map((s) => s.id)).toEqual(['carousel_1', 'carousel_0', 'carousel_2', 'nuova-slide'])
    expect(payload.slides.find((s) => s.id === 'carousel_1')).toMatchObject({ hidden: true })
    expect(payload.slides.find((s) => s.id === 'nuova-slide')).toMatchObject({ tit: 'EVENTO SPECIALE' })
  })

  test('elimina una slide con conferma', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    await expect(page.locator('.arc-carousel-card')).toHaveCount(3)

    await page.locator('.arc-carousel-card').nth(2).getByRole('button', { name: 'Elimina slide' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Elimina slide' }).click()
    await expect(page.locator('.arc-carousel-card')).toHaveCount(2)

    await page.getByRole('button', { name: 'Salva tutto' }).first().click()
    await expect.poll(() => state.savedConfig?.length).toBe(1)
    const payload = state.savedConfig?.[0] as { slides: Array<Record<string, unknown>> }
    expect(payload.slides.map((s) => s.id)).toEqual(['carousel_0', 'carousel_1'])
  })

  test('reset cancella il manifest', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    await expect(page.locator('.arc-carousel-card')).toHaveCount(3)

    await page.locator('.arc-carousel-card').first().getByRole('button', { name: 'Reset tutto' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Reset ai default' }).click()
    await expect.poll(() => state.savedConfig?.length).toBe(1)
    expect(state.savedConfig?.[0]).toEqual({ reset: true })
    /* Dopo il reset si ricaricano i seed: di nuovo default del sito. */
    await expect(page.locator('.arc-chip').first()).toHaveText('Default del sito')
  })

  test('senza modifiche non salva nulla', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/carousel')
    await expect(page.locator('.arc-carousel-card')).toHaveCount(3)
    await expect(page.getByRole('button', { name: 'Salva tutto' }).first()).toBeDisabled()
    expect(state.savedConfig || []).toHaveLength(0)
  })
})
