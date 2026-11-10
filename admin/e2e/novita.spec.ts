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
  await expect(page.locator('.nv-entry')).toHaveCount(27)
  await expect(page.locator('#nv-version-filter option')).toHaveCount(23)
  await expect(page.locator('#nv-year-filter option')).toHaveCount(2)
  await expect(page.locator('.badge-new')).toHaveCount(3)
  await expect(page.locator('.nv-entry:has(.badge-new) .nv-entry-title')).toHaveText([
    'D&D Beyond Drops e Doni dei Draghi',
    'Arcana Unleashed e rework del cambio personaggio',
    'Revisione dei tratti del Celestiale'
  ])

  await page.selectOption('#nv-version-filter', '0.8.6')
  await expect(page.locator('.nv-entry')).toHaveCount(1)
  await expect(page.locator('.badge-new')).toHaveCount(1)
  await expect(page.locator('.nv-entry-title')).toContainText('D&D Beyond Drops')

  await page.locator('.nv-entry-title').click()
  await expect(page.locator('.cl-inline-content')).toContainText('Doni dei Draghi')

  await page.selectOption('#nv-version-filter', '')
  await expect(page.locator('.nv-entry')).toHaveCount(27)

  await page.selectOption('#nv-year-filter', '2026')
  await expect(page.locator('.nv-entry')).toHaveCount(27)
  await page.selectOption('#nv-year-filter', '')
  await expect(page.locator('.nv-entry')).toHaveCount(27)
})
