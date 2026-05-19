# STATUS

Commit inicial: 10397ff

## F0-002 [FE] Inicializar repo chocobo-frontend

Status: implementado localmente.

- Estrutura Angular 18 standalone criada manualmente.
- Shell com TopBar, Sidebar, Footer e RouterOutlet.
- Tema Chocobo com Tailwind e PrimeNG.
- Dark mode persistido em `localStorage`.
- Rota `/health` consumindo `GET /api/v1/health` com fallback amigavel.
- Script `generate:api` configurado para baixar/usar `openapi.yaml` e gerar `src/app/api/generated`.
- Vitest e Playwright configurados com smoke tests.
- Dockerfile multistage e CI GitHub Actions incluidos.

## Validacao

- `npm run lint`: verde em 2026-05-18.
- `npm run test`: verde em 2026-05-18.
- `npm run build`: verde em 2026-05-18.
- `npm run test:e2e`: verde em 2026-05-18.
- `docker build`: pendente porque Docker nao esta instalado/no PATH neste host.
- `npm audit`: 39 vulnerabilidades transitivas reportadas.
- `npm audit --omit=dev`: 3 vulnerabilidades altas em Angular 18.x. Nao foi aplicado `audit fix --force` porque a correcao sobe Angular para 21.x, fora do peer range do PrimeNG 17 travado no PRD.

## F0-003 [BOTH] Criar pasta docs compartilhada

Status: implementado localmente.

- `docs/adr/` contem os 15 ADRs do PRD.
- `docs/openapi/` preparado para snapshots de contrato.
- `docs/spec/` contem a documentacao Smartbusiness fornecida.

## F1-001 [FE] Frontend operacional amplo Smartbusiness

Status: implementado localmente em 2026-05-18.

- Login com servidor, usuario e senha; fallback demo local quando `/api/v1/auth/login` nao responder.
- Sessao com Angular signals e persistencia em `localStorage`, incluindo usuario, token, lojas permitidas e loja ativa.
- Selecao de loja reemite access token via `POST /api/v1/core/me/loja-ativa` quando a API esta disponivel.
- Selecao de loja obrigatoria para areas operacionais; `/health` permanece publico para manter smoke test e monitoramento.
- Interceptor HTTP adiciona `Authorization`, `X-Chocobo-Store-Id`, `X-Chocobo-Server` e `X-Chocobo-User` em chamadas `/api/*`.
- Shell ampliado com sidebar por modulos, topbar com usuario/loja/troca de loja/logout e footer com contexto operacional.
- Dashboard operacional e paginas responsivas para usuarios, lojas, clientes, produtos, saldos, transferencias, inventarios, pre-vendas, PDV, caixa, financeiro, compras, fiscal e oficina.
- Paginas usam PrimeNG, consulta filtravel, indicadores, filas de trabalho, formularios de rascunho e dados demo com tentativa de carregar endpoint real.

## Validacao F1-001

- `npm.cmd run lint`: verde em 2026-05-18.
- `npm.cmd run test`: verde em 2026-05-18.
- `npm.cmd run build`: verde em 2026-05-18.
- `npm.cmd run test:e2e`: verde em 2026-05-18.
- Smoke Playwright manual: `/login` -> selecionar loja -> `/dashboard` verde em 2026-05-18.
- `npm.cmd run generate:api`: verde em 2026-05-18 com `openapi.yaml` local e JDK do workspace no PATH. O cliente gerado segue ignorado pelo `.gitignore`.

## Ralph Loop - Implementacao de Paginas Especificas (2026-05-18)

Status: implementado localmente em 2026-05-18.

### Componentes compartilhados criados:

- `src/app/shared/produto-busca-dialog/produto-busca-dialog.component.ts` (F2-012)
  - Dialog modal busca de produtos com debounce 400ms
  - Busca em `/api/v1/cadastros/produtos?q=` com fallback demo
  - Tabela com codigo, descricao, fabricante, preco, disponivel
  - Atalho Esc/Enter, selecao por duplo clique ou botao

- `src/app/shared/cliente-busca-dialog/cliente-busca-dialog.component.ts`
  - Dialog modal busca de clientes com debounce 400ms
  - Busca em `/api/v1/cadastros/clientes?q=` com fallback demo
  - Colunas: codigo, razao social, documento, telefone, cidade

