# ADR-002: Erros ProblemDetail RFC 7807

Status: Aceita

## Contexto

Clientes web e integracoes precisam tratar erros de forma consistente.

## Decisao

Todos os erros HTTP usam ProblemDetail RFC 7807. O campo `type` usa URN `https://chocobo.app/errors/<slug>`.

## Consequencias

Interceptors e telas exibem mensagens amigaveis sem depender de erro tecnico cru.
