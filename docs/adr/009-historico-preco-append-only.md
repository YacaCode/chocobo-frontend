# ADR-009: Historico de Preco Append-only

Status: Aceita

## Contexto

Precificacao precisa manter rastreabilidade e auditoria.

## Decisao

Pricing composto vive em `produto_preco_historico`. Cada mudanca cria nova linha; nunca update.

## Consequencias

Telas de preco devem enviar alteracoes como nova vigencia.
