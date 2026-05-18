# ADR-013: Idempotencia Fiscal

Status: Aceita

## Contexto

Reenvios para SEFAZ nao podem duplicar documentos.

## Decisao

Cada submissao SEFAZ usa UUID de idempotencia. Reenvio com mesmo UUID retorna a resposta anterior.

## Consequencias

A UI deve bloquear clique duplicado e exibir o estado da submissao existente.
