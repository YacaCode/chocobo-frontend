# ADR-005: Upload de Arquivos

Status: Aceita

## Contexto

O sistema armazena midias e documentos, com tamanhos diferentes.

## Decisao

Arquivos pequenos abaixo de 5MB usam multipart direto. Arquivos grandes usam presigned URL S3-compativel.

## Consequencias

Componentes de upload precisam suportar os dois fluxos.
