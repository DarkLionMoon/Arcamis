import { test, expect } from 'playwright/test'

test.describe('Vue admin shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin?action=check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: 'viewer', role: 'viewer', csrf: 'e2e-csrf' })
      })
    })
    await page.goto('/admin/app.html#/')
  })

  test('renders navigation with all migrated views (viewer set)', async ({ page }) => {
    const links = await page.locator('.arc-nav-link').allTextContents()
    expect(links.map((l) => l.trim())).toEqual([
      '📊 Dashboard',
      '📄 Pagine',
      '🖼 Copertine',
      '📍 Mappa',
      '🎠 Carousel',
      '📁 Media',
      '📋 Changelog'
    ])
  })

  test('hash router renders the map editor route', async ({ page }) => {
    await page.click('.arc-nav-link[href="#/mapa"]')
    await expect(page.locator('.arc-page-title')).toContainText('Editor Mappa')
    await expect(page.locator('.arc-map-canvas')).toBeVisible()
    await expect(page.locator('.arc-map-edit')).toBeVisible()
  })

  test('hash router renders the users route (login gate)', async ({ page }) => {
    await page.unroute('**/api/admin?action=check')
    await page.route('**/api/admin?action=check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: 'viewer', role: 'viewer', csrf: 'e2e-csrf' })
      })
    })
    await page.goto('/admin/app.html#/utenti')
    await expect(page.locator('.arc-page-title')).toContainText('Utenti')
    await expect(page.locator('.arc-alert')).toBeVisible()
  })

  test('hash router renders the carousel route', async ({ page }) => {
    await page.click('.arc-nav-link[href="#/carousel"]')
    await expect(page.locator('.arc-page-title')).toContainText('Carousel Homepage')
  })

  test('hash router renders the changelog route', async ({ page }) => {
    await page.goto('/admin/app.html#/changelog')
    await expect(page.locator('.arc-page-title')).toContainText('Changelog')
  })

  test('hash router renders the settings route (admin gate)', async ({ page }) => {
    await page.unroute('**/api/admin?action=check')
    await page.route('**/api/admin?action=check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, user: 'viewer', role: 'viewer', csrf: 'e2e-csrf' })
      })
    })
    await page.goto('/admin/app.html#/impostazioni')
    await expect(page.locator('.arc-page-title')).toContainText('Impostazioni')
    await expect(page.locator('.arc-alert')).toBeVisible()
  })

  test('global search overlay opens with ⌘K and closes with Esc', async ({ page }) => {
    await page.keyboard.press('Control+K')
    await expect(page.locator('.arc-search-overlay')).toBeVisible()
    await expect(page.locator('.arc-search-input')).toBeVisible()
    await page.keyboard.type('regole')
    await expect(page.locator('.arc-search-input')).toHaveValue('regole')
    await page.keyboard.press('Escape')
    await expect(page.locator('.arc-search-overlay')).toBeHidden()
  })
})
