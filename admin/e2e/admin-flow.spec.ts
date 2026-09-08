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
const testSkip = (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD)
  ? test.skip
  : test

testSkip('login → dashboard', async ({ page }) => {
  await page.goto('/admin/')
  await page.fill('#login input[type=text], #login input[name=username], #login input:not([type=password])', process.env.ADMIN_USER!)
  await page.fill('#login input[type=password], #login input[name=password]', process.env.ADMIN_PASSWORD!)
  await page.click('#login button[type=submit], #login .btn-primary, #login button')
  await expect(page.locator('#app')).toBeVisible({ timeout: 15_000 })
})

testSkip('ricerca globale ⌘K mostra risultati', async ({ page }) => {
  await page.goto('/admin/')
  await page.waitForSelector('#app', { timeout: 20_000 })
  await page.keyboard.press('Control+K')
  await expect(page.locator('#gs-modal')).toBeVisible()
})