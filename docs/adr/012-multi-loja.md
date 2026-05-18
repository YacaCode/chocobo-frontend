# ADR-012: Multi-loja

Status: Aceita

## Contexto

PH Motopecas e PH Motoservice operam como lojas distintas no mesmo produto.

## Decisao

Toda tabela transacional tem `loja_id`. Usuario escolhe loja ativa no login; queries filtram automaticamente via interceptores e contexto de tenant/loja.

## Consequencias

Topbar e stores devem manter loja ativa visivel e trocavel.
