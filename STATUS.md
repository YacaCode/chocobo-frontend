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
