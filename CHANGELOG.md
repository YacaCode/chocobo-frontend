# Changelog

## 0.1.0 - 2026-05-18

- Inicializa frontend Angular 18 do Chocobo.
- Adiciona shell da aplicacao, tema Chocobo, dark mode e pagina `/health`.
- Configura OpenAPI Generator, Vitest, Playwright, Docker e CI.
- Adiciona ADRs e documentacao Smartbusiness em `docs/`.

## Unreleased

- Adiciona login, selecao de loja, sessao por signals/localStorage e headers de contexto no interceptor HTTP.
- Integra selecao de loja com `POST /api/v1/core/me/loja-ativa` para atualizar token quando backend responde.
- Expande shell com navegacao ERP, topbar contextual e paginas operacionais para dashboard, core, cadastros, estoque, vendas, caixa, financeiro, compras, fiscal e oficina.
- Inclui dados demo e fallback amigavel para endpoints ainda indisponiveis.
- Gera `openapi.yaml` local e cliente TypeScript Angular em `src/app/api/generated`.
