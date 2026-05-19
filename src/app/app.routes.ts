import type { Routes } from '@angular/router';

import { authGuard, storeGuard } from './core/auth/auth.guard';
import { workspaceConfigs } from './features/workspace/workspace.data';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'selecionar-loja',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/store-selection.page').then((m) => m.StoreSelectionPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'core/usuarios',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/core/usuarios/usuarios.page').then((m) => m.UsuariosPage)
  },
  {
    path: 'core/lojas',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/core/lojas/lojas.page').then((m) => m.LojasPage)
  },
  // Clientes - paginas especificas
  {
    path: 'cadastros/clientes',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/clientes/clientes-list.page').then((m) => m.ClientesListPage)
  },
  {
    path: 'cadastros/clientes/novo',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/clientes/clientes-form.page').then((m) => m.ClientesFormPage)
  },
  {
    path: 'cadastros/clientes/:id',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/clientes/clientes-form.page').then((m) => m.ClientesFormPage)
  },

  // Produtos - paginas especificas
  {
    path: 'cadastros/produtos',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/produtos/produtos-list.page').then((m) => m.ProdutosListPage)
  },
  {
    path: 'cadastros/produtos/novo',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/produtos/produtos-form.page').then((m) => m.ProdutosFormPage)
  },
  {
    path: 'cadastros/produtos/:id',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/produtos/produtos-form.page').then((m) => m.ProdutosFormPage)
  },

  // Estoque - Saldos com pagina especifica
  {
    path: 'estoque/saldos',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/estoque/estoque-saldos.page').then((m) => m.EstoqueSaldosPage)
  },
  {
    path: 'estoque/transferencias',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/estoque/transferencia-estoque.page').then((m) => m.TransferenciaEstoquePage)
  },
  {
    path: 'estoque/inventarios',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/estoque/inventario.page').then((m) => m.InventarioPage)
  },
  {
    path: 'estoque/necessidade-compra',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/estoque/necessidade-compra.page').then((m) => m.NecessidadeCompraPage)
  },

  // Pre-vendas com paginas especificas
  {
    path: 'vendas/pre-vendas',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/pre-venda/pre-venda-list.page').then((m) => m.PreVendaListPage)
  },
  {
    path: 'vendas/pre-vendas/nova',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/pre-venda/pre-venda-form.page').then((m) => m.PreVendaFormPage)
  },
  {
    path: 'vendas/pre-vendas/:id',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/pre-venda/pre-venda-form.page').then((m) => m.PreVendaFormPage)
  },

  // PDV - rota legada mantida para compatibilidade com sidebar
  {
    path: 'vendas/pdv',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/pdv/pdv.page').then((m) => m.PdvPage)
  },

  // Caixa - operacoes especificas
  {
    path: 'caixa/pdv',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/pdv/pdv.page').then((m) => m.PdvPage)
  },
  {
    path: 'caixa/abrir-sessao',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/caixa/abrir-sessao.page').then((m) => m.AbrirSessaoPage)
  },
  {
    path: 'caixa/sangria',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/caixa/sangria.page').then((m) => m.SangriaPage)
  },
  {
    path: 'caixa/encerrar-sessao',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/caixa/encerrar-sessao.page').then((m) => m.EncerrarSessaoPage)
  },
  {
    path: 'caixa/operacoes',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/workspace/workspace.page').then((m) => m.WorkspacePage),
    data: { config: workspaceConfigs['cash'] }
  },

  // Retaguarda - workspace generico
  {
    path: 'financeiro',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/workspace/workspace.page').then((m) => m.WorkspacePage),
    data: { config: workspaceConfigs['finance'] }
  },
  {
    path: 'compras',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/workspace/workspace.page').then((m) => m.WorkspacePage),
    data: { config: workspaceConfigs['purchases'] }
  },
  {
    path: 'fiscal',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/workspace/workspace.page').then((m) => m.WorkspacePage),
    data: { config: workspaceConfigs['fiscal'] }
  },
  {
    path: 'servicos/oficina',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/workspace/workspace.page').then((m) => m.WorkspacePage),
    data: { config: workspaceConfigs['services'] }
  },
  {
    path: 'health',
    loadComponent: () => import('./features/health/health.page').then((m) => m.HealthPage)
  },
  {
    path: '403',
    loadComponent: () => import('./features/forbidden/forbidden.page').then((m) => m.ForbiddenPage)
  },
  {
    path: 'preferencias',
    canActivate: [authGuard],
    loadComponent: () => import('./features/preferencias/preferencias.page').then((m) => m.PreferenciasPage)
  },
  // Cadastros auxiliares
  { path: 'cadastros/fabricantes', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/fabricantes.page').then((m) => m.FabricantesPage) },
  { path: 'cadastros/secoes', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/secoes.page').then((m) => m.SecoesPage) },
  { path: 'cadastros/unidades', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/unidades.page').then((m) => m.UnidadesPage) },
  { path: 'cadastros/ncm', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/ncm.page').then((m) => m.NcmPage) },
  { path: 'cadastros/montadoras', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/montadoras.page').then((m) => m.MontadorasPage) },

  // Caixa - operacoes avulsas
  { path: 'caixa/suprimento', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/caixa/suprimento.page').then((m) => m.SuprimentoPage) },
  { path: 'caixa/fechamento-diario', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/caixa/fechamento-diario.page').then((m) => m.FechamentoDiarioPage) },
  { path: 'caixa/recebimento-avulso', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/caixa/recebimento-avulso.page').then((m) => m.RecebimentoAvulsoPage) },
  { path: 'caixa/pagamento-avulso', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/caixa/pagamento-avulso.page').then((m) => m.PagamentoAvulsoPage) },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
