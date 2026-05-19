# PRD — Chocobo

> **Documento operacional.** Este é o **único** arquivo que o agente Codex executa em loop (padrão "Ralph"). O agente lê este PRD inteiro a cada iteração, identifica a próxima tarefa não concluída, executa, marca como feita, e repete.

---

## 0. Run Mode — instruções obrigatórias para o agente Codex

> **Leia este bloco antes de qualquer outra coisa em cada iteração do loop.**

### 0.1 Identidade do agente

Você é um engenheiro de software autônomo trabalhando num único repositório. Antes de qualquer ação:

1. **Detecte em qual repositório está rodando:**
   - Se existir `pom.xml` na raiz → você é o **AGENTE BACKEND** (Spring Boot)
   - Se existir `angular.json` na raiz → você é o **AGENTE FRONTEND** (Angular)
   - Se nenhum dos dois existir → você está no setup inicial; siga a Tarefa F0-001 (criar o esqueleto do repo).

2. **Você só trabalha em tarefas marcadas com sua tag:** `[BE]` para backend, `[FE]` para frontend, `[BOTH]` quando se aplica aos dois (cada agente faz no seu lado).

3. **Nunca toque no outro repositório.** A coordenação entre os dois é via contrato OpenAPI publicado em GitHub Releases do backend.

### 0.2 O loop Ralph (algoritmo)

A cada execução:

```
1. Leia este PRD.md inteiro.
2. Leia STATUS.md (se existir) para saber o que já foi feito.
3. Leia PERGUNTAS.md (se existir) para verificar pendências aguardando resposta humana.
4. Se houver pergunta sem resposta há mais de 1 iteração → PARE e relate.
5. Identifique a PRÓXIMA tarefa do seu agente (primeira "[ ]" com sua tag, em ordem do backlog).
6. Se a tarefa depende de outra ainda não concluída (campo "Depende de:" na tarefa) → pule para a próxima viável.
7. Execute a tarefa. Mantenha o escopo apertado — uma tarefa por iteração.
8. Quando concluir:
   a. Marque "[x]" no PRD.md (este arquivo).
   b. Atualize STATUS.md com data, descrição curta, commit hash.
   c. Atualize CHANGELOG.md.
   d. Faça commit Conventional Commits.
   e. Se sua tarefa publica artefatos (OpenAPI), publique-os.
9. Se encontrou dúvida de regra de negócio:
   a. NÃO chute. Adicione a pergunta em PERGUNTAS.md com contexto completo.
   b. Marque a tarefa atual com "[?]" e siga para a próxima viável.
10. Se encontrou bug ou refactor necessário: adicione ao final do backlog como tarefa nova.
11. Faça push.
```

### 0.3 Fontes da verdade (na ordem de prioridade)

Sempre que houver dúvida sobre **comportamento esperado** do sistema:

