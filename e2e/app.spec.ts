import { expect, test } from '@playwright/test';

test('abre a pagina de health', async ({ page }) => {
  await page.route('**/api/v1/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'UP',
        version: '0.1.0',
        timestamp: '2026-05-18T00:00:00Z'
      })
    });
  });

  await page.goto('/health');

  await expect(page.getByRole('heading', { name: 'Saude do backend' })).toBeVisible();
  await expect(page.getByText('UP')).toBeVisible();
});
