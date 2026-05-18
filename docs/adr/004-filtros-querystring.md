# ADR-004: Filtros Via Querystring

Status: Aceita

## Contexto

Consultas precisam ser cacheaveis e simples de compartilhar.

## Decisao

Filtros sao enviados via querystring em GET. POST fica reservado para criacao.

## Consequencias

Filtros de tela devem refletir estado na URL quando fizer sentido.
