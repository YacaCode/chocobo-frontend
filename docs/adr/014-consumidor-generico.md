# ADR-014: Cliente Generico Consumidor

Status: Aceita

## Contexto

Vendas de balcao podem ocorrer sem identificacao formal do cliente.

## Decisao

Usar cliente seed especial `CONSUMIDOR`. CPF do consumidor na NFC-e e campo separado.

## Consequencias

Fluxos de PDV devem permitir venda sem cadastro completo do cliente.
