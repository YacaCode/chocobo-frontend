# ADR-008: Soft Delete

Status: Aceita

## Contexto

Registros fiscais, financeiros e operacionais nao podem desaparecer fisicamente.

## Decisao

Toda tabela operacional usa `deleted_at timestamptz`. Apenas tabelas de log podem ter delete fisico com particionamento.

## Consequencias

A UI deve mostrar acoes de inativar/cancelar conforme o contexto.