- `src/app/shared/forma-pagamento-dialog/forma-pagamento-dialog.component.ts`
  - Dialog para selecao de formas de pagamento
  - Suporte a: Dinheiro, Cartao Debito, Cartao Credito, PIX, Cheque, Boleto, Crediario
  - Validacao em tempo real do total vs formas informadas

### Paginas de Vendas:

- `src/app/features/pre-venda/pre-venda-list.page.ts` (F4-007)
  - Lista de pre-vendas com KPIs, filtros por status, busca com debounce
  - Status pills coloridos, paginacao, navegacao para form
  - Carrega de `/api/v1/vendas/pre-vendas` com fallback demo

- `src/app/features/pre-venda/pre-venda-form.page.ts` (F4-008)
  - Formulario de pre-venda com atalhos F1/F4/F8/Ctrl+S/Esc
  - Grid de itens editavel inline com calculos em tempo real (Signals)
  - Painel lateral de totais: subtotal, desconto, total, pago, troco
  - Integracao com ProdutoBuscaDialog, ClienteBuscaDialog, FormaPagamentoDialog

### PDV Fullscreen:

- `src/app/features/pdv/pdv.page.ts` (F4-012)
  - Layout fullscreen sem TopBar/Sidebar (60/40 itens/totais)
  - Auto-focus no campo de codigo de barras
  - Atalhos F1-F12, adicao de item por codigo + Enter
  - Finaliza venda via `/api/v1/fiscal/nfce` com fallback demo
  - Relogio em tempo real no header

### Operacoes de Caixa:

- `src/app/features/caixa/abrir-sessao.page.ts` (F4-013)
  - Input de saldo inicial com formatacao de moeda
  - Chama `POST /api/v1/caixa/abrir`, redireciona para PDV

- `src/app/features/caixa/sangria.page.ts`
  - Suporta SANGRIA e SUPRIMENTO com validacao de motivo
  - Chama `POST /api/v1/caixa/sessoes/{id}/movimentos`

- `src/app/features/caixa/encerrar-sessao.page.ts`
  - Mostra valor esperado, campo de valor conferido
  - Divergencia calculada em tempo real, colorida em vermelho se > 0

### Estoque:

- `src/app/features/estoque/estoque-saldos.page.ts` (Tarefa 8)
  - Tabela com status visual NORMAL/CRITICO/COMPRAR/ZERADO
  - KPIs: SKUs com saldo, criticos, zerados, valor total
  - Exportacao CSV funcional, filtros por codigo/descricao/status

### Rotas:

- `src/app/app.routes.ts` atualizado com todas as novas rotas lazy-loaded

### Validacao Ralph Loop:

- `npm run lint`: verde em 2026-05-18.
- `npm run build`: verde em 2026-05-18 (warnings de budget CSS em 2 componentes, nao sao erros).

## F2-008 a F3-008 [FE] Cadastros e Estoque - Ralph Loop Agente Cadastros (2026-05-18)

Status: implementado em 2026-05-18.

### Validador compartilhado:

- `src/app/shared/validators/cpf-cnpj.validator.ts`
  - Validacao de CPF e CNPJ por algoritmo
  - ValidatorFn para uso em ReactiveFormsModule
  - Funcoes de mascara para CPF, CNPJ e telefone

### F2-008 Lista de Clientes:

- `src/app/features/clientes/clientes-list.page.ts`
  - p-table com colunas: codigo, razao social, documento, telefone, cidade/UF, status
  - Status coloridos (Ativo=verde, VIP=azul, Inadimplente=amarelo, Inativo=cinza)
  - Filtros laterais: tipo PF/PJ, status, cidade; busca com debounce 400ms
  - KPI cards: Total, Ativos, Inadimplentes, VIP
  - Ctrl+N para novo cliente; click/dblclick navega para formulario
  - Fallback DEMO_CLIENTES com 10 registros variados

### F2-009 Formulario de Cliente:

- `src/app/features/clientes/clientes-form.page.ts`
  - 4 abas: Cadastro, Dados Adicionais, Contatos, Perfil
  - Alternancia PF/PJ com validacao de CPF ou CNPJ
  - Busca de CEP via ViaCEP com auto-preenchimento de endereco
  - Mascaras de CPF, CNPJ, telefone e CEP
  - Dialog para registrar historico de contatos
  - Footer sticky com Cancelar, Salvar e Novo, Salvar
  - Salva em POST /api/v1/cadastros/clientes ou PUT /id com fallback demo

