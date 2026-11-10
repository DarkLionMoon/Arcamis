import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   Changelog — salvataggio reale del pannello.

   Il backend è simulato: si verifica che la UI invii lo sha del file
   esistente, che il payload sia un array puro e che dopo il primo PUT
   usi il nuovo sha per il salvataggio successivo.
   ════════════════════════════════════════════════════════════════ */

const CHANGELOG_PATH = 'content/changelog.json'

const SEED = [
  {
    id: 'cl-seed',
    title: 'Patch iniziale',
    versione: '0',
    sottoversione: '0.3',
    patch: '0.3.6',
    date: '2026-03-18',
    content: 'Contenuto iniziale.'
  }
]

interface PutCall {
  sha: string
  content: string
}

function b64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockBackend(page: Page): Promise<{ puts: PutCall[] }> {
  const state: { puts: PutCall[] } = { puts: [] }

  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) => json(route, {})
  )
  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: 'editor-user', role: 'editor', csrf: 'e2e-csrf' })
  )

  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as { action: string; payload: Record<string, unknown> }
    const path = String(body.payload.path || '')

    if (body.action === 'get' && path === CHANGELOG_PATH) {
      return json(route, { data: { content: b64(JSON.stringify(SEED)), sha: 'sha-changelog' } })
    }
    if (body.action === 'put' && path === CHANGELOG_PATH) {
      state.puts.push({
        sha: String(body.payload.sha || ''),
        content: Buffer.from(String(body.payload.content), 'base64').toString('utf8')
      })
      return json(route, { data: { content: { sha: `sha-next-${state.puts.length}` } } })
    }
    return json(route, { data: null })
  })

  return state
}

test('salva una nuova patch con lo sha corrente e riusa il nuovo sha', async ({ page }) => {
  const state = await mockBackend(page)

  await page.goto('/admin/app.html#/changelog')
  await expect(page.locator('.arc-page-title')).toHaveText('Changelog')
  await expect(page.locator('.arc-changelog-item')).toHaveCount(1)

  await page.getByRole('button', { name: /Nuova entry/ }).click()
  await page.getByLabel('Versione', { exact: true }).fill('0')
  await page.getByLabel('Sottoversione', { exact: true }).fill('0.4')
  await page.getByLabel('Patch', { exact: true }).fill('0.4.0')
  await page.getByLabel('Data', { exact: true }).fill('2026-11-10')
  await page.getByLabel('Titolo', { exact: true }).fill('Patch 0.4.0')
  await page.getByLabel(/Contenuto/).fill('**Novità**\n\n- Nuova patch.')
  await page.getByRole('button', { name: 'OK', exact: true }).click()

  await expect(page.locator('.arc-changelog-item').first()).toContainText('Patch 0.4.0')
  await page.getByRole('button', { name: /Salva/ }).first().click()

  await expect.poll(() => state.puts.length).toBe(1)
  await expect(page.locator('.arc-toast', { hasText: 'Changelog salvato' })).toBeVisible()
  expect(state.puts[0].sha).toBe('sha-changelog')
  const first = JSON.parse(state.puts[0].content)
  expect(Array.isArray(first)).toBe(true)
  expect(first[0].title).toBe('Patch 0.4.0')
  expect(first[0].id).toMatch(/^cl-/)

  /* Il secondo salvataggio deve usare lo sha restituito dal primo PUT,
     non quello vecchio letto al caricamento. */
  await page.locator('.arc-changelog-item').first().locator('button').first().click()
  await page.getByLabel('Titolo').fill('Patch 0.4.1')
  await page.getByRole('button', { name: 'OK', exact: true }).click()
  await page.getByRole('button', { name: /Salva/ }).first().click()

  await expect.poll(() => state.puts.length).toBe(2)
  expect(state.puts[1].sha).toBe('sha-next-1')
  expect(JSON.parse(state.puts[1].content)[0].title).toBe('Patch 0.4.1')
})
