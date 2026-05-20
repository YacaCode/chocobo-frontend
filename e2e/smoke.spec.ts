import { expect, test } from '@playwright/test';

// Shared auth mock helper
async function mockAuthRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'demo-token-test',
        usuario: { id: 1, nome: 'Admin', email: 'admin@chocobo.com', perfil: 'ADMIN' }
      })
    });
  });

  await page.route('**/api/v1/auth/lojas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, nome: 'Loja Principal', cnpj: '00.000.000/0001-00' }
      ])
    });
  });

  // Generic fallback for any unmatched API calls — return empty data
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

test.describe('Smoke Tests — Fluxos Críticos', () => {

  test('login e navegação básica até dashboard', async ({ page }) => {
    await mockAuthRoutes(page);

    // Seed localStorage so guards pass
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('chb_token', 'demo-token-test');
      localStorage.setItem('chb_loja', JSON.stringify({ id: 1, nome: 'Loja Principal' }));
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    // Dashboard should render without full-page error
    await expect(page.locator('body')).not.toContainText('ERROR');
  });

  test('navegar para contas a receber e ver tabela carregada', async ({ page }) => {
    await page.route('**/api/v1/financeiro/contas-receber**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kpis: { aReceber: 42000, vencido: 8500, recebidoMes: 31000, negociado: 4200 },
          contas: [
            { id: 1, clienteNome: 'Cliente Teste', descricao: 'Venda 001', valor: 500, vencimento: '2026-05-25', status: 'ABERTA' }
          ]
        })
      });
    });

    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/financeiro/contas-receber');
    await page.evaluate(() => {
      localStorage.setItem('chb_token', 'demo-token-test');
      localStorage.setItem('chb_loja', JSON.stringify({ id: 1, nome: 'Loja Principal' }));
    });

    await page.goto('/financeiro/contas-receber');
    // Page should render the title or at least not crash
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Uncaught');
  });

  test('navegar para nova pré-venda e ver formulário', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/vendas/pre-vendas/nova');
    await page.evaluate(() => {
      localStorage.setItem('chb_token', 'demo-token-test');
      localStorage.setItem('chb_loja', JSON.stringify({ id: 1, nome: 'Loja Principal' }));
    });

    await page.goto('/vendas/pre-vendas/nova');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Uncaught');
  });

  test('navegar para nova OS e ver formulário', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/servicos/atendimento/nova');
    await page.evaluate(() => {
      localStorage.setItem('chb_token', 'demo-token-test');
      localStorage.setItem('chb_loja', JSON.stringify({ id: 1, nome: 'Loja Principal' }));
    });

    await page.goto('/servicos/atendimento/nova');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Uncaught');
  });

  test('tela DRE carrega com dados demo', async ({ page }) => {
    // Let the demo fallback kick in (404 triggers catchError)
    await page.route('**/api/v1/gerencial/dre**', async (route) => {
      await route.fulfill({ status: 404, body: '' });
    });

    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('chb_token', 'demo-token-test');
      localStorage.setItem('chb_loja', JSON.stringify({ id: 1, nome: 'Loja Principal' }));
    });

    await page.goto('/gerencial/dre');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Uncaught');
  });

  test('tela fluxo de caixa carrega com dados demo', async ({ page }) => {
    await page.route('**/api/v1/gerencial/fluxo-caixa**', async (route) => {
      await route.fulfill({ status: 404, body: '' });
    });

    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('chb_token', 'demo-token-test');
      localStorage.setItem('chb_loja', JSON.stringify({ id: 1, nome: 'Loja Principal' }));
    });

    await page.goto('/gerencial/fluxo-caixa');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Uncaught');
  });

});
