# STATUS

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
