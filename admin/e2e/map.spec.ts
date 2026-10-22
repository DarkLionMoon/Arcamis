import fs from 'node:fs'
import path from 'node:path'

import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   Editor della mappa

   Il bug segnalato dalla revisione: aggiungere o trascinare una puntina
   azzerava la Y, perché l'offset del drag mescolava coordinate del
   viewport e del canvas e la posizione veniva schiacciata a 0.00% in
   cima alla mappa. Qui si trascina con il mouse vero e si controlla la
   percentuale salvata, non solo che la puntina si sia mossa.
   ════════════════════════════════════════════════════════════════ */

const MAP = {
  mapImage: '/mappa.webp',
  pins: [
    {
      id: 'pin-arcamis',
      type: 'city',
      left: '50.00%',
      top: '50.00%',
      explored: true,
      sub: '',
      pageId: 'pag-arcamis',
      name: 'Arcamis',
      desc: 'Città portuale.'
    }
  ]
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
)

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

function b64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64')
}

interface Saved {
  savedMappins?: unknown
}

async function mockBackend(page: Page, mapData: unknown = MAP): Promise<Saved> {
  const state: Saved = {}
  await page.route('**/mappa.webp', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
  )
  await page.route('**/images/*', (route) =>
    route.fulfill({ status: 200, contentType: 'image/webp', body: PNG })
  )
  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'brian', role: 'admin', csrf: 'e2e' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as { action: string; payload: Record<string, unknown> }
    const path = String(body.payload.path || '')
    if (body.action === 'get' && path === 'content/mappins.json') {
      return json(route, { data: { content: b64(JSON.stringify(mapData)), sha: 'sha-map' } })
    }
    if (body.action === 'get' && path === 'images') return json(route, { data: [] })
    if (body.action === 'put' && path === 'content/mappins.json') {
      state.savedMappins = JSON.parse(
        Buffer.from(String(body.payload.content), 'base64').toString('utf8')
      )
      return json(route, { data: { content: { sha: 'sha-new' } } })
    }
    return json(route, { data: null })
  })
  return state
}

test.describe('editor della mappa', () => {
  test('aggiunge una puntina dove si clicca e la trascina senza azzerare la Y', async ({ page }) => {
    const state = await mockBackend(page)
    await page.goto('/admin/app.html#/mapa')
    await expect(page.getByRole('heading', { name: 'Editor Mappa' })).toBeVisible()
    await expect(page.locator('.arc-pin')).toHaveCount(1)

    const canvas = page.locator('.arc-map-canvas')
    const box = (await canvas.boundingBox())!
    /* Clic al 50% / 30% del canvas: la puntina nuova deve nascere lì. */
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.3)
    await expect(page.locator('.arc-pin')).toHaveCount(2)
    const yField = page.locator('.arc-map-edit input').nth(2)
    const xField = page.locator('.arc-map-edit input').nth(1)
    const addedY = Number.parseFloat(await yField.inputValue())
    expect(addedY).toBeGreaterThan(28)
    expect(addedY).toBeLessThan(31)
    expect(await yField.inputValue()).not.toBe('0.00%')

    /* Trascinamento con il mouse vero dalla puntina nuova all'80%/70%. */
    const pin = page.locator('.arc-pin').nth(1)
    const pinBox = (await pin.boundingBox())!
    await page.mouse.move(pinBox.x + pinBox.width / 2, pinBox.y + pinBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7, { steps: 8 })
    await page.mouse.up()

    const draggedX = Number.parseFloat(await xField.inputValue())
    const draggedY = Number.parseFloat(await yField.inputValue())
    expect(draggedX).toBeGreaterThan(78)
    expect(draggedY).toBeGreaterThan(68)
    expect(draggedY).toBeLessThan(71)
    expect(await yField.inputValue()).not.toBe('0.00%')

    /* Anche la descrizione è un campo dell’editor, non solo la posizione. */
    await page.locator('.arc-map-edit textarea').fill('Descrizione aggiornata dall’editor')
    await page.locator('.arc-map-edit').getByRole('button', { name: 'Salva' }).click()
    await expect(page.locator('.arc-map-edit textarea')).toHaveValue('Descrizione aggiornata dall’editor')

    await page.locator('.arc-head-actions').getByRole('button', { name: 'Salva' }).click()
    await expect
      .poll(() => (state.savedMappins as { pins: Array<{ top: string }> })?.pins?.length)
      .toBe(2)
    const pins = (state.savedMappins as { pins: Array<{ top: string; left: string; desc: string }> }).pins
    expect(pins[1].top).not.toBe('0.00%')
    expect(Number.parseFloat(pins[1].top)).toBeGreaterThan(60)
    expect(pins[1].desc).toBe('Descrizione aggiornata dall’editor')
  })

  test('carica i 12 pin reali e modifica la descrizione senza perderne nessuno', async ({ page }) => {
    const realMap = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), '../content/mappins.json'), 'utf8')
    ) as { mapImage: string; pins: Array<Record<string, unknown>> }
    const state = await mockBackend(page, realMap)

    await page.goto('/admin/app.html#/mapa')
    await expect(page.locator('.arc-pin')).toHaveCount(realMap.pins.length)
    await page.locator('.arc-pin').first().click()

    await page.locator('.arc-map-edit textarea').fill('Descrizione reale aggiornata')
    await page.locator('.arc-map-edit').getByRole('button', { name: 'Salva' }).click()
    await page.locator('.arc-head-actions').getByRole('button', { name: 'Salva' }).click()

    await expect
      .poll(() => (state.savedMappins as { pins: Array<{ desc: string }> })?.pins?.length)
      .toBe(realMap.pins.length)
    const pins = (state.savedMappins as { pins: Array<{ desc: string }> }).pins
    expect(pins[0].desc).toBe('Descrizione reale aggiornata')
  })
})
