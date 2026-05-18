# PERGUNTAS

## Abertas

- Qual e o repositorio GitHub canonico do `chocobo-backend` para configurar `CHOCOBO_BACKEND_REPO` sem placeholder?

## P-001 - Atualizacao de stack frontend por vulnerabilidades Angular (status: aberta, criada 2026-05-18, tarefa F0-002)

**Contexto:** `npm audit --omit=dev` reportou 3 vulnerabilidades altas nas dependencias Angular 18.x. O npm nao lista patch seguro para Angular 18; a correcao sugerida sobe Angular para 21.x.

**Conflito:** o PRD trava Angular 18+ com PrimeNG 17. O `primeng@17.18.15` declara peer dependency `@angular/*` como `^17.0.0 || ^18.0.0`, entao atualizar Angular para 21.x exige tambem atualizar PrimeNG ou aceitar peer dependencies fora do contrato.

**Opcoes identificadas:**
- A) Manter Angular 18 + PrimeNG 17 conforme PRD e aceitar o risco ate aprovar ADR.
- B) Aprovar ADR substituindo a stack para Angular 21 + PrimeNG compativel.
- C) Procurar mitigacao temporaria por configuracao, mantendo stack travada.

**Decisao necessaria para:** considerar o frontend pronto para uso real com security gate verde.

**Resposta humana:** ________