### F2-010 Lista de Produtos:

- `src/app/features/produtos/produtos-list.page.ts`
  - Filtros horizontais (codigo, descricao, fabricante, secao, ref fabricante, NCM)
  - Toggle "Somente ativos" e "Exibir fotos" (miniatura placeholder)
  - Produtos em promocao destacados em azul
  - Normalizacao de codigo (ignora pontuacao na busca)
  - KPI cards: Total, Ativos, Em Promocao, Abaixo Minimo
  - Fallback DEMO_PRODUTOS com 12 pecas de moto

### F2-011 Formulario de Produto:

- `src/app/features/produtos/produtos-form.page.ts`
  - 3 abas: Dados Principais, Precos, Tributacao
  - Datalist nativo para fabricantes e secoes comuns (autocomplete)
  - Calculo de markup: custo, frete, IPI, ICMS-ST, outros, lucro -> preco sugerido
  - Chama /api/v1/catalogo/produtos/calcular-preco com fallback local
  - NCM vinculado entre aba 1 e aba 3 (readonly na tributacao)
  - Salva em POST /api/v1/cadastros/produtos com fallback demo

### F3-007 Inventario de Estoque:

- `src/app/features/estoque/inventario.page.ts`
  - Tabela de contagem com inputs numericos grandes (44px, tablet-friendly)
  - Diferenca calculada em tempo real: verde=bate, amarelo<=5%, vermelho>5%
  - Progress bar de itens conferidos vs total
  - Filtros por secao, busca e "mostrar" (todos/pendentes/conferidos/divergentes)
  - "Aplicar Contagem" envia batch para /api/v1/estoque/inventario/ajustar

### F3-008 Necessidade de Compra:

- `src/app/features/estoque/necessidade-compra.page.ts`
  - Agrupado por fabricante com accordion colapsavel
  - Total estimado por fornecedor e geral (calculado em tempo real)
  - Qtd Sugerida editavel por item
  - "Gerar Pedido de Compra" com toast de confirmacao
  - Carrega de GET /api/v1/estoque/necessidade-compra com fallback demo

### Rotas atualizadas:

- `src/app/app.routes.ts` atualizado:
  - /cadastros/clientes -> ClientesListPage
  - /cadastros/clientes/novo -> ClientesFormPage
  - /cadastros/clientes/:id -> ClientesFormPage
  - /cadastros/produtos -> ProdutosListPage
  - /cadastros/produtos/novo -> ProdutosFormPage
  - /cadastros/produtos/:id -> ProdutosFormPage
  - /estoque/inventarios -> InventarioPage
  - /estoque/necessidade-compra -> NecessidadeCompraPage

### Correcoes de compatibilidade:

- `src/app/shared/cliente-busca-dialog/cliente-busca-dialog.component.ts`
  - Corrigido $event.data com $any() para compatibilidade PrimeNG 17
- `src/app/shared/produto-busca-dialog/produto-busca-dialog.component.ts`
  - Corrigido $event.data com $any() para compatibilidade PrimeNG 17

### Validacao F2/F3:

- `npm run build`: verde em 2026-05-18 (zero erros TypeScript, apenas warnings de budget CSS nos componentes do outro agente).

## Bloco A — Correções Urgentes FE (2026-05-19)

Status: implementado em 2026-05-19.

### A-001 [FE] ConfirmDialog no cancelar() do pre-venda-form

- `src/app/features/pre-venda/pre-venda-form.page.ts`
  - Removido `window.confirm()` do método `cancelar()`
  - Adicionado `ConfirmDialogModule` aos imports do componente
  - Adicionado `ConfirmationService` aos providers
  - Injetado `ConfirmationService` na classe
  - Adicionado `<p-confirmDialog>` ao template (logo após `<p-toast>`)
  - Método `cancelar()` reescrito: se sem itens, navega direto; senão exibe dialog PrimeNG com opções "Sair sem salvar" / "Continuar editando"

### A-002 [FE] Páginas 403 e 404 com mascote Chocobo

- `src/app/features/not-found/not-found.page.ts` (editado)
  - Template substituído com SVG inline do pássaro Chocobo amarelo
  - Código 404 em destaque, título e descrição amigáveis
  - Link "Voltar ao início" com pButton + routerLink="/dashboard"
  - Estilos de centralizacao e tipografia com variáveis CSS do tema

