import { test, expect, type Page, type Route } from 'playwright/test'

/* ════════════════════════════════════════════════════════════════
   CRUD delle viste editoriali nuove: Imprese e Mestieri.

   Il backend non esiste in e2e: /api/gh viene simulato. Il test
   controlla che i dati arrivino dal JSON (niente hardcoding), che una
   voce si possa creare ed eliminare, e che il salvataggio riscriva il
   file giusto con lo sha restituito in lettura.
   ════════════════════════════════════════════════════════════════ */

const REGISTRY = {
  root: 'root',
  guild: 'guild',
  pages: [
    { k: 'imprese', l: 'Imprese e Licenze', i: '⚖️', id: 'pag-imprese', sec: 'imprese' },
    { k: 'mestieri', l: 'Mestieri', i: '💼', id: 'pag-mestieri', sec: 'lavori' }
  ],
  sections: [
    { v: 'lavori', l: 'Lavori' },
    { v: 'imprese', l: 'Imprese' }
  ]
}

const IMPRESE = {
  k: 'imprese',
  title: 'Imprese e Licenze',
  icon: '⚖️',
  layout: 'imprese',
  content: '# Imprese',
  lastModified: '2026-10-01T00:00:00.000Z',
  data: {
    livelli: [{ name: 'Bottega', patente: 'P.M.C.', fee: 100 }],
    patenti: [{ sigla: 'P.M.C.', nome: 'Manifattura Comune', totale: 50 }],
    strutture: [],
    fornitura: [],
    sanzioni: [],
    eventi: [],
    tiriEvento: [],
    sponsaggio: []
  }
}

const MESTIERI = {
  k: 'mestieri',
  title: 'Mestieri',
  icon: '💼',
  content:
    '# Oste\n\n**Patente:** P.M.C. — Manifattura Comune\n**Livello di maestria:** L1 — Bottega Artigiana\n**Categoria:** Cucina\n**Rendita di fornitura:** 15 Mo al mese\n',
  lastModified: '2026-10-01T00:00:00.000Z'
}

interface PutCall {
  path: string
  document: unknown
  sha: string
}

function b64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockBackend(page: Page, role: 'editor' | 'admin' = 'editor'): Promise<PutCall[]> {
  const puts: PutCall[] = []

  await page.route('**/api/admin?action=check', (route) =>
    json(route, { ok: true, user: role + '-user', role, csrf: 'e2e-csrf' })
  )
  await page.route('**/api/admin?action=get_covers', (route) => json(route, {}))
  await page.route('**/api/admin?action=pages_status', (route) => json(route, {}))

  await page.route('**/api/gh', async (route) => {
    const body = route.request().postDataJSON() as { action: string; payload: Record<string, unknown> }
    const path = String(body.payload.path || '')
    const pages: Record<string, unknown> = {
      'content/pages/registry.json': REGISTRY,
      'content/pages/imprese.json': IMPRESE,
      'content/pages/mestieri.json': MESTIERI
    }

    if (body.action === 'get' && pages[path]) {
      return json(route, { data: { content: b64(JSON.stringify(pages[path])), sha: 'sha-' + path } })
    }
    if (body.action === 'get' && path === 'images') return json(route, { data: [] })
    if (body.action === 'put') {
      puts.push({
        path,
        document: JSON.parse(Buffer.from(String(body.payload.content), 'base64').toString('utf8')),
        sha: String(body.payload.sha || '')
      })
      return json(route, { data: { content: { sha: 'sha-new' } } })
    }
    return json(route, { data: null })
  })

  return puts
}

