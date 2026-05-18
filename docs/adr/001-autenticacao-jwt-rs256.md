# ADR-001: Autenticacao JWT RS256

Status: Aceita

## Contexto

O ERP precisa autenticar usuarios em ambiente multi-tenant e multi-loja com sessoes curtas e renovacao controlada.

## Decisao

Usar JWT RS256. Access token expira em 15 minutos, refresh token expira em 7 dias e refresh e rotativo.

## Consequencias

O frontend nao persiste segredo e deve tratar refresh e logout de forma centralizada.
