import { test, expect, type Page } from 'playwright/test'

async function waitForShell(page: Page) {
  await expect(page.locator('#site-loader')).toBeHidden()
  const acknowledge = page.getByRole('button', { name: 'HO CAPITO', exact: true })
  if (await acknowledge.isVisible().catch(() => false)) await acknowledge.click()
}

test('la pagina Novità elenca tutte le patch e filtra per versione e anno', async ({ page }) => {
  await page.goto('/novita')
  await waitForShell(page)

  await expect(page.locator('#pbody .nc')).toBeVisible()
  await expect(page.locator('#ph-title')).toContainText('Novità')
  await expect(page.locator('.nv-entry')).toHaveCount(10)
  await expect(page.locator('#nv-version-filter option')).toHaveCount(11)
  await expect(page.locator('#nv-year-filter option')).toHaveCount(2)
  await expect(page.locator('.badge-new')).toHaveCount(3)
  await expect(page.locator('.nv-entry:has(.badge-new) .nv-entry-title')).toHaveText([
    'Update comandi Meteo e Itinerario',
    'Update SUCCUBI/INCUBI',
    'Update MAPPA ARCAMIS'
  ])

  await page.selectOption('#nv-version-filter', '0.3.6')
  await expect(page.locator('.nv-entry')).toHaveCount(1)
  await expect(page.locator('.badge-new')).toHaveCount(1)
  await expect(page.locator('.nv-entry-title')).toContainText('Meteo e Itinerario')

  await page.locator('.nv-entry-title').click()
  await expect(page.locator('.cl-inline-content')).toContainText('!bollettino')

  await page.selectOption('#nv-version-filter', '')
  await expect(page.locator('.nv-entry')).toHaveCount(10)

  await page.selectOption('#nv-year-filter', '2026')
  await expect(page.locator('.nv-entry')).toHaveCount(10)
  await page.selectOption('#nv-year-filter', '')
  await expect(page.locator('.nv-entry')).toHaveCount(10)
})
