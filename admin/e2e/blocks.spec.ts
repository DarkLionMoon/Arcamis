import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   Editor a blocchi

   Il patto è: i blocchi sono una vista sul markdown, non un formato
   nuovo. Qui si verifica su una pagina libera che aprire i blocchi non
   cambi il testo salvato e che una modifica nei blocchi arrivi al
   markdown (e quindi all'anteprima e al salvataggio).
   ════════════════════════════════════════════════════════════════ */

const CONTENT = [
  '## Regola 1 — Accesso',
  '',
  'Entrando dichiari di essere **maggiorenne**.',
  '',
  ':::cards',
  '### PvP',
  'Solo su consenso.',
  '',
  '### PvE',
  'Sempre aperto.',
  ':::'
].join('\n')

const PAGE = {
  k: 'regole',
  title: 'Regole',
  icon: '📋',
  layout: '',
  content: CONTENT,
  lastModified: '2026-01-01T00:00:00.000Z'
}

const REGISTRY = {
  root: 'root',
  guild: 'guild',
  pages: [{ k: 'regole', l: 'Regole', i: '📋', id: 'pag-regole', sec: 'regole', c: 1, layout: '' }],
  sections: [{ v: 'regole', l: 'Regole' }]
}

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

function b64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64')
}

async function mockBackend(page: Page, saved: { content?: string }): Promise<void> {
  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'brian', role: 'admin', csrf: 'e2e' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))
  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as { action: string; payload: Record<string, unknown> }
    const path = String(body.payload.path || '')
    if (body.action === 'get' && path === 'content/pages/regole.json') {
      return json(route, { data: { content: b64(JSON.stringify(PAGE)), sha: 'sha-regole' } })
    }
    if (body.action === 'get' && path === 'content/pages/registry.json') {
      return json(route, { data: { content: b64(JSON.stringify(REGISTRY)), sha: 'sha-reg' } })
    }
    if (body.action === 'get' && path === 'images') return json(route, { data: [] })
    if (body.action === 'put') {
      if (path === 'content/pages/regole.json') {
        saved.content = Buffer.from(String(body.payload.content), 'base64').toString('utf8')
      }
      return json(route, { data: { content: { sha: 'sha-new' } } })
    }
    return json(route, { data: null })
  })
}

test.describe('editor a blocchi', () => {
  test('apre una pagina libera nei blocchi senza toccare il markdown', async ({ page }) => {
    const saved: { content?: string } = {}
    await mockBackend(page, saved)
    await page.goto('/admin/app.html#/editor/regole')

    await expect(page.locator('.arc-mode-tab')).toHaveText(['Blocchi', 'Markdown'])
    await expect(page.locator('.arc-block-type')).toHaveText(['Titolo', 'Paragrafo', 'Griglia / Carte'])
    await expect(page.locator('.arc-slide-state')).toHaveCount(0)
    /* La pagina si apre pulita: il passaggio ai blocchi è una lettura. */
    await expect(page.locator('.arc-ws-save')).toContainText('Tutto salvato')

    /* La griglia è una card per carta, con il markdown delle carte. */
    await expect(page.locator('.arc-subcard')).toHaveCount(2)
    await expect(page.locator('.arc-slide-title')).toHaveCount(0)
  })

  test('una modifica nei blocchi arriva al markdown, all’anteprima e al salvataggio', async ({ page }) => {
    const saved: { content?: string } = {}
    await mockBackend(page, saved)
    await page.goto('/admin/app.html#/editor/regole')

    const heading = page.locator('.arc-block-list .arc-block').first().locator('input')
    await heading.fill('Regola 1 — Accesso al server')

    /* Anteprima live aggiornata dallo stesso renderer del sito. */
    await expect(page.locator('.n-content h2').first()).toHaveText('Regola 1 — Accesso al server')

    /* Il markdown è la fonte di verità: si vede passando alla modalità testo. */
    await page.locator('.arc-mode-tab').nth(1).click()
    await expect(page.locator('.cm-content')).toContainText('## Regola 1 — Accesso al server')
    /* ...e il giro non perde la griglia di carte. */
    await expect(page.locator('.cm-content')).toContainText(':::cards')

    await page.keyboard.press('Control+s')
    await expect.poll(() => saved.content).toBeTruthy()
    expect(saved.content).toContain('## Regola 1 — Accesso al server')
    expect(saved.content).toContain(':::cards')
    expect(saved.content).toContain('### PvE')
  })
})