- `src/app/features/forbidden/forbidden.page.ts` (criado)
  - Mesmo padrão visual do 404, porém código 403 em vermelho (#dc2626)
  - SVG do Chocobo com braços cruzados (recusa)
  - Mensagem "Acesso negado — O Chocobo não vai deixar você passar"

- `src/app/app.routes.ts` atualizado:
  - Adicionada rota `path: '403'` → ForbiddenPage (lazy)
  - Adicionada rota `path: 'preferencias'` → PreferenciasPage (lazy, canActivate: authGuard)

### A-003 [FE] Página /preferencias

- `src/app/features/preferencias/preferencias.page.ts` (criado)
  - Seção "Aparência": SelectButton para tema (Claro/Escuro/Auto) e densidade (Compacto/Normal/Espaçado)
  - Seção "Sons": Checkbox para som de bip no PDV
  - Salva em `localStorage['chb_prefs']` com toast de sucesso
  - Ao mudar o tema: chama `ThemeService.setTheme()`

- `src/app/core/theme/theme.service.ts` atualizado:
  - Adicionado método público `setTheme(tema: 'light' | 'dark' | 'auto')` que aplica `data-theme` no HTML e persiste em localStorage

- `src/app/layout/topbar.component.ts` atualizado:
  - Adicionado botão (ícone `pi pi-cog`) na topbar com routerLink="/preferencias"
  - Adicionado "Preferencias" ao mapa de títulos de página

### Validação A-001/A-002/A-003:

- `npm run build`: verde em 2026-05-19 (zero erros TypeScript; 2 warnings de budget CSS pré-existentes).
- `npm run test`: verde em 2026-05-19 (1/1 passando).

## Backend Full-Stack Verification (2026-05-19)

Status: sistema completo e rodando.

### Correccoes aplicadas no backend:

1. `RefreshToken.java`: removido `columnDefinition = "inet"` (incompativel com H2)
2. `BaseEntity.java`: `version` inicializado com `0L` para suportar `saveAll` com IDs fixos
3. `JpaAuditingConfig.java`: adicionado `DateTimeProvider` retornando `OffsetDateTime` (necessario para @CreatedDate/@LastModifiedDate)
4. `TenantInterceptor.java`: perfil mudado para `!test & !dev-local` (evita chamada PostgreSQL-especifica `set_config` no H2)
5. `DemoAuthService.java` + `DemoCoreUserService.java`: perfil mudado para `{"test", "dev-local"}` (usa auth demo no H2)
6. `JpaAuthService.java` + `JpaCoreUserService.java`: perfil mudado para `!test & !dev-local`
7. Todos os services de bounded context (`ProdutoService`, `ClienteService`, `PreVendaService`, `CaixaService`, `EstoqueService`, `DavOsService`): adicionado `@Profile("!test")` para nao quebrar o perfil de testes que exclui JPA

### Estado do sistema:

- Backend rodando na porta 8080 com perfil `dev-local` (H2 in-memory)
- Frontend rodando na porta 4200 com proxy para backend
- Login: `admin` / `Admin@123`
- 47/47 testes backend passando
- 1/1 testes frontend passando
- 1/1 e2e Playwright passando
- Build Angular OK (apenas 2 warnings de budget CSS pre-existentes)

### APIs funcionando (todas retornam 200):

- GET /api/v1/health
- GET /api/v1/dashboard
- GET /api/v1/cadastros/produtos (15 registros)
- GET /api/v1/cadastros/clientes (10 registros)
- GET /api/v1/cadastros/fornecedores
- GET /api/v1/cadastros/auxiliares
- GET /api/v1/estoque/saldos (14 registros)
- GET /api/v1/estoque/necessidade-compra
- GET /api/v1/vendas/pre-vendas (5 registros seed + criados)
- GET /api/v1/vendas/formas-pagamento (7 ativas)
- GET /api/v1/caixa/sessoes
- GET /api/v1/financeiro/contas-receber
- GET /api/v1/financeiro/contas-pagar
- GET /api/v1/financeiro/fluxo
- GET /api/v1/compras/pedidos
- GET /api/v1/servicos/dav-os (5 registros)
- GET /api/v1/fiscal/documentos
- POST /api/v1/auth/login

### Operacoes de escrita verificadas:

- Criar pre-venda com auto-numeracao
- Adicionar item a pre-venda
- Avancar status: ABERTA -> SEPARADA
- Abrir sessao de caixa (ABERTO)
