# ADR-007: Multi-tenancy com RLS

Status: Aceita

## Contexto

Isolamento entre tenants e requisito de seguranca central.

## Decisao

Usar Row-Level Security do PostgreSQL com `current_setting('chocobo.tenant_id')`. O filtro fica no banco, nao apenas na aplicacao.

## Consequencias

O frontend nunca deve tentar contornar isolamento com filtros manuais.
