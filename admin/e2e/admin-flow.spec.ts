import { test, expect } from 'playwright/test'

/*
  E2E del pannello admin (login → dashboard → editor → publish).
  Richiede il backend Cloudflare Functions raggiungibile (wrangler dev o deploy)
  e credenziali valide:

    PLAYWRIGHT_BASE_URL=https://arcamis.pages.dev \
    ADMIN_USER=... ADMIN_PASSWORD=... \
    npx playwright test e2e/admin-flow.spec.ts --project=chromium

  Default: skipped (nessun ambiente/credenziali in CI locale).
*/
const testSkip = !process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD ? test.skip : test

testSkip('login → dashboard', async ({ page }) => {
  /* DOM della shell Vue: login su #/login, pannello in .arc-app. */
  await page.goto('/admin/app#/login')
  await page.getByLabel('Username').fill(process.env.ADMIN_USER!)
  await page.getByLabel('Password').fill(process.env.ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Accedi' }).click()

  await expect(page.locator('.arc-sidebar')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.arc-role')).toBeVisible()
})

testSkip('ricerca globale ⌘K mostra risultati', async ({ page }) => {
  await page.goto('/admin/app#/')
  await expect(page.locator('.arc-sidebar')).toBeVisible({ timeout: 20_000 })
  await page.keyboard.press('Control+K')
  await expect(page.locator('.arc-search-overlay')).toBeVisible()
})