1. **Este PRD.md** — sempre vence em caso de conflito.
2. **docs/spec/Plano_Chocobo.docx** — plano detalhado de fases (gerado anteriormente).
3. **docs/spec/Documentacao_Smartbusiness.docx** — comportamento do sistema legacy que estamos replicando funcionalmente. Use como referência para regras de negócio, modelo de dados, fluxos.
4. **docs/adr/*.md** — decisões arquiteturais já tomadas e imutáveis.

Se essas fontes ainda forem ambíguas para a tarefa em mãos, registre em PERGUNTAS.md.

### 0.4 Disciplina obrigatória

- **Commits pequenos** seguindo Conventional Commits (`feat(catalogo): cadastro produto`, `fix(pre-venda): validacao desconto`, `refactor:`, `test:`, `docs:`, `chore:`).
- **Uma tarefa = um PR** (em projetos com revisão humana). Em modo Ralph puro (sem revisão), commit direto na main após testes verdes.
- **Testes obrigatórios** para cada feature: 1 happy path + 1 erro + 1 borda.
- **OpenAPI sempre atualizado** após mudança de endpoint (backend) ou regeneração de tipos (frontend).
- **NUNCA** commite secrets (.pfx, .env com credenciais, chaves privadas).
- **NUNCA** rode comandos destrutivos sem permissão explícita (rm -rf, drop database, force push).

### 0.5 Critério de parada (quando o loop encerra)

Pare e aguarde intervenção humana quando:

- Todas as tarefas com sua tag estão `[x]`.
- Tem `[?]` aguardando resposta humana há > 1 iteração.
- CI/teste quebrou e você não conseguiu corrigir em 2 tentativas.
- Você precisaria mexer no outro repositório.
- Comando crítico bloqueado por falta de permissão (ex.: rotacionar segredo, deploy em produção).

---

## 1. Visão e Missão

### 1.1 Produto

**Chocobo** é a reconstrução moderna do ERP Smartbusiness para varejo automotivo (autopeças + oficina mecânica). Mantém **paridade funcional total** com o legacy e adiciona UX moderna, multi-tenant real, observabilidade nativa e arquitetura API-first.

### 1.2 Missão

Entregar um ERP que:

- **Substitui o Smartbusiness sem perda funcional** — toda venda, ordem de serviço, contas a pagar/receber, NFC-e, NF-e, SPED, IBS/CBS do legacy precisa funcionar.
- **É operável só por teclado** para vendedor/caixa experiente (atalhos F1/F2/F4/F8 etc.).
- **É lindo e atual** para o gerente abrir no celular.
- **É confiável**: auditoria visível, multi-tenant com isolamento garantido, integridade fiscal em qualquer cenário.

### 1.3 Não-objetivos (out of scope inicial)

- Marketplace integration (Mercado Livre, OLX) — eventual fase pós-paridade.
- Loja online B2C própria — fora do escopo.
- App mobile nativo dedicado — PWA cobre o caso da frente de caixa.
- Suporte a outros segmentos (não-automotivo) — produto é vertical.

---

## 2. Personas

| Persona | Frequência | Necessidades principais |
|--------|-----------|------------------------|
| **Vendedor balcão** | 80% do tempo | Pré-venda rápida, F1 instantâneo, atalhos por teclado, autorização de desconto fluida |
| **Operador de caixa** | Várias horas/dia | NFC-e em < 30s, TEF integrado, multi-forma, sangria/suprimento, encerramento sem surpresa |
| **Consultor de oficina** | Várias horas/dia | DAV-OS rica em dados do veículo, busca de peças, vinculação a mecânico, garantia |
| **Comprador/Estoquista** | Diário | Necessidade de compra automática, import XML NF-e, transferências entre lojas |
| **Financeiro/Tesouraria** | Diário | Contas a pagar/receber, conciliação bancária, fluxo de caixa, Pix |
| **Gerente/Administrador** | Diário em mobile | Dashboard KPIs, aprovação de descontos, alertas |

---

## 3. Stack — locked in

> **NÃO ALTERE.** Decisões já tomadas; mudar requer ADR novo + aprovação humana.

### 3.1 Backend

- **Java 21 LTS** + **Spring Boot 3.3.x** + **Maven 3.9**
- **PostgreSQL 16** com Row-Level Security para multi-tenant
- **Spring Data JPA** + **Hibernate 6** + **Flyway** migrations
- **Spring Security 6** com JWT (RS256, access 15min / refresh 7 dias)
- **springdoc-openapi 2.x** publica OpenAPI 3.1 em `/v3/api-docs.yaml`
- **MapStruct** para DTO ↔ Entity (compile-time, sem reflection)
- **Lombok** permitido (mas evite no domain core)
- **Testes**: JUnit 5 + AssertJ + Mockito + **Testcontainers** (Postgres real)
- **Cache**: Caffeine local + Redis a partir de F3
- **Mensageria**: Spring Events local; RabbitMQ a partir de F6
- **Documentos fiscais**: bibliotecas Java maduras (nfe-java / similar) — **NUNCA assinar XML do zero**
- **Boletos**: jrimum-bopepo (CNAB)
- **Observabilidade**: Micrometer → Prometheus, SLF4J + Logback JSON, Spring Boot Actuator

### 3.2 Frontend

- **Angular 18+** com **standalone components**, **Signals**, novo control flow (`@if`, `@for`)
- **TypeScript 5.4 strict mode**
- **PrimeNG 17** + **TailwindCSS 3.4** + tema customizado Chocobo
- **NgRx Signals Store** para estado compartilhado (auth, loja ativa, preferências)
- **HttpClient** com interceptors (auth, retry, error)
- **Reactive Forms** tipados
- **openapi-generator-cli** gera DTOs + services HTTP a partir do `openapi.yaml` do backend — **nunca escreva tipos da API à mão**
- **i18n**: `@angular/localize` com pt-BR default
- **Charts**: Apache ECharts via `ngx-echarts`
- **Atalhos**: `tinykeys` (3KB) centralizado em `ShortcutService`
- **PWA**: `@angular/pwa` para frente de caixa offline-first
- **Testes**: Vitest (unit) + Playwright (e2e)

### 3.3 Banco

- **PostgreSQL 16**
- **Schemas separados** por bounded context: `core, pessoas, catalogo, veiculos, estoque, compras, vendas, servicos, fiscal, financeiro, caixa, gerencial`
- **Row-Level Security** em toda tabela com `tenant_id`
- **numeric(14,4)** para valores monetários, **numeric(10,4)** para quantidades, **timestamptz** sempre com fuso
- **Soft delete** via `deleted_at timestamptz`

### 3.4 Infra

- **Docker** multistage em ambos os repos
- **docker-compose** para dev local (postgres + redis + rabbitmq + backend)
- **GitHub Actions** para CI (lint + test + build)
- **GitHub Container Registry** para imagens
- **Deploy inicial**: VPS único com docker-compose; migra para Kubernetes quando crescer
- **Secrets**: variáveis de ambiente em produção, **NUNCA** no Git

---

## 4. Arquitetura e decisões (ADRs imutáveis)

> Cada ADR vive em `docs/adr/NNN-titulo.md`. As decisões abaixo são **vinculantes** — não mude sem ADR de substituição.

| ADR | Decisão |
|-----|---------|
| ADR-001 | Autenticação JWT RS256. Access 15min, refresh 7 dias. Refresh rotativo. |
| ADR-002 | Erros sempre como **ProblemDetail RFC 7807**. Campo `type` é URN `https://chocobo.app/errors/<slug>`. |
| ADR-003 | Paginação `page=0&size=20&sort=campo,asc` retornando `{content, page, size, totalElements, totalPages, first, last}`. |
| ADR-004 | Filtros via **querystring** em GET. POST só para criação. |
| ADR-005 | Upload de arquivos: pequenos (<5MB) via multipart direto; grandes via presigned URL S3-compatível. |
| ADR-006 | Notificações em tempo real: **WebSocket** com STOMP no backend, RxJS no frontend. |
| ADR-007 | Multi-tenancy: **Row-Level Security do Postgres** + `current_setting('chocobo.tenant_id')`. Filtro no banco, não na aplicação. |
| ADR-008 | Soft delete em toda tabela operacional. Apenas tabelas de log podem ter delete físico (com particionamento). |
| ADR-009 | Pricing composto em tabela `produto_preco_historico` append-only. Cada mudança = nova linha. NUNCA UPDATE. |
| ADR-010 | Autorização de desconto: gerente fornece credencial num modal; backend emite **token curto (5min) vinculado à pré-venda** que o vendedor envia ao salvar. Registra em `autorizacao_desconto`. |
| ADR-011 | Contract-first: backend é dono da API. Frontend regenera tipos do `openapi.yaml` da Release tag. |
| ADR-012 | Multi-loja: `loja_id` em toda tabela transacional. Usuário escolhe loja ativa no login; queries filtram automaticamente via interceptor. |
| ADR-013 | Idempotência fiscal: cada submissão SEFAZ tem **UUID de idempotência**. Reenvio com mesmo UUID retorna a resposta anterior, não duplica. |
| ADR-014 | Cliente genérico "CONSUMIDOR" (id seed especial) para vendas balcão sem identificação; CPF do consumidor é campo separado na NFC-e. |
| ADR-015 | Códigos de produto aceitos com/sem pontuação (`101.425-2` ou `1014252`). Normalização no backend. Banco armazena canônico. |

---

## 5. Princípios de engenharia

### 5.1 Backend

- **Não inventar regras fiscais.** Use biblioteca brasileira madura. Se a regra for específica do produto, registre em PERGUNTAS.md.
- **BigDecimal sempre** para dinheiro e quantidade. NUNCA `double`/`float`.
- **Transações pequenas e claras.** Use `@Transactional` apenas no service. Repository nunca abre transação.
- **Validação em camadas**: DTO (Bean Validation) → Service (regras de negócio) → Banco (constraints).
- **Idempotência** em endpoints que afetam estado externo (SEFAZ, banco, Pix).
- **Concorrência** com `SELECT FOR UPDATE` em estoque e financeiro.
- **Audit log** automático via trigger Postgres + Spring Data Auditing.

### 5.2 Frontend

- **Tipos sempre gerados.** Toque em `src/app/api/generated/` apenas via `npm run generate:api`.
- **Lógica de negócio fica no backend.** Frontend valida UX (formato, obrigatoriedade), não regras (limites de crédito, descontos máximos).
- **Signals para reatividade local.** RxJS apenas para HTTP e streams.
- **Acessibilidade**: roles ARIA, labels, contraste AA, navegação por teclado em tudo.
- **Performance**: lazy loading de rotas, virtual scroll em listas >50 itens, debounce em buscas (400ms).
- **i18n desde o dia 1** (mesmo só em pt-BR), nunca strings hardcoded em template.

### 5.3 Anti-padrões proibidos

- ❌ Float/double para dinheiro
- ❌ DELETE físico em entidade fiscal
- ❌ Hardcoded enum para forma de pagamento (use tabela parametrizada)
- ❌ Tipos da API escritos manualmente no frontend
- ❌ Validar regra de negócio no frontend
- ❌ Confiar no relógio do cliente para data fiscal
- ❌ Bypass de RLS (`SET ROLE postgres`) em código de aplicação
- ❌ Commit de pfx/p12 (certificado fiscal) ou .env com produção

---

## 6. Backlog estruturado

> Marque `[x]` quando concluir. Marque `[?]` quando bloqueado por pergunta humana. Tarefa = uma iteração do Ralph loop.

### Fase 0 — Setup e contrato

#### F0-001 [BE] Inicializar repo chocobo-backend
- `pom.xml` Spring Boot 3.3 + Java 21, dependências mínimas (web, validation, actuator, data-jpa, springdoc 2.x, flyway-core, postgresql, lombok, mapstruct)
- Pacote raiz `app.chocobo` com subpacotes vazios por bounded context
- `src/main/resources/application.yml` + perfis dev/test/prod
- `src/main/resources/db/migration/V0001__init.sql` criando os schemas
- Endpoint `GET /api/v1/health` → `{status, version, timestamp}`
- Configurar springdoc para `GET /v3/api-docs.yaml`
- `Dockerfile` multistage
- `docker-compose.yml` com postgres-16, redis-7, rabbitmq-3, backend
- `.github/workflows/ci.yml`: mvn verify no PR
- `.github/workflows/release.yml`: tag `v*` → publica `openapi.yaml` como release asset
- `README.md` com como rodar local
- **Done:** `docker compose up` funciona; `curl localhost:8080/api/v1/health` retorna 200; CI verde no merge.

#### F0-002 [FE] Inicializar repo chocobo-frontend
- `ng new chocobo-frontend --standalone --routing --style=scss --strict`
- Adicionar: `primeng@17 primeicons tailwindcss @ngrx/signals @openapitools/openapi-generator-cli vitest playwright @angular/pwa`
- `tailwind.config.js` com paleta Chocobo (yellow `#F9A825`, navy `#1A237E`, derivados)
- Tema PrimeNG customizado em `src/styles/chocobo-theme.scss`
- Script `npm run generate:api`: baixa `openapi.yaml` da release mais recente do `chocobo-backend` via `gh release download` e roda `openapi-generator-cli generate -i openapi.yaml -g typescript-angular -o src/app/api/generated`
- Shell da app: TopBar + Sidebar + Footer + RouterOutlet
- Dark mode toggle com persistência em localStorage
- Página `/health` consumindo `GET /api/v1/health`
- Vitest + Playwright configurados com 1 teste smoke cada
- `Dockerfile` multistage (node-20 build → nginx-alpine serve)
- `.github/workflows/ci.yml`
- **Done:** `ng serve` sobe; `/health` mostra status do backend; testes verdes; imagem buildada.

#### F0-003 [BOTH] Criar pasta docs/ compartilhada em cada repo
- `docs/adr/` com os 15 ADRs da seção 4 deste PRD (cada um como `NNN-titulo.md`)
- `docs/openapi/` para o backend snapshotar a cada release
- `README.md` em cada repo linkando para o PRD e para o Plano_Chocobo.docx
- **Done:** ADRs commitados.

### Fase 1 — Auth, multi-tenant, multi-loja, papéis

#### F1-001 [BE] Schemas core: tenant, loja, usuario, papel, audit_log
- Migration `V0002__core_tables.sql` criando todas as tabelas com `tenant_id`, soft delete, auditoria
- Trigger `audit_log` em `INSERT/UPDATE/DELETE` em todas tabelas
- Habilitar RLS em cada tabela com política filtrando por `current_setting('chocobo.tenant_id')`
- **Done:** migrations rodam idempotentes; testes Testcontainers validam RLS impede acesso cross-tenant.

#### F1-002 [BE] BaseEntity + JPA Auditing + TenantInterceptor
- `BaseEntity` abstrata com `id, tenantId, createdBy, createdAt, updatedBy, updatedAt, deletedAt, version`
- `@EnableJpaAuditing` + `AuditorAware` que pega usuário do `SecurityContext`
- `TenantInterceptor` que executa `SET chocobo.tenant_id = X` antes de cada transação
- **Done:** entidade nova herdando de BaseEntity persiste com todos campos auto-preenchidos.

#### F1-003 [BE] Spring Security 6 com JWT
- `JwtAuthenticationFilter` + `JwtTokenProvider` (RS256, chave em config)
- Roles via custom claim `papeis: ["admin", "vendedor", ...]`
- Configuração CORS permitindo origem do frontend
- **Done:** request sem token retorna 401; com token válido passa; expirado retorna 401 com `WWW-Authenticate`.

#### F1-004 [BE] Endpoints de auth
- `POST /api/v1/auth/login` `{username, password}` → `{accessToken, refreshToken, user, lojasDisponiveis}`
- `POST /api/v1/auth/refresh` `{refreshToken}` → novo par
- `POST /api/v1/auth/logout` → 204 (revoga refresh no banco)
- Rate limit 10 tentativas/5min (bucket4j)
- Lock de conta após 5 falhas em 15min (campo `bloqueado_ate` em usuario)
- **Done:** Testcontainers cobre login feliz, falha, lock, refresh.

#### F1-005 [BE] Endpoints de me e core admin
- `GET /api/v1/me` → perfil completo
- `POST /api/v1/me/loja-ativa` `{lojaId}` → regerar token com loja
- `GET/PUT /api/v1/me/preferencias`
- `GET/POST/PUT/DELETE /api/v1/core/lojas` (Admin)
- `GET/POST/PUT/DELETE /api/v1/core/usuarios` (Admin)
- `GET /api/v1/core/papeis`
- `GET /api/v1/core/audit/{entidade}/{id}` → histórico
- Seed dev: tenant "PH Motopecas Demo", 2 lojas, usuario admin/Admin@123
- **Done:** OpenAPI atualizado; release `v0.2.0` publicada.

#### F1-006 [FE] AuthService com Signals
- `auth.service.ts` com signals: `usuarioLogado()`, `lojaAtiva()`, `papeis()`, `podeFazer(acao)`
- Tokens em memória + httpOnly cookie via interceptor
- HttpInterceptor: adiciona `Authorization`, intercepta 401, tenta refresh, senão redireciona /login
- **Done:** mock de teste valida fluxo de refresh transparente.

#### F1-007 [FE] Tela /login + escolha de loja
- Card centralizado, logo Chocobo (placeholder amarelo grande), inputs PrimeNG, Enter submete
- Após login, se >1 loja, dialog modal de escolha
- Mensagens de erro amigáveis em pt-BR (em vez do erro técnico)
- **Done:** Playwright cobre login + escolha de loja + acesso ao dashboard.

#### F1-008 [FE] TopBar + Sidebar + Layout
- TopBar 48px: logo + breadcrumb + loja ativa (chip clicável) + avatar dropdown (Trocar Loja / Preferências / Sair) + dark mode toggle
- Sidebar 240px: itens Cadastros / Vendas / Estoque / Compras / Financeiro / Serviços / Caixa / Gerencial / Configurações; colapsável para 60px
- Item ativo: background yellow-50 + left-border 3px yellow
- Responsivo: <768px sidebar vira drawer
- **Done:** screenshot Playwright revisado.

#### F1-009 [FE] Telas /core/usuarios e /core/lojas (Admin)
- p-table com sort, filter global, paginator
- p-dialog para form (criar/editar)
- Validação: email, CPF/CNPJ (algoritmo, não só máscara)
- Componente AuditTrail reusável que recebe `entidade + id` e mostra timeline
- **Done:** CRUD funcional E2E.

#### F1-010 [FE] Tela /preferencias + 404/403 com mascote Chocobo
- Form: tema (light/dark/auto), densidade (compact/normal/comfortable), idioma
- /403 e /404 com SVG simples do mascote Chocobo amarelo + microcopy amigável
- **Done:** preferências persistidas e aplicadas pós-refresh.

### Fase 2 — Cadastros base

#### F2-001 [BE] Schemas pessoas, catalogo, veiculos
- Migrations `V0010__pessoas.sql`, `V0020__catalogo.sql`, `V0030__veiculos.sql`
- Tabelas conforme docs/spec/Documentacao_Smartbusiness.docx seções 6 e 13.9
- View materializada `cliente_perfil` (RFM)
- **Done:** schema criado; testes inserem registros válidos.

#### F2-002 [BE] CRUD Cliente (8 abas)
- Entidade Cliente + Socio + ContatoHistorico + ClienteNfseLoja
- Endpoints: `GET/POST/PUT/DELETE /api/v1/pessoas/clientes`
- Endpoints específicos por aba (perfil, contatos, sócios)
- Validação CNPJ/CPF algoritmo correto
- Integração ViaCEP (com fallback)
- **Done:** OpenAPI cobre as 8 abas; testes cobrem PJ com sócios + PF sem.

#### F2-003 [BE] CRUD Fornecedor
- Análogo a Cliente, com `representante_id` e `condicao_pagamento`
- **Done:** CRUD + testes.

#### F2-004 [BE] CRUD Produto (6 abas) + multi-fabricante
- Entidades Produto + ProdutoFabricante + ProdutoPrecoHistorico + ProdutoTributacao + ProdutoFoto + ProdutoComposicao
- Endpoint `GET /api/v1/catalogo/produtos` com filtros: codigo, descricao, aplicacao, refFabricante, fabricante, refMontadora, codigoBarras, secaoId, subsecaoId, ncm
- Aceita código com/sem pontuação (normalização no service)
- **Done:** busca por aplicação "BROS150" retorna em <500ms com 10k produtos seed.

#### F2-005 [BE] Pricing composto
- `POST /api/v1/catalogo/produtos/calcular-preco` recebe componentes, retorna {precoVista, precoPrazo, totalComponentes}
- BigDecimal com scale 4 interno, 2 ao apresentar, HALF_UP
- Histórico append-only em `produto_preco_historico`
- **Done:** testes cobrem cenários: arredondamento, lucro 0%, todos os componentes zero, valores extremos.

#### F2-006 [BE] CRUDs auxiliares
- Fabricante, Secao, Subsecao, Unidade, NCM, GrupoMercadoria, Promocao
- Montadora, ModeloVeiculo, CorVeiculo, Veiculo, Oficina
- **Done:** CRUDs simples + testes.

#### F2-007 [BE] Import/Export CSV de produtos
- `POST /api/v1/catalogo/produtos/import` multipart, mapeamento configurável
- Validação em batch, modo "tudo ou nada" (default) ou "parcial"
- Retorna relatório: criados, atualizados, com erro (linha + motivo)
- `GET /api/v1/catalogo/produtos/export` stream CSV
- **Done:** importação de 1000 produtos em <30s.

#### F2-008 [FE] Tela /cadastros/clientes (lista)
- p-table sticky header + filtros laterais slide-out (p-sidebar)
- Busca rápida com debounce 400ms
- Botão Novo + atalho Ctrl+N
- Densidade ajustável
- **Done:** lista paginada de 100k clientes carrega em <2s (com virtual scroll).

#### F2-009 [FE] Tela /cadastros/clientes/:id (8 abas)
- p-tabView desktop / accordion mobile
- Abas: Cadastros, Dados Adicionais, NFSe, Sócios, Contatos, Perfil, Referências Comerciais, Mídias
- Aba Perfil: cards readonly com RFM
- Aba Contatos: timeline com avatares
- Aba Mídias: drag-drop + preview
- Botões sticky no rodapé: Cancelar / Salvar e Novo / Salvar
- Confirm dialog ao cancelar com alterações pendentes
- **Done:** E2E completo em todas as 8 abas.

#### F2-010 [FE] Tela /cadastros/produtos (lista)
- Filtros expostos no topo em colunas (paridade com Smartbusiness)
- Toggle "Exibir fotos" adiciona coluna thumb
- Produtos em promoção em azul
- Atalho Ctrl+N para novo
- **Done:** revisão visual confirma densidade alta + clareza.

#### F2-011 [FE] Tela /cadastros/produtos/:id (6 abas)
- Aba Dados Adicionais: ao alterar componente do markup, recalcula preço em real-time (debounce 400ms) chamando backend
- Aba Tributação: dois cards lado a lado (Saída + ST) + seção IBS/CBS
- Aba Referência: tabela editável de fabricantes
- Aba Fotos: galeria drag-to-reorder
- Aba Composição: condicional (só ativa se kit)
- **Done:** E2E criar produto com 3 fabricantes + foto + composição.

#### F2-012 [FE] ProdutoBuscaDialog (componente crítico reusável)
- Standalone component recebendo configs (`filtrarPorEstoque`, `apenasAtivos`)
- Emite `produto: signal<Produto | null>`
- Diretiva `chocoBuscaProduto` que registra F1 no contexto
- Dialog modal full-screen mobile, 90vh desktop
- Filtros expostos, p-table, seleção por Enter ou duplo clique
- **Done:** reusado em F4 (pré-venda) e F8 (OS) sem alteração.

#### F2-013 [FE] Tela /cadastros/produtos/importar
- Wizard 4 passos: upload → mapeamento → validação → resultado
- Preview das 10 primeiras linhas
- Combo coluna origem → campo destino, salva mapeamento como template
- **Done:** importar CSV exemplo funciona E2E.

#### F2-014 [FE] Telas auxiliares: Fabricante / Seção / Subseção / Unidade / NCM / Montadora / Modelo / Cor / Oficina / Veículo
- Padrão p-table + p-dialog
- **Done:** CRUDs funcionais.

### Fase 3 — Estoque por loja

#### F3-001 [BE] Schema estoque + concorrência
- Tabelas: `produto_estoque (PK composta produto_id+loja_id)`, `movimentacao_estoque` (append-only), `inventario`, `inventario_item`
- Trigger que atualiza `produto_estoque.qtd_atual` a cada INSERT em `movimentacao_estoque`
- Estratégia de concorrência: SELECT FOR UPDATE em produto_estoque + isolamento SERIALIZABLE
- **Done:** teste de 100 threads reservando 1 unid de produto com saldo 50 → exatamente 50 sucessos.

#### F3-002 [BE] EstoqueService
- Métodos: `reservar`, `liberarReserva`, `baixar`, `entrar`, `transferir`, `ajustar`
- Cada operação registra `movimentacao_estoque` com `documento_origem`
- Exception `EstoqueIndisponivelException` com detalhes (qtd disponível vs solicitada)
- **Done:** todos os métodos cobertos por testes.

#### F3-003 [BE] Curva ABC + consumo médio (job batch)
- Job diário 3:30am: recalcula curva ABC (top 80% saídas = A, próximos 15% = B, resto = C)
- Job diário 4:00am: recalcula consumo médio (média móvel 90 dias)
- **Done:** job rodado em ambiente teste atualiza curva corretamente.

#### F3-004 [BE] Endpoints estoque
- `GET /api/v1/estoque/saldos`
- `GET/POST /api/v1/estoque/ajustes`
- `POST /api/v1/estoque/transferencias`
- `GET /api/v1/estoque/movimentacoes`
- `POST/PUT /api/v1/estoque/inventarios`
- `GET /api/v1/estoque/necessidade-compra`
- `GET /api/v1/estoque/necessidade-transferencia`
- **Done:** OpenAPI atualizado; release v0.4.0.

#### F3-005 [FE] Tela /estoque/saldos
- Matriz produto × loja com virtual scroll
- Linhas abaixo do mínimo em vermelho-50
- Filtros + exportar Excel
- **Done:** lista 10k produtos × 5 lojas carrega <2s.

#### F3-006 [FE] Tela /estoque/transferencias (wizard)
- 3 passos: produto+qtd / origem+destino / preview+confirmar
- Mostra saldo das duas lojas em tempo real
- **Done:** E2E completo.

#### F3-007 [FE] Tela /estoque/inventarios (tablet-friendly)
- Lista contagem com inputs numéricos grandes
- Diferença colorida: verde = bate, amarelo = ≤5%, vermelho = >5%
- Aplicar gera ajustes em lote
- **Done:** funciona em iPad em portrait.

#### F3-008 [FE] Tela /estoque/necessidade-compra
- Agrupada por fabricante (collapsible)
- Totaliza valor estimado
- Botão "Gerar Pedido de Compra" (placeholder até F6)
- **Done:** lista correta com filtros.

### Fase 4 — Pré-venda + PDV simples

#### F4-001 [BE] Schemas vendas + caixa + forma_pagamento parametrizada
- Tabelas: `pre_venda`, `pre_venda_item`, `pre_venda_pagamento`, `pre_venda_observacao`, `forma_pagamento` (catálogo com `campos_extras JSONB`), `autorizacao_desconto`, `caixa_sessao`, `caixa_movimento`
- Seed das 8 formas de pagamento conforme Documentacao_Smartbusiness.docx seção 13.5
- **Done:** schemas + seeds.

#### F4-002 [BE] Máquina de estados pre_venda
- Estados: ABERTA → SEPARADA → CONFERIDA → EMITIDA; CANCELADA a qualquer momento
- Transição inválida retorna 422 com ProblemDetail
- **Done:** testes cobrem todas transições e bloqueios.

#### F4-003 [BE] PreVendaService completo
- Métodos: `criar, adicionarItem, removerItem, alterarItem, cancelar, conferir, autorizarDesconto, emitir`
- Integração com EstoqueService: adicionarItem reserva, cancelar libera, emitir baixa
- Validação "Preencha pelo menos 1 item" antes de conferir
- Validação preço_praticado >= preço_mínimo por papel
- **Done:** testes E2E backend.

#### F4-004 [BE] AutorizacaoDescontoService
- Endpoint `POST /api/v1/vendas/pre-vendas/{id}/autorizar-desconto` com credenciais do gerente
- Emite token JWT curto (5min) vinculado a pre_venda_id
- Vendedor envia esse token ao salvar
- Registra em `autorizacao_desconto`
- **Done:** fluxo completo + audit.

#### F4-005 [BE] CaixaService
- `abrirSessao` (constraint: uma sessão aberta por operador/loja)
- `sangria`, `suprimento`
- `encerrarSessao` calcula saldo esperado vs conferido → divergência
- `importarPreVenda` valida estado CONFERIDA + soma de pagamentos = total
- `vendaDireta`, `recebimentoAvulso`, `pagamentoAvulso`
- **Done:** todos testes verdes.

#### F4-006 [BE] Endpoint historico-cliente
- `GET /api/v1/vendas/pre-vendas/{id}/historico-cliente?diasAtras=180`
- Query otimizada com índices em `(cliente_id, data DESC)`
- Paginado
- **Done:** <300ms para cliente com 1000 vendas históricas.

#### F4-007 [FE] Tela /vendas/pre-vendas (lista)
- Filtros + KPIs de topo (quantidade dia, faturamento dia, ticket médio)
- Status pill colorido
- **Done:** lista carrega <1s.

#### F4-008 [FE] Tela /vendas/pre-vendas/:id (formulário otimizado para teclado)
- Cabeçalho compacto: cliente (F4 abre busca), vendedor, número, data, status
- Grid de itens com edição inline: Código (F1 abre busca), Quantidade, Preço Praticado, % Desc, Total
- Enter cria nova linha
- Painel direito: Sub-Total, Desconto, Total, PAGO, TROCO em fontes grandes
- Atalhos visíveis no rodapé
- F8 = conferir, Ctrl+S = salvar, Esc = cancelar
- **Done:** vendedor consegue criar pré-venda completa sem mouse.

#### F4-009 [FE] FormaPagamentoDialog
- Tabs Desconto + Forma de Pagamento
- Campos dinâmicos por forma (configurados a partir de `forma_pagamento.campos_extras`)
- Soma das formas valida em tempo real
- **Done:** paridade com Smartbusiness confirmada visualmente.

#### F4-010 [FE] AutorizarDescontoDialog
- Prompt usuário+senha do gerente
- Badge verde "Desconto autorizado por X" na pré-venda após sucesso
- **Done:** fluxo E2E.

#### F4-011 [FE] HistoricoVendasDialog (botão Histórico)
- Filtros: período, cliente (já preenchido), produto
- Grid: Loja, Data, Tipo (V/D), Documento, Cód Produto, Descrição, Aplicação, Quantidade
- Exportar PDF
- **Done:** botão Histórico no formulário pré-venda funciona.

#### F4-012 [FE] Tela /caixa/pdv (frente de caixa, fullscreen)
- Layout 60/40 (itens esquerda, totais+pagamentos direita)
- Sem TopBar nem Sidebar
- Auto-focus no campo código de barras após qualquer ação
- Atalhos F1 (busca), F2 (cliente), F3 (desconto), F4 (forma pgto), F8 (finalizar), F12 (cancelar)
- Som opcional de bip ao escanear (ligável em preferências)
- **Done:** operador finaliza venda em <30s.

#### F4-013 [FE] Telas auxiliares caixa
- /caixa/abrir-sessao
- /caixa/sangria
- /caixa/suprimento
- /caixa/encerrar-sessao (divergência destacada)
- /caixa/fechamento-diario (admin)
- /caixa/recebimento-avulso
- /caixa/pagamento-avulso
- **Done:** todas as operações de caixa cobertas.

### Fases 5 a 14 — esqueleto do backlog

> Cada fase abaixo expande quando for atingida. **Não execute tarefas dessas fases até as anteriores estarem 100% concluídas.** Detalhes completos em `docs/spec/Plano_Chocobo.docx`.

#### Fase 5 — Recebíveis (semana 8)
- [ ] F5-001 [BE] Schema financeiro: conta_receber, recebimento, recibo
- [ ] F5-002 [BE] Geração automática de conta_receber a partir de pre_venda
- [ ] F5-003 [BE] Cálculo de juros/multa configurável por loja
- [ ] F5-004 [BE] Endpoints contas-receber + baixar + refaturar + extrato cliente
- [ ] F5-005 [FE] Tela /financeiro/contas-receber com filtros + cores por status
- [ ] F5-006 [FE] Dialog Baixar Conta com pré-cálculo de acréscimos
- [ ] F5-007 [FE] Tela /financeiro/inadimplencia com gráficos
- [ ] F5-008 [FE] Tela /clientes/:id/extrato

#### Fase 6 — Compras e a pagar (semanas 9-10)
- [ ] F6-001 [BE] Schemas compras: cotacao, pedido_compra, nota_entrada
- [ ] F6-002 [BE] Import XML NF-e (parse + mapeamento de produtos)
- [ ] F6-003 [BE] Geração de conta_pagar a partir de nota_entrada
- [ ] F6-004 [BE] Endpoints completos
- [ ] F6-005 [FE] Tela /compras/cotacoes
- [ ] F6-006 [FE] Tela /compras/pedidos-compra
- [ ] F6-007 [FE] Tela /compras/notas-entrada/importar (drag-drop XML, resolução manual)
- [ ] F6-008 [FE] Tela /financeiro/contas-pagar

#### Fase 7 — NFC-e Fiscal saída (semanas 11-12)
- [ ] F7-001 [BE] Integração com biblioteca nfe-java + certificado A1 via env
- [ ] F7-002 [BE] Serviço NfceService: emissão, contingência EPEC, cancelamento
- [ ] F7-003 [BE] Idempotência via UUID
- [ ] F7-004 [BE] DANFE em PDF
- [ ] F7-005 [BE] Endpoints fiscal/nfce
- [ ] F7-006 [FE] Tela emissão com progress (Gerando XML / Assinando / Transmitindo / Autorizada)
- [ ] F7-007 [FE] Indicador SEFAZ online/contingência (WebSocket)
- [ ] F7-008 [FE] Impressão térmica via WebUSB ou middleware local
- [ ] F7-009 [FE] Cancelamento com justificativa min 15 chars

#### Fase 8 — Ordem de Serviço (semanas 13-14)
- [ ] F8-001 [BE] Schemas servicos: dav_os, dav_os_produto, dav_os_servico, servico
- [ ] F8-002 [BE] Máquina de estados DAV-OS
- [ ] F8-003 [BE] DavOsService: criar, gerar orçamento, importar orçamento, finalizar, reabilitar
- [ ] F8-004 [BE] Cálculo de garantia (data_garantia_ate = fechamento + dias_garantia)
- [ ] F8-005 [BE] Endpoints completos
- [ ] F8-006 [FE] Tela /servicos/atendimento (lista de OSs)
- [ ] F8-007 [FE] Tela /servicos/atendimento/:id (tablet-friendly)
- [ ] F8-008 [FE] Cabeçalho rico veículo + dois grids (peças + serviços com mecânico)
- [ ] F8-009 [FE] Importar OS no /caixa/pdv (gera NFC-e a partir da OS)
- [ ] F8-010 [FE] Relatório de Garantia

#### Fase 9 — NF-e B2B + MDF-e + CF-e (semana 15)
- [ ] F9-001 [BE] NfeService modelo 55
- [ ] F9-002 [BE] MdfeService
- [ ] F9-003 [BE] CfeService (integração middleware SAT)
- [ ] F9-004 [FE] Telas correspondentes

#### Fase 10 — Cobrança: Boleto e Pix (semanas 16-17)
- [ ] F10-001 [BE] CNAB 240/400 remessa + retorno (jrimum-bopepo)
- [ ] F10-002 [BE] Pix Cobrança via API banco (Inter/BB/Itaú)
- [ ] F10-003 [BE] Pix via Sitef fallback
- [ ] F10-004 [BE] Conciliação automática retorno CNAB
- [ ] F10-005 [FE] Tela /financeiro/contas-receber/:id/cobranca (boleto+Pix)
- [ ] F10-006 [FE] Envio por email/whatsapp

#### Fase 11 — Cartão e TEF (semana 18)
- [ ] F11-001 [BE] Integração TEF via Sitef CliSiTef
- [ ] F11-002 [BE] Import extrato Cielo/Rede CSV
- [ ] F11-003 [BE] Matching automático venda x crédito do extrato
- [ ] F11-004 [FE] Tela /cartoes/conciliacao com matching manual para divergências

#### Fase 12 — Gerencial: DRE + Fluxo + Indicadores (semanas 19-20)
- [ ] F12-001 [BE] Plano de Contas Gerencial + Centros de Resultados
- [ ] F12-002 [BE] DRE service (query agregada por período)
- [ ] F12-003 [BE] Fluxo de Caixa projetado
- [ ] F12-004 [BE] Indicadores (faturamento, ticket médio, margem, rotatividade)
- [ ] F12-005 [FE] Dashboard inicial com KPIs grandes + gráficos ECharts
- [ ] F12-006 [FE] Tela /gerencial/dre interativa
- [ ] F12-007 [FE] Tela /gerencial/fluxo-caixa
- [ ] F12-008 [FE] Exportar PDF "one-pager" mensal

#### Fase 13 — Refinamentos (semanas 21-22)
- [ ] F13-001 [BE] Comissões (job batch noturno)
- [ ] F13-002 [BE] Auto-geração de pedido de compra
- [ ] F13-003 [BE] Romaneio + Separação/Conferência/Expedição
- [ ] F13-004 [BE] NFS-e
- [ ] F13-005 [BE] SPED Fiscal (EFD)
- [ ] F13-006 [BE] Etiquetas Zebra
- [ ] F13-007 [FE] Telas correspondentes

#### Fase 14 — IBS/CBS Reforma Tributária (semanas 23-24)
- [ ] F14-001 [BE] Parametrização IBS_CBS_param por NCM + vigência
- [ ] F14-002 [BE] Cálculo dual durante transição
- [ ] F14-003 [BE] Layouts SEFAZ atualizados
- [ ] F14-004 [FE] Tela /fiscal/ibs-cbs com simulação

---

## 7. Critérios de aceite globais (Definition of Done)

Antes de marcar `[x]` em qualquer tarefa, valide:

- [ ] Funcionalidade implementada conforme descrita
- [ ] Testes automatizados cobrem happy path + erro + borda
- [ ] Cobertura: ≥80% backend, ≥60% frontend
- [ ] Lint verde (Spotless/Checkstyle no backend, ESLint/Prettier no frontend)
- [ ] OpenAPI atualizado (se mudou endpoint)
- [ ] Migrations idempotentes (rodar 2x não cria diff)
- [ ] Conventional Commit feito
- [ ] STATUS.md atualizado
- [ ] CHANGELOG.md atualizado
- [ ] Sem TODO/FIXME deixado sem ticket
- [ ] Sem secrets commitados (verifique com `git secret-scan`)
- [ ] PR descrição completa (se houver revisão humana)

---

## 8. Requisitos não-funcionais (NFRs)

| Categoria | Requisito |
|-----------|-----------|
| **Performance** | P95 < 300ms para GETs simples; P95 < 800ms para listagens paginadas; P95 < 1500ms para relatórios |
| **Disponibilidade** | 99.5% SLA mensal (após GA) |
| **Concorrência** | 50 vendas simultâneas em pico sem deadlock |
| **Segurança** | OWASP Top 10 mitigado; auth obrigatório em todos endpoints exceto `/health` e `/auth/login` |
| **Privacidade** | LGPD: anonimização opcional, direito de exclusão (soft via `inativo=true` e mascaramento) |
| **Auditoria** | Todo INSERT/UPDATE/DELETE em tabela operacional registrado em `audit_log` por trigger |
| **Backup** | pg_dump diário + WAL streaming para réplica; retenção 30 dias |
| **Observabilidade** | Logs JSON estruturados; métricas Prometheus; traces OpenTelemetry; alertas em error rate > 1% |
| **Idiomas** | pt-BR como default; arquitetura preparada para i18n |
| **Acessibilidade** | WCAG 2.1 AA |
| **Browser** | Últimas 2 versões de Chrome, Edge, Firefox, Safari |
| **Mobile** | Responsivo até 360px; PWA instalável para frente de caixa |
| **Fiscal** | Conformidade SEFAZ obrigatória; rejeição de NFC-e por SEFAZ é problema; rejeição por bug do Chocobo é P0 |

---

## 9. Quality gates (CI obrigatório)

Cada PR deve passar:

1. **Lint** verde
2. **Build** verde
3. **Testes unit + integração** verdes
4. **Testes E2E** (smoke pelo menos) verdes
5. **Security scan** (Trivy para imagem, OWASP Dependency Check para deps)
6. **Cobertura** acima do mínimo
7. **OpenAPI diff**: se backend mudou contrato, frontend deve regenerar (CI bloqueia se desatualizado)
8. **Migrations**: Flyway dry-run em DB limpo + repeat

---

## 10. Convenções de trabalho

### 10.1 Branches

- `main` protegida — só merge via PR (em modo Ralph puro, commits diretos OK após CI verde)
- Branches feature: `feat/F2-004-cadastro-produto`
- Branches fix: `fix/F4-008-grid-foco-perdido`

### 10.2 Commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta no imperativo>

[corpo opcional]

[footer opcional, ex.: BREAKING CHANGE:, Refs F4-008]
```

Tipos: `feat | fix | refactor | test | docs | chore | perf | build | ci | revert`
Escopos: nome do bounded context ou módulo (`core, pessoas, catalogo, veiculos, estoque, compras, vendas, servicos, fiscal, financeiro, caixa, cartoes, gerencial`).

Exemplos válidos:
- `feat(catalogo): adicionar import CSV de produtos`
- `fix(pre-venda): bloquear desconto acima do limite sem autorizacao`
- `refactor(estoque): extrair calculo de curva ABC para service`

### 10.3 Versionamento

- Backend: SemVer. Cada release tagueia `v0.X.0` (minor) ou `v0.X.Y` (patch). Major `1.0.0` quando paridade completa atingida.
- Frontend: SemVer alinhado com backend (frontend `v0.X.0` consome backend `v0.X.0`).

### 10.4 ADRs

Toda decisão que afeta arquitetura cria/atualiza um ADR em `docs/adr/`. Formato:

```
# ADR-NNN: Título curto

Status: Proposta | Aceita | Substituída por ADR-XXX | Obsoleta

## Contexto
...

## Decisão
...

## Consequências
Positivas: ...
Negativas: ...
```

---

## 11. Como o agente atualiza status

### 11.1 STATUS.md (no root do repo)

Formato:

```markdown
# STATUS — chocobo-backend

Última atualização: 2026-05-20 14:32 UTC
Última tarefa: F2-004
Próxima tarefa pretendida: F2-005

## Tarefas concluídas

| Tarefa | Concluída em | Commit |
|--------|--------------|--------|
| F0-001 | 2026-05-17   | abc123 |
| F0-003 | 2026-05-17   | def456 |
| F1-001 | 2026-05-18   | ghi789 |
...

## Bloqueios atuais

(nenhum / lista de perguntas pendentes com referência a PERGUNTAS.md)

## Métricas
- Cobertura backend: 84%
- Cobertura frontend: 67%
- Endpoints OpenAPI: 47
```

### 11.2 PERGUNTAS.md

Toda dúvida de negócio vai para cá. Formato:

```markdown
# PERGUNTAS PENDENTES

## P-001 — Tributação para produtos importados (status: aberta, criada 2026-05-19, tarefa F2-005)

**Contexto:** ao recalcular preço de produto com origem importada (origem=1), o cálculo de ICMS deveria...

**Opções identificadas:**
- A) Aplicar alíquota interestadual de 4%
- B) Manter alíquota normal e flag separada
- C) Outro

**Decisão necessária para:** prosseguir com F2-005.

**Resposta humana:** ________
```

Pergunta respondida vai para `PERGUNTAS_RESPONDIDAS.md` (arquivo de histórico) e a decisão vira ADR se afetar arquitetura.

### 11.3 CHANGELOG.md (Keep a Changelog)

```markdown
# CHANGELOG

## [Unreleased]
### Added
- F2-005: cálculo de preço composto com BigDecimal

## [0.3.0] - 2026-05-18
### Added
- F1-001 a F1-005: módulo core completo (auth, tenant, usuario, loja)
### Changed
- ...
### Fixed
- ...
```

---

## 12. Comandos úteis para o agente

### 12.1 Backend (chocobo-backend)

```bash
# Rodar local
docker compose up -d postgres redis rabbitmq
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Testes
mvn verify

# Build imagem
mvn spring-boot:build-image

# Gerar OpenAPI snapshot
mvn springdoc-openapi:generate
cp build/openapi.yaml docs/openapi.yaml

# Criar release tag (publica openapi.yaml como release asset)
git tag v0.X.0 && git push --tags
```

### 12.2 Frontend (chocobo-frontend)

```bash
# Regenerar tipos da API
npm run generate:api

# Dev server
npm start

# Testes unit
npm run test

# Testes e2e
npm run e2e

# Build prod
npm run build

# Build imagem
docker build -t chocobo-frontend .
```

### 12.3 Coordenação

```bash
# Frontend: pegar última release do backend
gh release list --repo seu-usuario/chocobo-backend
gh release download v0.3.0 --pattern openapi.yaml --repo seu-usuario/chocobo-backend
npm run generate:api
```

---

## 13. Glossário rápido

| Termo | Significado |
|-------|-------------|
| **Pré-venda** | Documento criado pelo vendedor, reserva estoque, ainda não é fiscal |
| **DAV-OS** | Documento Auxiliar de Venda - Ordem de Serviço (oficina) |
| **NFC-e** | Nota Fiscal de Consumidor Eletrônica modelo 65 |
| **NF-e** | Nota Fiscal Eletrônica modelo 55 (B2B) |
| **CF-e** | Cupom Fiscal Eletrônico modelo 59 (SAT) |
| **TEF** | Transferência Eletrônica de Fundos (cartões) |
| **CNAB** | Padrão bancário para boletos |
| **CST** | Código de Situação Tributária |
| **NCM** | Nomenclatura Comum do Mercosul |
| **IBS/CBS** | Tributos da reforma tributária (LC 214/2025) |
| **MVA** | Margem de Valor Agregado (ICMS-ST) |
| **Sangria** | Retirada de dinheiro do caixa |
| **Suprimento** | Entrada de troco no caixa |
| **SEFAZ** | Secretaria da Fazenda Estadual |
| **SPED** | Sistema Público de Escrituração Digital |
| **RLS** | Row-Level Security (Postgres) |

---

## 14. Comando Ralph para rodar este PRD

### 14.1 Loop Ralph com Codex (exemplo de invocação)

```bash
# No repositório chocobo-backend ou chocobo-frontend
while true; do
  codex exec --auto "Execute a próxima tarefa do PRD.md seguindo o Run Mode da seção 0. Atualize PRD.md (marque [x]), STATUS.md e CHANGELOG.md. Faça commit Conventional Commits. Se encontrar bloqueio, adicione em PERGUNTAS.md e pare." || break
  sleep 30
done
```

Adapte conforme o CLI do seu agente. O essencial:

1. O comando referencia este `PRD.md` como entrada
2. Permite o agente editar o próprio `PRD.md` (para marcar `[x]`)
3. Permite o agente fazer commit e push
4. Loop infinito até ele falhar ou todas as `[ ]` virarem `[x]`/`[?]`

### 14.2 Modo "supervised" (com revisão humana)

Mesmo comando, mas o agente cria PR em vez de commit direto:

```bash
codex exec --auto "... Crie um PR ao final em vez de commit direto."
```

E você revisa cada PR antes de merge.

---

## 15. Apêndices

- **A.** Esqueleto de pastas dos dois repos → ver `docs/spec/Plano_Chocobo.docx` Apêndice A
- **B.** Padrões de API completos → ver Apêndice B do mesmo documento
- **C.** Checklist de paridade Chocobo vs Smartbusiness → Apêndice D do mesmo documento
- **D.** Modelo de dados detalhado → ver `docs/spec/Documentacao_Smartbusiness.docx` seções 6 e 13.9

---

**Fim do PRD.** Agente: comece pela tarefa F0-001 (se backend) ou F0-002 (se frontend) se este for o primeiro ciclo.
