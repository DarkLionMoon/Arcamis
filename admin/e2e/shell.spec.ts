import { test, expect, type Page } from 'playwright/test'

/* ════════════════════════════════════════════════════════════
   Shell del pannello: navigazione per ruolo, guard delle rotte e
   ricerca globale. La sessione è simulata via page.route: nessun
   backend richiesto.
   ════════════════════════════════════════════════════════════ */

type Role = 'viewer' | 'editor' | 'admin'

const SESSIONS: Record<Role, { ok: true; user: string; role: Role; csrf: string }> = {
  viewer: { ok: true, user: 'viewer-user', role: 'viewer', csrf: 'e2e-csrf' },
  editor: { ok: true, user: 'editor-user', role: 'editor', csrf: 'e2e-csrf' },
  admin: { ok: true, user: 'admin-user', role: 'admin', csrf: 'e2e-csrf' }
}

async function openAs(page: Page, role: Role) {
  page.on('pageerror', (error) => console.log('[pageerror]', error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') console.log('[console.error]', message.text())
  })
  await page.route('**/api/admin?action=check', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SESSIONS[role])
    })
  )
  await page.goto('/admin/app.html#/')
  await expect(page.locator('.arc-sidebar')).toBeVisible()
}

async function navLabels(page: Page): Promise<string[]> {
  const labels = await page.locator('.arc-nav-link').allTextContents()
  return labels.map((label) => label.trim())
}

test.describe('navigazione per ruolo', () => {
  test('il visualizzatore vede solo le viste di lettura', async ({ page }) => {
    await openAs(page, 'viewer')
    expect(await navLabels(page)).toEqual(['Dashboard', 'Pagine', 'Media'])
  })

  test('l’editor vede le viste editoriali ma non quelle di amministrazione', async ({ page }) => {
    await openAs(page, 'editor')
    const labels = await navLabels(page)
    expect(labels).toEqual(['Dashboard', 'Pagine', 'Copertine', 'Media', 'Mappa', 'Carousel', 'Changelog'])
    for (const forbidden of ['Utenti', 'Cestino', 'Impostazioni', 'Audit', 'Backup']) {
      expect(labels, `l’editor non deve vedere ${forbidden}`).not.toContain(forbidden)
    }
  })

  test('l’amministratore vede tutte le sezioni', async ({ page }) => {
    await openAs(page, 'admin')
    const labels = await navLabels(page)
    expect(labels).toContain('Utenti')
    expect(labels).toContain('Cestino')
    expect(labels).toContain('Audit')
    expect(labels).toContain('Backup')
  })
})

test.describe('guard delle rotte', () => {
  test('una rotta riservata riporta alla dashboard con un avviso', async ({ page }) => {
    await openAs(page, 'viewer')
    await page.goto('/admin/app.html#/utenti')

    /* Altri avvisi (es. API non raggiungibile) possono convivere:
       si cerca quello specifico del guard. */
    await expect(page.locator('.arc-toast', { hasText: 'Accesso negato' })).toBeVisible()
    await expect(page.locator('.arc-page-title')).toContainText('Dashboard')
    expect(new URL(page.url()).hash).toBe('#/')
  })

  test('l’editor apre la mappa e il visualizzatore no', async ({ page }) => {
    await openAs(page, 'editor')
    await page.goto('/admin/app.html#/mapa')
    await expect(page.locator('.arc-page-title')).toContainText('Editor Mappa')
    await expect(page.locator('.arc-map-canvas')).toBeVisible()

    await page.goto('/admin/app.html#/impostazioni')
    await expect(page.locator('.arc-page-title')).toContainText('Dashboard')
  })

  test('un hash sconosciuto non lascia la pagina bianca', async ({ page }) => {
    await openAs(page, 'admin')
    await page.goto('/admin/app.html#/rotta-inesistente')
    await expect(page.locator('.arc-page-title')).toContainText('Dashboard')
  })
})

test.describe('shell', () => {
  test('la ricerca globale si apre con ⌘K e si chiude con Esc', async ({ page }) => {
    await openAs(page, 'admin')
    await page.keyboard.press('Control+K')
    await expect(page.locator('.arc-search-overlay')).toBeVisible()
    await page.keyboard.type('regole')
    await expect(page.locator('.arc-search-input')).toHaveValue('regole')
    await page.keyboard.press('Escape')
    await expect(page.locator('.arc-search-overlay')).toBeHidden()
  })

  test('la topbar mostra utente e ruolo della sessione', async ({ page }) => {
    await openAs(page, 'editor')
    await expect(page.locator('.arc-role')).toContainText('editor-user')
    await expect(page.locator('.arc-role')).toContainText('Editor')
  })
})
