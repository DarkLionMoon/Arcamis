import { test, expect } from 'playwright/test'

/*
  Smoke test del SITO pubblico. Si esegue contro il build o il dev server:
    PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test e2e/public-site.spec.ts --project=chromium

  Non richiede autenticazione.
*/
test('il sito carica e mostra il titolo del server', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Arcamis/)
})

test('la homepage mostra un carosello', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#carousel-wrap')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('#carousel-wrap .slide').first()).toBeVisible()
})