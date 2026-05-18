# ADR-011: Contract-first OpenAPI

Status: Aceita

## Contexto

Backend e frontend evoluem em repositorios separados.

## Decisao

Backend e dono da API. Frontend regenera tipos a partir do `openapi.yaml` publicado em release do backend.

## Consequencias

Tipos de API nao devem ser escritos manualmente no frontend.
