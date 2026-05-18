# Chocobo Frontend

Frontend Angular do ERP Chocobo, iniciado para a tarefa F0-002 do PRD.

## Fontes de verdade

- `PRD.md`: backlog, run mode Ralph e decisoes de produto.
- `docs/spec/Documentacao_Smartbusiness.docx`: referencia funcional do Smartbusiness legacy.
- `docs/adr/`: decisoes arquiteturais vinculantes.

## Stack

- Angular 18 com standalone components, Signals e rotas lazy.
- PrimeNG 17, PrimeIcons e TailwindCSS 3.4 com tema Chocobo.
- NgRx Signals para estado compartilhado.
- OpenAPI Generator para cliente HTTP gerado em `src/app/api/generated`.
- Vitest para testes unitarios e Playwright para e2e.

## Rodar local

```bash
npm install
npm run start
```

A aplicacao sobe em `http://localhost:4200` e a rota principal redireciona para `/health`.

## Gerar cliente da API

```bash
npm run generate:api
```

O script usa `openapi.yaml` local quando existir. Se nao existir, tenta baixar o asset `openapi.yaml` da release mais recente do backend via GitHub CLI:

```bash
CHOCOBO_BACKEND_REPO=seu-usuario/chocobo-backend npm run generate:api
```

Nao escreva tipos da API manualmente. O diretorio `src/app/api/generated` e artefato do gerador.

## Testes

```bash
npm test
npm run test:e2e
npm run build
```

## Docker

```bash
docker build -t chocobo-frontend .
docker run --rm -p 8080:80 chocobo-frontend
```
