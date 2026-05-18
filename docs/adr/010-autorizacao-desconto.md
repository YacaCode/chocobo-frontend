# ADR-010: Autorizacao de Desconto

Status: Aceita

## Contexto

Descontos acima do permitido exigem aprovacao gerencial rastreavel.

## Decisao

Gerente informa credencial em modal; backend emite token curto de 5 minutos vinculado a pre-venda. O evento e registrado em `autorizacao_desconto`.

## Consequencias

O frontend apenas coleta credenciais e envia token; nao calcula permissao de desconto.
