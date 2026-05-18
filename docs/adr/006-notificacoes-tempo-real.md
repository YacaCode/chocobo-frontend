# ADR-006: Notificacoes em Tempo Real

Status: Aceita

## Contexto

Eventos de caixa, fiscal, estoque e alertas gerenciais precisam chegar sem polling pesado.

## Decisao

Usar WebSocket com STOMP no backend e RxJS no frontend.

## Consequencias

Streams de UI devem limpar inscricoes e respeitar loja ativa.
