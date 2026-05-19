import type { WorkspaceConfig, WorkspaceFormField, WorkspaceKpi } from './workspace.types';

const DEFAULT_KPIS: WorkspaceKpi[] = [
  { label: 'Registros', value: '128', detail: 'base operacional', icon: 'pi pi-database', tone: 'info' },
  { label: 'Pendencias', value: '7', detail: 'exigem acao', icon: 'pi pi-bell', tone: 'warning' },
  { label: 'Hoje', value: 'R$ 18.420', detail: 'movimento estimado', icon: 'pi pi-chart-line', tone: 'success' }
];

const DEFAULT_FIELDS: WorkspaceFormField[] = [
  { label: 'Codigo', value: 'automatico' },
  { label: 'Descricao', value: '' },
  { label: 'Observacao', value: '', kind: 'textarea' }
];

export const workspaceConfigs: Record<string, WorkspaceConfig> = {
  users: {
    area: 'Core',
    title: 'Usuarios e permissoes',
    description: 'Operação de usuarios, papeis comerciais e vinculo por loja ativa.',
    endpoint: '/api/v1/core/usuarios',
    primaryAction: { label: 'Novo usuario', icon: 'pi pi-user-plus' },
    secondaryActions: [
      { label: 'Papeis', icon: 'pi pi-shield' },
      { label: 'Comissoes', icon: 'pi pi-percentage' }
    ],
    kpis: [
      { label: 'Usuarios ativos', value: '18', detail: '12 com acesso multi-loja', icon: 'pi pi-users', tone: 'info' },
      { label: 'Bloqueados', value: '2', detail: 'revisar credenciais', icon: 'pi pi-lock', tone: 'warning' },
      { label: 'Perfis', value: '8', detail: 'RBAC comercial', icon: 'pi pi-sitemap', tone: 'success' }
    ],
    columns: [
      { field: 'login', header: 'Login' },
      { field: 'nome', header: 'Nome' },
      { field: 'papel', header: 'Papel', type: 'status' },
      { field: 'lojas', header: 'Lojas' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { login: 'ana', nome: 'ANA', papel: 'Admin', lojas: '01, 02', status: 'Ativo' },
      { login: 'caixa01', nome: 'Operador Caixa', papel: 'Caixa', lojas: '01', status: 'Ativo' },
      { login: 'vendedor02', nome: 'Vendedor Balcao', papel: 'Vendedor', lojas: '01, 02', status: 'Ativo' },
      { login: 'mecanico01', nome: 'Mecanico Oficina', papel: 'Mecanico', lojas: '02', status: 'Revisar' }
    ],
    queueTitle: 'Controles pendentes',
    queue: [
      { title: 'Vendedor externo sem comissao', detail: 'Configurar percentual padrao', status: 'Pendente', tone: 'warning' },
      { title: 'Caixa com acesso financeiro', detail: 'Validar segregacao de funcoes', status: 'Risco', tone: 'danger' },
      { title: 'Consultor vinculado a loja 02', detail: 'Perfil revisado hoje', status: 'OK', tone: 'success' }
    ],
    formTitle: 'Cadastro rapido',
    formFields: [
      { label: 'Login', value: '' },
      { label: 'Nome', value: '' },
      { label: 'Papel', value: 'Vendedor' }
    ],
    insightTitle: 'Regras aplicadas',
    insights: [
      'Operador de caixa nao cria produto nem acessa DRE.',
      'Vendedor acessa pre-venda, consultas e comissoes.',
      'Admin pode alternar loja sem novo login.'
    ]
  },
  stores: {
    area: 'Core',
    title: 'Lojas',
    description: 'Cadastro multi-loja com dados fiscais, regime tributario e parametros locais.',
    endpoint: '/api/v1/core/admin/lojas',
    primaryAction: { label: 'Nova loja', icon: 'pi pi-building' },
    secondaryActions: [
      { label: 'Certificado', icon: 'pi pi-id-card' },
      { label: 'Parametros', icon: 'pi pi-cog' }
    ],
    kpis: [
      { label: 'Lojas ativas', value: '2', detail: 'matriz e oficina', icon: 'pi pi-building', tone: 'success' },
      { label: 'Certificados', value: '1 alerta', detail: 'vence em 42 dias', icon: 'pi pi-key', tone: 'warning' },
      { label: 'Terminais', value: '6', detail: 'PDV e retaguarda', icon: 'pi pi-desktop', tone: 'info' }
    ],
    columns: [
      { field: 'codigo', header: 'Cod.' },
      { field: 'nome', header: 'Nome' },
      { field: 'cnpj', header: 'CNPJ' },
      { field: 'regime', header: 'Regime' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { codigo: '01', nome: 'PH MOTOPECAS', cnpj: '12.345.678/0001-90', regime: 'SIMPLES', status: 'Ativa' },
      { codigo: '02', nome: 'PH MOTOSERVICE', cnpj: '12.345.678/0002-70', regime: 'SIMPLES', status: 'Ativa' }
    ],
    queueTitle: 'Configuracoes',
    queue: [
      { title: 'NFC-e homologacao', detail: 'Ambiente configurado para loja 01', status: 'Pronto', tone: 'success' },
      { title: 'NFS-e oficina', detail: 'Parametro municipal pendente', status: 'Pendente', tone: 'warning' },
      { title: 'Pix cobranca', detail: 'Credenciais aguardando backend', status: 'Demo', tone: 'info' }
    ],
    formTitle: 'Dados da loja',
    formFields: [
      { label: 'Nome fantasia', value: '' },
      { label: 'CNPJ', value: '' },
      { label: 'Regime tributario', value: 'SIMPLES' }
    ],
    insightTitle: 'Contexto da sessao',
    insights: [
      'A loja escolhida no login filtra consultas e movimentos.',
      'Parametros fiscais ficam por loja para NFC-e, NF-e, CF-e e NFS-e.',
      'Certificados digitais nao sao tratados pelo frontend.'
    ]
  },
  customers: {
    area: 'Cadastros',
    title: 'Clientes',
    description: 'Consulta e manutencao do cadastro comercial com credito, enderecos e perfil de compra.',
    endpoint: '/api/v1/cadastros/clientes',
    primaryAction: { label: 'Novo cliente', icon: 'pi pi-user-plus' },
    secondaryActions: [
      { label: 'SPC', icon: 'pi pi-search' },
      { label: 'Contatos', icon: 'pi pi-comments' }
    ],
    kpis: [
      { label: 'Clientes ativos', value: '4.812', detail: 'base multi-loja', icon: 'pi pi-id-card', tone: 'info' },
      { label: 'Credito aberto', value: 'R$ 82.340', detail: 'limite concedido', icon: 'pi pi-wallet', tone: 'warning' },
      { label: 'Novos no mes', value: '46', detail: 'cadastros recentes', icon: 'pi pi-user-plus', tone: 'success' }
    ],
    columns: [
      { field: 'codigo', header: 'Codigo' },
      { field: 'nome', header: 'Razao / Nome' },
      { field: 'documento', header: 'CPF/CNPJ' },
      { field: 'telefone', header: 'Telefone' },
      { field: 'limite', header: 'Limite', type: 'money' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { codigo: '000145', nome: 'Joao Batista da Silva', documento: '123.456.789-00', telefone: '(85) 98800-1200', limite: 1200, status: 'Regular' },
      { codigo: '000278', nome: 'Moto Rapido Entregas LTDA', documento: '41.222.333/0001-10', telefone: '(85) 3222-7788', limite: 8500, status: 'Regular' },
      { codigo: '000319', nome: 'Carlos Oficina ME', documento: '31.444.555/0001-99', telefone: '(85) 99711-3311', limite: 3500, status: 'Atraso' },
      { codigo: '000402', nome: 'Consumidor Balcao', documento: '000.000.000-00', telefone: '-', limite: 0, status: 'Padrao' }
    ],
    queueTitle: 'Fila comercial',
    queue: [
      { title: 'Cliente com atraso medio alto', detail: 'Carlos Oficina ME - 18 dias', status: 'Analise', tone: 'warning' },
      { title: 'Contato pendente', detail: 'Moto Rapido pediu retorno sobre crediario', status: 'Hoje', tone: 'info' },
      { title: 'Cadastro incompleto', detail: '3 clientes sem inscricao municipal', status: 'Corrigir', tone: 'danger' }
    ],
    formTitle: 'Cliente rapido',
    formFields: [
      { label: 'Razao social / nome', value: '' },
      { label: 'CPF ou CNPJ', value: '' },
      { label: 'Telefone', value: '' },
      { label: 'Observacao', value: '', kind: 'textarea' }
    ],
    insightTitle: 'Abas planejadas',
    insights: [
      'Cadastro, dados adicionais, NFSe, socios, contatos, perfil, referencias e midias.',
      'Perfil exibe primeira compra, ultima compra, maior compra e media de atraso.',
      'Retencao ISS por cliente e loja deve vir do backend quando disponivel.'
    ]
  },
  products: {
    area: 'Cadastros',
    title: 'Produtos',
    description: 'Catalogo de autopecas com referencias, aplicacao, precificacao e tributacao.',
    endpoint: '/api/v1/cadastros/produtos',
    primaryAction: { label: 'Novo produto', icon: 'pi pi-box' },
    secondaryActions: [
      { label: 'Importar CSV', icon: 'pi pi-upload' },
      { label: 'Reajuste', icon: 'pi pi-percentage' }
    ],
    kpis: [
      { label: 'Itens ativos', value: '18.940', detail: 'catalogo de venda', icon: 'pi pi-box', tone: 'info' },
      { label: 'Sem NCM', value: '24', detail: 'bloqueio fiscal futuro', icon: 'pi pi-exclamation-triangle', tone: 'warning' },
      { label: 'Promocoes', value: '31', detail: 'vigentes hoje', icon: 'pi pi-tags', tone: 'success' }
    ],
    columns: [
      { field: 'codigo', header: 'Codigo' },
      { field: 'descricao', header: 'Descricao' },
      { field: 'aplicacao', header: 'Aplicacao' },
      { field: 'fabricante', header: 'Fabricante' },
      { field: 'saldo', header: 'Saldo', type: 'number' },
      { field: 'preco', header: 'Preco vista', type: 'money' }
    ],
    rows: [
      { codigo: '101.004-9', descricao: 'Pastilha freio dianteira', aplicacao: 'BROS 150 06/08', fabricante: 'Cobreq', saldo: 18, preco: 89.9 },
      { codigo: '201.118-2', descricao: 'Kit relacao 428H', aplicacao: 'CG 160', fabricante: 'Riffel', saldo: 7, preco: 189.5 },
      { codigo: '301.090-1', descricao: 'Bateria 5Ah selada', aplicacao: 'Biz/Pop', fabricante: 'Heliar', saldo: 3, preco: 174.0 },
      { codigo: '401.220-5', descricao: 'Oleo 10W30 semissintetico', aplicacao: 'Motos 4T', fabricante: 'Mobil', saldo: 56, preco: 38.9 }
    ],
    queueTitle: 'Alertas de catalogo',
    queue: [
      { title: 'Markup abaixo da politica', detail: 'Kit relacao 428H com margem 17%', status: 'Revisar', tone: 'warning' },
      { title: 'Referencia duplicada', detail: 'Fabricante Riffel em 2 produtos', status: 'Validar', tone: 'info' },
      { title: 'Produto sem foto', detail: 'Bateria 5Ah selada', status: 'Pendente', tone: 'neutral' }
    ],
    formTitle: 'Produto rapido',
    formFields: [
      { label: 'Descricao', value: '' },
      { label: 'Aplicacao', value: '' },
      { label: 'NCM', value: '' },
      { label: 'Preco compra', value: '0,00', kind: 'number' }
    ],
    insightTitle: 'Precificacao',
    insights: [
      'Preco vista usa markup composto de custo financeiro, ICMS, despesas, PIS, COFINS e lucro.',
      'Historico de preco deve ser append-only no backend.',
      'Tributacao IBS/CBS fica visivel, mas calculos fiscais nao sao feitos no frontend.'
    ]
  },
  stockBalances: {
    area: 'Estoque',
    title: 'Saldos por loja',
    description: 'Visao de estoque atual, reservado, minimo, curva ABC e localizacao.',
    endpoint: '/api/v1/estoque/saldos',
    primaryAction: { label: 'Ajuste manual', icon: 'pi pi-pencil' },
    secondaryActions: [
      { label: 'Extrato', icon: 'pi pi-list' },
      { label: 'Necessidade', icon: 'pi pi-shopping-cart' }
    ],
    kpis: [
      { label: 'SKUs com saldo', value: '12.604', detail: 'loja ativa', icon: 'pi pi-warehouse', tone: 'info' },
      { label: 'Abaixo minimo', value: '86', detail: 'reposicao sugerida', icon: 'pi pi-arrow-down', tone: 'warning' },
      { label: 'Reservado', value: 'R$ 12.220', detail: 'pre-vendas abertas', icon: 'pi pi-lock', tone: 'success' }
    ],
    columns: [
      { field: 'produto', header: 'Produto' },
      { field: 'loja', header: 'Loja' },
      { field: 'atual', header: 'Atual', type: 'number' },
      { field: 'reservado', header: 'Reservado', type: 'number' },
      { field: 'minimo', header: 'Minimo', type: 'number' },
      { field: 'curva', header: 'Curva', type: 'status' },
      { field: 'localizacao', header: 'Localizacao' }
    ],
    rows: [
      { produto: 'Pastilha freio dianteira', loja: '01', atual: 18, reservado: 2, minimo: 8, curva: 'A', localizacao: 'A1-03' },
      { produto: 'Kit relacao 428H', loja: '01', atual: 7, reservado: 4, minimo: 6, curva: 'A', localizacao: 'B2-11' },
      { produto: 'Bateria 5Ah selada', loja: '01', atual: 3, reservado: 1, minimo: 5, curva: 'B', localizacao: 'C1-01' },
      { produto: 'Oleo 10W30', loja: '02', atual: 22, reservado: 0, minimo: 12, curva: 'C', localizacao: 'OF-02' }
    ],
    queueTitle: 'Ruptura e giro',
    queue: [
      { title: 'Bateria abaixo do minimo', detail: 'Atual 3, minimo 5', status: 'Comprar', tone: 'warning' },
      { title: 'Kit relacao com reserva alta', detail: '4 unidades comprometidas', status: 'Separar', tone: 'info' },
      { title: 'Oleo com giro baixo', detail: 'Curva C em loja 02', status: 'Monitorar', tone: 'neutral' }
    ],
    formTitle: 'Ajuste de estoque',
    formFields: [
      { label: 'Produto', value: '' },
      { label: 'Quantidade', value: '0', kind: 'number' },
      { label: 'Motivo', value: 'Avaria / sobra / perda' }
    ],
    insightTitle: 'Regra critica',
    insights: [
      'Reserva aumenta qtd_reservada; emissao fiscal baixa reservado e atual.',
      'Transferencias entre lojas devem gerar saida e entrada rastreaveis.',
      'Inventario sempre compara qtd_sistema e qtd_contada.'
    ]
  },
  stockTransfers: {
    area: 'Estoque',
    title: 'Transferencias',
    description: 'Movimento entre lojas e entre estoques fisicos com conferencia.',
    endpoint: '/api/v1/estoque/transferencias',
    primaryAction: { label: 'Nova transferencia', icon: 'pi pi-send' },
    secondaryActions: [
      { label: 'Conferir entrada', icon: 'pi pi-check-square' },
      { label: 'Imprimir romaneio', icon: 'pi pi-print' }
    ],
    kpis: DEFAULT_KPIS,
    columns: [
      { field: 'numero', header: 'Numero' },
      { field: 'origem', header: 'Origem' },
      { field: 'destino', header: 'Destino' },
      { field: 'itens', header: 'Itens', type: 'number' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { numero: 'TR-00091', origem: '01 - PH MOTOPECAS', destino: '02 - PH MOTOSERVICE', itens: 12, status: 'Em separacao' },
      { numero: 'TR-00090', origem: '02 - PH MOTOSERVICE', destino: '01 - PH MOTOPECAS', itens: 4, status: 'Conferida' },
      { numero: 'TR-00089', origem: 'Estoque 1', destino: 'Estoque 2', itens: 22, status: 'Aberta' }
    ],
    queueTitle: 'Etapas',
    queue: [
      { title: 'TR-00091', detail: 'Aguardando separacao fisica', status: 'Separar', tone: 'warning' },
      { title: 'TR-00090', detail: 'Entrada ja conferida', status: 'OK', tone: 'success' },
      { title: 'TR-00089', detail: 'Transferencia interna', status: 'Aberta', tone: 'info' }
    ],
    formTitle: 'Cabecalho da transferencia',
    formFields: [
      { label: 'Origem', value: '01 - PH MOTOPECAS' },
      { label: 'Destino', value: '02 - PH MOTOSERVICE' },
      { label: 'Observacao', value: '', kind: 'textarea' }
    ],
    insightTitle: 'Rastreabilidade',
    insights: [
      'Transferencia saida e transferencia entrada devem ficar ligadas.',
      'Divergencia de conferencia fica registrada para auditoria.',
      'NF-e de transferencia sera modulo fiscal/backend.'
    ]
  },
  stockInventories: {
    area: 'Estoque',
    title: 'Inventarios',
    description: 'Contagem fisica, divergencias e ajustes controlados por usuario.',
    endpoint: '/api/v1/estoque/inventarios',
    primaryAction: { label: 'Novo inventario', icon: 'pi pi-clipboard' },
    secondaryActions: [
      { label: 'Importar contagem', icon: 'pi pi-upload' },
      { label: 'Fechar inventario', icon: 'pi pi-lock' }
    ],
    kpis: [
      { label: 'Inventarios', value: '5', detail: 'no trimestre', icon: 'pi pi-clipboard', tone: 'info' },
      { label: 'Divergencia', value: 'R$ 1.842', detail: 'contagem aberta', icon: 'pi pi-exclamation-circle', tone: 'warning' },
      { label: 'Acuracidade', value: '97,8%', detail: 'ultimos 30 dias', icon: 'pi pi-check-circle', tone: 'success' }
    ],
    columns: [
      { field: 'numero', header: 'Numero' },
      { field: 'loja', header: 'Loja' },
      { field: 'data', header: 'Data' },
      { field: 'itens', header: 'Itens', type: 'number' },
      { field: 'divergentes', header: 'Divergentes', type: 'number' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { numero: 'INV-2026-05', loja: '01', data: '2026-05-18', itens: 320, divergentes: 14, status: 'Aberto' },
      { numero: 'INV-2026-04', loja: '02', data: '2026-04-30', itens: 88, divergentes: 3, status: 'Fechado' },
      { numero: 'INV-2026-03', loja: '01', data: '2026-03-29', itens: 410, divergentes: 21, status: 'Fechado' }
    ],
    queueTitle: 'Divergencias',
    queue: [
      { title: 'Bateria 5Ah', detail: 'Sistema 3, contado 2', status: 'Ajustar', tone: 'warning' },
      { title: 'Oleo 10W30', detail: 'Sistema 22, contado 24', status: 'Validar', tone: 'info' },
      { title: 'Pastilha freio', detail: 'Sem divergencia', status: 'OK', tone: 'success' }
    ],
    formTitle: 'Contagem rapida',
    formFields: [
      { label: 'Produto', value: '' },
      { label: 'Qtd contada', value: '0', kind: 'number' },
      { label: 'Observacao', value: '', kind: 'textarea' }
    ],
    insightTitle: 'Fechamento',
    insights: [
      'Ao fechar, ajustes devem virar movimentacao_estoque.',
      'Inventario fechado nao deve aceitar alteracao sem reabertura auditada.',
      'Relatorios devem separar sobra, falta e custo estimado.'
    ]
  },
  preSales: {
    area: 'Vendas',
    title: 'Pre-vendas',
    description: 'Venda de balcao com reserva, descontos, status e importacao pelo caixa.',
    endpoint: '/api/v1/vendas/pre-vendas',
    primaryAction: { label: 'Nova pre-venda', icon: 'pi pi-plus-circle' },
    secondaryActions: [
      { label: 'Buscar produto', icon: 'pi pi-search' },
      { label: 'Separacao', icon: 'pi pi-box' }
    ],
    kpis: [
      { label: 'Abertas', value: '14', detail: 'aguardando caixa', icon: 'pi pi-file-edit', tone: 'info' },
      { label: 'Reservado', value: 'R$ 12.220', detail: 'estoque comprometido', icon: 'pi pi-lock', tone: 'warning' },
      { label: 'Emitidas hoje', value: '38', detail: 'convertidas em venda', icon: 'pi pi-check', tone: 'success' }
    ],
    columns: [
      { field: 'numero', header: 'Numero' },
      { field: 'cliente', header: 'Cliente' },
      { field: 'vendedor', header: 'Vendedor' },
      { field: 'itens', header: 'Itens', type: 'number' },
      { field: 'total', header: 'Total', type: 'money' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { numero: 'PV-009812', cliente: 'Joao Batista', vendedor: 'ANA', itens: 3, total: 318.3, status: 'Aberta' },
      { numero: 'PV-009811', cliente: 'Moto Rapido Entregas', vendedor: 'Vendedor Balcao', itens: 8, total: 1240.0, status: 'Separada' },
      { numero: 'PV-009810', cliente: 'Consumidor Balcao', vendedor: 'ANA', itens: 1, total: 38.9, status: 'Emitida' },
      { numero: 'PV-009809', cliente: 'Carlos Oficina ME', vendedor: 'Vendedor Balcao', itens: 2, total: 363.5, status: 'Conferida' }
    ],
    queueTitle: 'Pipeline de venda',
    queue: [
      { title: 'PV-009812', detail: 'Desconto de 7% aguardando autorizacao', status: 'Autorizar', tone: 'warning' },
      { title: 'PV-009811', detail: 'Produtos separados para caixa', status: 'Caixa', tone: 'info' },
      { title: 'PV-009810', detail: 'NFC-e emitida', status: 'OK', tone: 'success' }
    ],
    formTitle: 'Cabecalho da pre-venda',
    formFields: [
      { label: 'Cliente', value: 'Consumidor Balcao' },
      { label: 'Vendedor', value: 'ANA' },
      { label: 'Observacao', value: '', kind: 'textarea' }
    ],
    insightTitle: 'Estados',
    insights: [
      'ABERTA > SEPARADA > CONFERIDA > EMITIDA ou CANCELADA.',
      'Status emitido nao volta para aberto; devolucao e fluxo separado.',
      'Reserva de estoque deve ser transacional no backend.'
    ]
  },
  pos: {
    area: 'Vendas',
    title: 'PDV',
    description: 'Mesa de caixa para importar pre-venda, venda direta e preparar pagamento.',
    endpoint: '/api/v1/vendas/pre-vendas',
    primaryAction: { label: 'Importar pre-venda', icon: 'pi pi-download' },
    secondaryActions: [
      { label: 'Venda direta', icon: 'pi pi-shopping-bag' },
      { label: 'Finalizar', icon: 'pi pi-credit-card' }
    ],
    kpis: [
      { label: 'Caixa', value: 'Aberto', detail: 'operador caixa01', icon: 'pi pi-calculator', tone: 'success' },
      { label: 'Vendas', value: 'R$ 9.884', detail: 'turno atual', icon: 'pi pi-dollar', tone: 'info' },
      { label: 'Troco', value: 'R$ 742', detail: 'dinheiro disponivel', icon: 'pi pi-wallet', tone: 'warning' }
    ],
    columns: [
      { field: 'item', header: 'Item' },
      { field: 'produto', header: 'Produto' },
      { field: 'qtd', header: 'Qtd', type: 'number' },
      { field: 'unitario', header: 'Unitario', type: 'money' },
      { field: 'total', header: 'Total', type: 'money' }
    ],
    rows: [
      { item: '1', produto: 'Pastilha freio dianteira', qtd: 2, unitario: 89.9, total: 179.8 },
      { item: '2', produto: 'Oleo 10W30', qtd: 1, unitario: 38.9, total: 38.9 },
      { item: '3', produto: 'Kit relacao 428H', qtd: 1, unitario: 189.5, total: 189.5 }
    ],
    queueTitle: 'Pagamentos',
    queue: [
      { title: 'Dinheiro', detail: 'R$ 200,00 recebido', status: 'Troco R$  -8,20', tone: 'warning' },
      { title: 'Cartao debito', detail: 'TEF aguardando backend', status: 'Demo', tone: 'info' },
      { title: 'Pix', detail: 'QRCode sera gerado pelo backend', status: 'Pendente', tone: 'neutral' }
    ],
    formTitle: 'Atalho de item',
    formFields: [
      { label: 'Codigo / referencia', value: '' },
      { label: 'Quantidade', value: '1', kind: 'number' },
      { label: 'Desconto', value: '0,00', kind: 'number' }
    ],
    insightTitle: 'Bloqueios operacionais',
    insights: [
      'Nao emitir NFC-e sem caixa aberto.',
      'Pagamento fiscal e TEF ficam dependentes do backend.',
      'A tela ja opera com fallback para demonstrar fluxo de balcao.'
    ]
  },
  cash: {
    area: 'Caixa',
    title: 'Operacoes de caixa',
    description: 'Abertura, suprimento, sangria, recebimento, pagamento e fechamento diario.',
    endpoint: '/api/v1/caixa/sessoes',
    primaryAction: { label: 'Nova sangria', icon: 'pi pi-arrow-up-right' },
    secondaryActions: [
      { label: 'Suprimento', icon: 'pi pi-arrow-down-left' },
      { label: 'Encerrar caixa', icon: 'pi pi-lock' }
    ],
    kpis: [
      { label: 'Dinheiro', value: 'R$ 2.842', detail: 'gaveta atual', icon: 'pi pi-wallet', tone: 'success' },
      { label: 'Cartao', value: 'R$ 5.120', detail: 'pendente conciliacao', icon: 'pi pi-credit-card', tone: 'info' },
      { label: 'Pix', value: 'R$ 1.922', detail: 'confirmado no turno', icon: 'pi pi-qrcode', tone: 'success' }
    ],
    columns: [
      { field: 'hora', header: 'Hora' },
      { field: 'tipo', header: 'Tipo', type: 'status' },
      { field: 'forma', header: 'Forma' },
      { field: 'documento', header: 'Documento' },
      { field: 'valor', header: 'Valor', type: 'money' }
    ],
    rows: [
      { hora: '08:02', tipo: 'SUPRIMENTO', forma: 'Dinheiro', documento: 'Abertura', valor: 500 },
      { hora: '10:15', tipo: 'VENDA', forma: 'Cartao debito', documento: 'NFC-e 1284', valor: 318.3 },
      { hora: '11:20', tipo: 'SANGRIA', forma: 'Dinheiro', documento: 'SG-0042', valor: 1200 },
      { hora: '13:04', tipo: 'RECEBIMENTO', forma: 'Pix', documento: 'CR-00812', valor: 740 }
    ],
    queueTitle: 'Fechamento',
    queue: [
      { title: 'Conferencia de dinheiro', detail: 'Informar contagem final', status: 'Pendente', tone: 'warning' },
      { title: 'Cartao debito', detail: '5 comprovantes anexados', status: 'OK', tone: 'success' },
      { title: 'RedZ', detail: 'Aguardando fiscal/backend', status: 'Demo', tone: 'info' }
    ],
    formTitle: 'Lancamento de caixa',
    formFields: [
      { label: 'Tipo', value: 'SANGRIA' },
      { label: 'Valor', value: '0,00', kind: 'number' },
      { label: 'Observacao', value: '', kind: 'textarea' }
    ],
    insightTitle: 'Controles',
    insights: [
      'Um operador nao pode manter dois caixas abertos.',
      'Movimento financeiro so concilia depois de confirmacao bancaria/cartao.',
      'Fechamento diario alimenta financeiro e DRE.'
    ]
  },
  finance: {
    area: 'Financeiro',
    title: 'Financeiro gerencial',
    description: 'Contas a receber, contas a pagar, fluxo de caixa, DRE e conciliacao.',
    endpoint: '/api/v1/financeiro/contas-receber',
    primaryAction: { label: 'Novo lancamento', icon: 'pi pi-plus-circle' },
    secondaryActions: [
      { label: 'Fluxo de caixa', icon: 'pi pi-chart-bar' },
      { label: 'Conciliar', icon: 'pi pi-check-circle' }
    ],
    kpis: [
      { label: 'A receber', value: 'R$ 184.220', detail: 'proximos 30 dias', icon: 'pi pi-arrow-circle-down', tone: 'success' },
      { label: 'A pagar', value: 'R$ 96.410', detail: 'proximos 30 dias', icon: 'pi pi-arrow-circle-up', tone: 'warning' },
      { label: 'Saldo projetado', value: 'R$ 87.810', detail: 'caixa + bancos', icon: 'pi pi-chart-line', tone: 'info' }
    ],
    columns: [
      { field: 'titulo', header: 'Titulo' },
      { field: 'pessoa', header: 'Pessoa' },
      { field: 'vencimento', header: 'Vencimento' },
      { field: 'tipo', header: 'Tipo', type: 'status' },
      { field: 'valor', header: 'Valor', type: 'money' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { titulo: 'CR-00812', pessoa: 'Moto Rapido Entregas', vencimento: '2026-05-20', tipo: 'Receber', valor: 1240, status: 'Aberto' },
      { titulo: 'CP-00344', pessoa: 'Distribuidora Pecas CE', vencimento: '2026-05-22', tipo: 'Pagar', valor: 8420, status: 'Aberto' },
      { titulo: 'CR-00810', pessoa: 'Carlos Oficina ME', vencimento: '2026-05-10', tipo: 'Receber', valor: 363.5, status: 'Atrasado' },
      { titulo: 'CP-00341', pessoa: 'Transportadora Alfa', vencimento: '2026-05-18', tipo: 'Pagar', valor: 920, status: 'Programado' }
    ],
    queueTitle: 'Agenda financeira',
    queue: [
      { title: 'Remessa bancaria', detail: 'Gerar CNAB dos boletos abertos', status: 'Hoje', tone: 'info' },
      { title: 'Titulo atrasado', detail: 'Carlos Oficina ME vencido ha 8 dias', status: 'Cobrar', tone: 'danger' },
      { title: 'DRE parcial', detail: 'Margem bruta 31,4%', status: 'OK', tone: 'success' }
    ],
    formTitle: 'Lancamento rapido',
    formFields: [
      { label: 'Tipo', value: 'Receita' },
      { label: 'Valor', value: '0,00', kind: 'number' },
      { label: 'Historico', value: '' }
    ],
    insightTitle: 'Separacao',
    insights: [
      'Recebiveis de venda nascem no caixa/PDV.',
      'Concilacao confirma Pix/cartao antes de considerar pago.',
      'DRE, fluxo e balanco dependem de plano de contas e centros de resultado.'
    ]
  },
  purchases: {
    area: 'Compras',
    title: 'Compras e notas de entrada',
    description: 'Pedidos, cotacoes, XML de NF-e, fornecedores e necessidade de compra.',
    endpoint: '/api/v1/compras/pedidos',
    primaryAction: { label: 'Novo pedido', icon: 'pi pi-shopping-cart' },
    secondaryActions: [
      { label: 'Importar XML', icon: 'pi pi-file-import' },
      { label: 'Cotacao', icon: 'pi pi-comments' }
    ],
    kpis: [
      { label: 'Pedidos abertos', value: '9', detail: 'R$ 74.200', icon: 'pi pi-shopping-cart', tone: 'info' },
      { label: 'XML pendente', value: '3', detail: 'aguardando vinculo', icon: 'pi pi-file', tone: 'warning' },
      { label: 'Economia cotada', value: '6,2%', detail: 'ultima rodada', icon: 'pi pi-percentage', tone: 'success' }
    ],
    columns: [
      { field: 'numero', header: 'Numero' },
      { field: 'fornecedor', header: 'Fornecedor' },
      { field: 'emissao', header: 'Emissao' },
      { field: 'itens', header: 'Itens', type: 'number' },
      { field: 'valor', header: 'Valor', type: 'money' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { numero: 'PC-00128', fornecedor: 'Distribuidora Pecas CE', emissao: '2026-05-17', itens: 42, valor: 28400, status: 'Aberto' },
      { numero: 'NE-00077', fornecedor: 'Riffel Brasil', emissao: '2026-05-16', itens: 18, valor: 15120, status: 'XML recebido' },
      { numero: 'CT-00019', fornecedor: '3 fornecedores', emissao: '2026-05-18', itens: 12, valor: 8420, status: 'Cotando' }
    ],
    queueTitle: 'Abastecimento',
    queue: [
      { title: 'Bateria 5Ah', detail: 'Comprar 8 unidades sugeridas', status: 'Necessidade', tone: 'warning' },
      { title: 'NF-e entrada', detail: 'XML importado aguardando conferencia', status: 'Validar', tone: 'info' },
      { title: 'Pedido PC-00128', detail: 'Entrega parcial prevista amanha', status: 'Acompanhar', tone: 'neutral' }
    ],
    formTitle: 'Pedido rapido',
    formFields: [
      { label: 'Fornecedor', value: '' },
      { label: 'Previsao', value: '', kind: 'date' },
      { label: 'Observacao', value: '', kind: 'textarea' }
    ],
    insightTitle: 'Entrada de estoque',
    insights: [
      'Nota de entrada alimenta estoque e contas a pagar.',
      'Importacao XML deve casar itens do fornecedor com produto interno.',
      'Cotacao multi-fornecedor pode nascer da necessidade de compra.'
    ]
  },
  fiscal: {
    area: 'Fiscal',
    title: 'Fiscal e documentos',
    description: 'NFC-e, NF-e, CF-e, NFS-e, MDF-e, SPED e parametrizacoes tributarias.',
    endpoint: '/api/v1/fiscal/documentos',
    primaryAction: { label: 'Consultar notas', icon: 'pi pi-search' },
    secondaryActions: [
      { label: 'SPED', icon: 'pi pi-file-export' },
      { label: 'Parametros IBS/CBS', icon: 'pi pi-sliders-h' }
    ],
    kpis: [
      { label: 'NFC-e autorizadas', value: '128', detail: 'mes atual', icon: 'pi pi-check-circle', tone: 'success' },
      { label: 'Rejeicoes', value: '4', detail: 'cadastro fiscal', icon: 'pi pi-times-circle', tone: 'danger' },
      { label: 'XMLs', value: '100%', detail: 'diretorio organizado', icon: 'pi pi-folder', tone: 'info' }
    ],
    columns: [
      { field: 'modelo', header: 'Modelo', type: 'status' },
      { field: 'numero', header: 'Numero' },
      { field: 'cliente', header: 'Cliente' },
      { field: 'emissao', header: 'Emissao' },
      { field: 'valor', header: 'Valor', type: 'money' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { modelo: 'NFC-e', numero: '1284', cliente: 'Consumidor Balcao', emissao: '2026-05-18 10:18', valor: 318.3, status: 'Autorizada' },
      { modelo: 'NF-e', numero: '0551', cliente: 'Moto Rapido Entregas', emissao: '2026-05-17 16:20', valor: 1240, status: 'Autorizada' },
      { modelo: 'NFS-e', numero: '0008', cliente: 'Carlos Oficina ME', emissao: '2026-05-16 15:40', valor: 220, status: 'Pendente' },
      { modelo: 'NFC-e', numero: '1283', cliente: 'Joao Batista', emissao: '2026-05-18 09:42', valor: 89.9, status: 'Rejeitada' }
    ],
    queueTitle: 'Pendencias fiscais',
    queue: [
      { title: 'NFC-e 1283 rejeitada', detail: 'NCM invalido no item 1', status: 'Corrigir', tone: 'danger' },
      { title: 'SPED Fiscal', detail: 'Periodo 05/2026 em preparacao', status: 'Processar', tone: 'info' },
      { title: 'IBS/CBS por NCM', detail: 'Parametros de transicao incompletos', status: 'Revisar', tone: 'warning' }
    ],
    formTitle: 'Filtro fiscal',
    formFields: [
      { label: 'Modelo', value: 'NFC-e' },
      { label: 'Periodo inicial', value: '2026-05-01', kind: 'date' },
      { label: 'Periodo final', value: '2026-05-18', kind: 'date' }
    ],
    insightTitle: 'Responsabilidade',
    insights: [
      'Calculo e envio SEFAZ devem permanecer no backend.',
      'Frontend trata status, consulta, contingencia visual e correcoes de cadastro.',
      'Idempotencia fiscal e chave de acesso nao devem ser geradas no cliente.'
    ]
  },
  services: {
    area: 'Servicos',
    title: 'Oficina e DAV-OS',
    description: 'Atendimentos, veiculos, servicos, mecanicos, pecas e garantia.',
    endpoint: '/api/v1/servicos/dav-os',
    primaryAction: { label: 'Novo atendimento', icon: 'pi pi-wrench' },
    secondaryActions: [
      { label: 'Veiculos', icon: 'pi pi-car' },
      { label: 'Garantia', icon: 'pi pi-shield' }
    ],
    kpis: [
      { label: 'OS abertas', value: '11', detail: 'oficina hoje', icon: 'pi pi-wrench', tone: 'info' },
      { label: 'Em execucao', value: '6', detail: 'boxes ocupados', icon: 'pi pi-cog', tone: 'warning' },
      { label: 'Finalizadas', value: '9', detail: 'aguardando caixa', icon: 'pi pi-check', tone: 'success' }
    ],
    columns: [
      { field: 'numero', header: 'DAV-OS' },
      { field: 'cliente', header: 'Cliente' },
      { field: 'veiculo', header: 'Veiculo' },
      { field: 'consultor', header: 'Consultor' },
      { field: 'total', header: 'Total', type: 'money' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { numero: 'OS-00418', cliente: 'Joao Batista', veiculo: 'BROS 150 OCP-1020', consultor: 'ANA', total: 418.3, status: 'Aberto' },
      { numero: 'OS-00417', cliente: 'Carlos Oficina ME', veiculo: 'CG 160 QWE-8A12', consultor: 'Consultor 02', total: 980, status: 'Em execucao' },
      { numero: 'OS-00416', cliente: 'Moto Rapido Entregas', veiculo: 'Biz 125 HJK-2211', consultor: 'ANA', total: 220, status: 'Finalizado' },
      { numero: 'OS-00415', cliente: 'Consumidor Balcao', veiculo: 'Pop 110 N/I', consultor: 'Consultor 02', total: 120, status: 'Garantia' }
    ],
    queueTitle: 'Box da oficina',
    queue: [
      { title: 'OS-00417', detail: 'Aguardando peca reservada no estoque 01', status: 'Pendente', tone: 'warning' },
      { title: 'OS-00416', detail: 'Enviar para caixa importar DAV-OS', status: 'Caixa', tone: 'info' },
      { title: 'OS-00415', detail: 'Garantia exige relatorio tecnico', status: 'Revisar', tone: 'danger' }
    ],
    formTitle: 'Atendimento rapido',
    formFields: [
      { label: 'Cliente', value: '' },
      { label: 'Placa', value: '' },
      { label: 'Quilometragem', value: '0', kind: 'number' },
      { label: 'Defeito informado', value: '', kind: 'textarea' }
    ],
    insightTitle: 'DAV-OS',
    insights: [
      'OS agrega cabecalho de veiculo, pecas e servicos.',
      'Finalizacao pode gerar financeiro e ser importada pelo PDV.',
      'Reabilitar OS deve estornar financeiro e movimentos vinculados.'
    ]
  },
  generic: {
    area: 'Operação',
    title: 'Area operacional',
    description: 'Visao funcional com dados demo ate o backend expor contrato final.',
    endpoint: '/api/v1/demo',
    primaryAction: { label: 'Novo registro', icon: 'pi pi-plus' },
    secondaryActions: [],
    kpis: DEFAULT_KPIS,
    columns: [
      { field: 'codigo', header: 'Codigo' },
      { field: 'descricao', header: 'Descricao' },
      { field: 'status', header: 'Status', type: 'status' }
    ],
    rows: [
      { codigo: 'DEMO-1', descricao: 'Registro demonstrativo', status: 'Ativo' }
    ],
    queueTitle: 'Fila',
    queue: [],
    formTitle: 'Formulario',
    formFields: DEFAULT_FIELDS,
    insightTitle: 'Notas',
    insights: ['Dados demo carregados localmente quando a API nao responder.']
  }
};
