# Changelog

## 0.1.0 - 2026-05-18

- Inicializa frontend Angular 18 do Chocobo.
- Adiciona shell da aplicacao, tema Chocobo, dark mode e pagina `/health`.
- Configura OpenAPI Generator, Vitest, Playwright, Docker e CI.
- Adiciona ADRs e documentacao Smartbusiness em `docs/`.

## Unreleased

- Adiciona CRUDs auxiliares de fabricantes, secoes, unidades, NCM e montadoras com componente generico.
- Implementa paginas de caixa para suprimento, fechamento diario, recebimento avulso e pagamento avulso.
- Adiciona skeleton loading nas listas principais de clientes, produtos, pre-vendas e saldos.
- Corrige aplicacao de dark mode via `data-theme` e melhora compatibilidade visual com componentes PrimeNG.
- Adiciona graficos ECharts ao dashboard com carregamento dinamico da biblioteca.
- Remove `window.prompt()` do formulario de clientes e usa dialogs PrimeNG para socios e referencias.
- Remove persistencia de token JWT em `localStorage`; sessao autenticada fica em memoria e o servidor digitado e lembrado separadamente.
- Adiciona login, selecao de loja, sessao por signals e headers de contexto no interceptor HTTP.
- Integra selecao de loja com `POST /api/v1/core/me/loja-ativa` para atualizar token quando backend responde.
- Expande shell com navegacao ERP, topbar contextual e paginas operacionais para dashboard, core, cadastros, estoque, vendas, caixa, financeiro, compras, fiscal e oficina.
- Inclui dados demo e fallback amigavel para endpoints ainda indisponiveis.
- Gera `openapi.yaml` local e cliente TypeScript Angular em `src/app/api/generated`.
- Implementa importacao XML NF-e em `/compras/notas-entrada` com upload drag-drop, preview, mapeamento de produtos e lancamento no estoque.
