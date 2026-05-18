# ADR-015: Codigo de Produto Canonico

Status: Aceita

## Contexto

Balconistas pesquisam codigos com e sem pontuacao.

## Decisao

Aceitar codigos como `101.425-2` ou `1014252`. Backend normaliza e banco armazena o canonico.

## Consequencias

Campos de busca nao devem rejeitar pontuacao visual.
