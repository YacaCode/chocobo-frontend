# ADR-003: Paginacao Padrao

Status: Aceita

## Contexto

Listagens do ERP precisam ser previsiveis para frontend e relatorios.

## Decisao

Paginar com `page=0&size=20&sort=campo,asc` e retornar `{content, page, size, totalElements, totalPages, first, last}`.

## Consequencias

Tabelas PrimeNG devem mapear esse envelope de forma uniforme.
