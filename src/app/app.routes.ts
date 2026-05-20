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
  // IMPORTANTE: importar deve vir ANTES de :id para não ser capturada como parâmetro
  {
    path: 'cadastros/produtos/importar',
    canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/produtos/produto-importar.page').then(m => m.ProdutoImportarPage)
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

  // Financeiro
  { path: 'financeiro', redirectTo: 'financeiro/contas-receber', pathMatch: 'full' },
  { path: 'financeiro/contas-receber', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/financeiro/contas-receber.page').then(m => m.ContasReceberPage) },
  { path: 'financeiro/contas-pagar', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/financeiro/contas-pagar.page').then(m => m.ContasPagarPage) },
  { path: 'financeiro/inadimplencia', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/financeiro/inadimplencia.page').then(m => m.InadimplenciaPage) },

  // Compras
  { path: 'compras', redirectTo: 'compras/pedidos-compra', pathMatch: 'full' },
  { path: 'compras/pedidos-compra', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/compras/pedidos-compra.page').then(m => m.PedidosCompraPage) },
  { path: 'compras/cotacoes', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/compras/cotacoes.page').then(m => m.CotacoesPage) },
  { path: 'compras/notas-entrada', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/compras/notas-entrada.page').then(m => m.NotasEntradaPage) },

  // Fiscal
  { path: 'fiscal', redirectTo: 'fiscal/documentos', pathMatch: 'full' },
  { path: 'fiscal/documentos', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/fiscal/fiscal-documentos.page').then(m => m.FiscalDocumentosPage) },
  // Serviços / DAV-OS
  { path: 'servicos/oficina', redirectTo: 'servicos/atendimento', pathMatch: 'full' },
  { path: 'servicos/atendimento', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/servicos/dav-os-list.page').then(m => m.DavOsListPage) },
  { path: 'servicos/atendimento/nova', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/servicos/dav-os-form.page').then(m => m.DavOsFormPage) },
  { path: 'servicos/atendimento/:id', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/servicos/dav-os-form.page').then(m => m.DavOsFormPage) },
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
  // Fornecedores
  { path: 'cadastros/fornecedores', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/fornecedores/fornecedores-list.page').then(m => m.FornecedoresListPage) },
  { path: 'cadastros/fornecedores/novo', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/fornecedores/fornecedores-form.page').then(m => m.FornecedoresFormPage) },
  { path: 'cadastros/fornecedores/:id', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/fornecedores/fornecedores-form.page').then(m => m.FornecedoresFormPage) },

  // Cadastros auxiliares
  { path: 'cadastros/fabricantes', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/fabricantes.page').then((m) => m.FabricantesPage) },
  { path: 'cadastros/secoes', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/secoes.page').then((m) => m.SecoesPage) },
  { path: 'cadastros/unidades', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/unidades.page').then((m) => m.UnidadesPage) },
  { path: 'cadastros/ncm', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/ncm.page').then((m) => m.NcmPage) },
  { path: 'cadastros/montadoras', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/montadoras.page').then((m) => m.MontadorasPage) },
  { path: 'cadastros/subsecoes', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/subsecoes.page').then((m) => m.SubsecoesPage) },
  { path: 'cadastros/grupos-mercadoria', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/grupos-mercadoria.page').then((m) => m.GruposMercadoriaPage) },
  { path: 'cadastros/tipos-produto', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/tipos-produto.page').then((m) => m.TiposProdutoPage) },
  { path: 'cadastros/promocoes', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/promocoes.page').then((m) => m.PromocoesPage) },

  // Veículos
  { path: 'veiculos', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/veiculos/veiculos-list.page').then((m) => m.VeiculosListPage) },
  { path: 'veiculos/novo', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/veiculos/veiculos-form.page').then((m) => m.VeiculosFormPage) },
  { path: 'veiculos/:id', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/veiculos/veiculos-form.page').then((m) => m.VeiculosFormPage) },
  { path: 'cadastros/cores-veiculo', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/cores-veiculo.page').then((m) => m.CoresVeiculoPage) },
  { path: 'cadastros/modelos-veiculo', canActivate: [authGuard, storeGuard], loadComponent: () => import('./features/auxiliares/modelos-veiculo.page').then((m) => m.ModelosVeiculoPage) },

  // Gerencial
  { path: 'gerencial', redirectTo: 'gerencial/dre', pathMatch: 'full' },
  { path: 'gerencial/dre', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/gerencial/dre.page').then(m => m.DrePage) },
  { path: 'gerencial/fluxo-caixa', canActivate: [authGuard, storeGuard],
    loadComponent: () => import('./features/gerencial/fluxo-caixa.page').then(m => m.FluxoCaixaPage) },

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