test.describe('CRUD editoriale', () => {
  test('Imprese: crea, elimina e salva le voci del JSON', async ({ page }) => {
    const puts = await mockBackend(page)
    await page.goto('/admin/app.html#/imprese')

    await expect(page.locator('.arc-page-title')).toContainText('Imprese')
    await expect(page.locator('.arc-table tbody tr').filter({ hasText: 'Bottega' })).toHaveCount(1)

    await page.getByRole('button', { name: '＋ Nuova voce' }).click()
    const form = page.locator('.arc-panel').filter({ hasText: 'Nuova voce' })
    await form.locator('input.in').first().fill('Nuova impresa')
    await form.getByRole('button', { name: 'Applica' }).click()
    await expect(page.locator('.arc-table tbody tr').filter({ hasText: 'Nuova impresa' })).toHaveCount(1)

    await page.locator('.arc-table tbody tr').filter({ hasText: 'Bottega' }).locator('button.btn-d').click()
    await page.getByRole('button', { name: 'Elimina', exact: true }).click()
    await expect(page.locator('.arc-table tbody tr').filter({ hasText: 'Bottega' })).toHaveCount(0)

    await page.getByRole('button', { name: /Salva/ }).click()

    const put = puts.filter((call) => call.path === 'content/pages/imprese.json').pop()
    expect(put?.sha).toBe('sha-content/pages/imprese.json')
    const saved = put?.document as { data: { livelli: Array<{ name: string }>; patenti: unknown[] } }
    expect(saved.data.livelli.map((row) => row.name)).toEqual(['Nuova impresa'])
    expect(saved.data.patenti).toHaveLength(1)
  })

  test('Mestieri: aggiunge una scheda e la serializza nel markdown', async ({ page }) => {
    const puts = await mockBackend(page)
    await page.goto('/admin/app.html#/mestieri')

    await expect(page.locator('.arc-page-title')).toContainText('Mestieri')
    await expect(page.locator('.arc-changelog-item').filter({ hasText: 'Oste' })).toHaveCount(1)

    await page.getByRole('button', { name: '＋ Nuovo mestiere' }).click()
    const form = page.locator('.arc-panel').filter({ hasText: 'Nuovo mestiere' })
    await form.locator('input.in').first().fill('Speziale')
    await form.getByRole('button', { name: 'Applica' }).click()
    await expect(page.locator('.arc-changelog-item').filter({ hasText: 'Speziale' })).toHaveCount(1)

    await page.getByRole('button', { name: /Salva/ }).click()

    const put = puts.filter((call) => call.path === 'content/pages/mestieri.json').pop()
    expect(put?.sha).toBe('sha-content/pages/mestieri.json')
    const saved = put?.document as { content: string }
    expect(saved.content).toContain('# Oste')
    expect(saved.content).toContain('# Speziale')
    expect(saved.content).toContain('**Patente:** P.M.C. — Manifattura Comune')
  })

  test('Navigazione: riordina, rinomina e salva le sezioni della topbar', async ({ page }) => {
    const puts = await mockBackend(page, 'admin')
    await page.goto('/admin/app.html#/navigazione')

    const sectionPanel = page.locator('.arc-panel').filter({ hasText: 'Sezioni della topbar' })
    const rows = sectionPanel.locator('.arc-navrow')
    await expect(rows).toHaveCount(2)

    await rows.filter({ hasText: 'Imprese' }).getByRole('button', { name: '↑' }).click()
    await expect(rows.first()).toContainText('Imprese')

    /* Mentre si modifica, l’etichetta è un input: il filtro per testo non
       trova più la riga, quindi si continua a usare la prima posizione. */
    await rows.first().getByRole('button', { name: '✏️' }).click()
    await rows.first().locator('input.in').fill('Attività')
    await rows.first().getByRole('button', { name: 'OK' }).click()
    await expect(rows.first()).toContainText('Attività')

    await page.getByRole('button', { name: '💾 Salva registro' }).click()
    await expect(page.locator('.arc-toast').filter({ hasText: 'Navigazione salvata' })).toBeVisible()

    const put = puts.filter((call) => call.path === 'content/pages/registry.json').pop()
    expect(put?.sha).toBe('sha-content/pages/registry.json')
    const saved = put?.document as { sections: Array<{ v: string; l: string }> }
    expect(saved.sections).toEqual([
      { v: 'imprese', l: 'Attività' },
      { v: 'lavori', l: 'Lavori' }
    ])
  })
})
