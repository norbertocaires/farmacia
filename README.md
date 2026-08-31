# Farmácia

Sistema para controle de automedicação: acompanhamento dos medicamentos comprados, gasto diário/mensal, comparação com o PMC (Preço Máximo ao Consumidor) e administração de usuários e catálogo para as farmácias parceiras.

Monorepo com front-end (Angular) + back-end (NestJS):

- [front/](front/) — aplicação Angular (antigo repositório `farmacia-front`)
- [back/](back/) — API NestJS (antigo repositório `farmacia-back`)

> O histórico de commits dos repositórios originais não foi trazido para cá (havia variáveis sensíveis expostas em commits antigos).

---

## Stack

**Back-end** (`back/`)
- Node.js + TypeScript, **NestJS 11**
- **PostgreSQL** via TypeORM
- Autenticação **JWT** (`passport-jwt`) + login social via Google (`google-auth-library`)
- Validação global (`class-validator` / `class-transformer`), rate limiting (`@nestjs/throttler`), headers de segurança (`helmet`)
- Upload/planilhas com `multer` + `exceljs` (streaming, para importar o catálogo ANVISA sem estourar memória)
- Realtime com `socket.io` (progresso da importação de catálogo)
- Documentação **Swagger** servida na raiz da aplicação

**Front-end** (`front/`)
- **Angular 21** (standalone components, signals, novo builder `@angular/build`)
- **Angular Material** (diálogos) + **ngx-toastr** (notificações)
- **Socket.IO Client** (progresso de sincronização em tempo real)
- **@abacritt/angularx-social-login** (login com Google)
- **Vitest** (testes unitários, builder `@angular/build:unit-test`)

---

## Módulos / Funcionalidades

| Área | Descrição |
|---|---|
| Autenticação | Login por e-mail/senha ou Google, cadastro, guarda de rotas por sessão e por papel |
| Minha Farmácia | Medicações vinculadas ao usuário, agrupadas por mês/dia, com filtro por período e cálculo de gasto diário/mensal e economia vs. PMC |
| Vincular/editar medicamento | Busca por código EAN (com leitura de código de barras via câmera) que preenche os dados do catálogo automaticamente; farmácia de compra opcional, buscada via Google Places (requer `GOOGLE_MAPS_API_KEY`) |
| Catálogo de Medicamentos | Consulta paginada e filtrada ao catálogo geral (importado da ANVISA) |
| Importar Medicamentos | Upload de planilha `.xlsx`, com barra de progresso em tempo real via WebSocket |
| Administração de Usuários | Busca, ativação/desativação e alteração de papel (role) dos usuários |
| Logs de Atividade | Auditoria paginada das ações dos usuários, com busca por e-mail e detalhes (metadata, IP, localização, user-agent) |
| Perfil | Edição de nome e senha do usuário logado |

### Papéis e permissões

| Papel         | Minha Farmácia | Catálogo | Importar | Administração de Usuários | Logs |
|---------------|:---:|:---:|:---:|:---:|:---:|
| `USUARIO`     | ✅ | | | | |
| `FARMACIA`    | ✅ | ✅ | | | |
| `ADMIN`       | ✅ | ✅ | | ✅ | ✅ |
| `SUPER_ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ |

O controle é feito tanto no front (visibilidade dos links na navbar, guarda de rotas) quanto no back (`@Roles()` + `RolesGuard` em cada endpoint) — a checagem definitiva de permissão é sempre responsabilidade do backend.

---

## Segurança (back-end)

- **Autorização por role:** `SuperAdmin`, `admin`, `farmacia`, `usuario`, aplicada via `@Roles()` + `RolesGuard` em cada rota
- **JWT** revalidado a cada requisição autenticada (usuário inativo perde acesso imediatamente, mesmo com token ainda válido)
- **Rate limiting:** limite global por IP, com limites mais rígidos em login e cadastro
- **Validação global de entrada:** `ValidationPipe` com `whitelist` (campos não declarados no DTO são descartados, não apenas ignorados)
- **Log de auditoria:** login (sucesso/falha), cadastro, edição de perfil, ativação/desativação, mudança de role, vínculo/edição/remoção de remédio e importação de catálogo — cada entrada guarda IP, user-agent e localização aproximada
- **WebSocket autenticado:** a conexão de progresso da importação exige o mesmo JWT usado no resto da API
- **Usuários nunca são excluídos**, apenas desativados (`isActive`)

---

## Rodando com Docker

```bash
cp .env.example .env
# edite o .env com seus segredos/credenciais

docker compose up --build
```

- Front-end: http://localhost:4200
- Back-end / Swagger: http://localhost:3000

## Rodando localmente (sem Docker)

Requisitos: Node.js 20+ e PostgreSQL.

### Back-end

```bash
cd back
npm install

# configure as variáveis de ambiente (ver tabela abaixo) num .env na raiz do back/
npm run start:dev   # desenvolvimento (watch mode)
```

Variáveis de ambiente (`back/.env`):

| Variável | Descrição |
|---|---|
| `PORT` | Porta HTTP do servidor |
| `FRONTEND_URL` | Origem permitida no CORS |
| `DB_TYPE` | `postgres` |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | Conexão com o Postgres |
| `DB_SSL` | Habilita SSL na conexão com o banco |
| `JWT_SECRET` | Segredo de assinatura dos tokens — use um valor forte e aleatório em produção |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `1d`) |
| `GOOGLE_CLIENT_ID` | Client ID do OAuth do Google (login social) |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Conta `SuperAdmin`: criada no primeiro boot caso ainda não exista, e realinhada (role + senha) com essas variáveis a cada novo boot (deploy) |

> Em desenvolvimento, `synchronize: true` (TypeORM) mantém o schema do banco sincronizado com as entidades automaticamente — não há migrations.

> Se `ADMIN_EMAIL`, `ADMIN_USERNAME` ou `ADMIN_PASSWORD` não estiverem definidos, o seed do admin é apenas ignorado (com um log de erro) — não há senha padrão fixa no código.
>
> A cada boot da aplicação: (1) a senha do super admin é sobrescrita para o valor atual de `ADMIN_PASSWORD` — trocas manuais de senha desse usuário (direto no banco, ou por vazamento) não sobrevivem a um novo deploy — e os tokens JWT emitidos antes disso deixam de ser aceitos (vinculados à versão da senha); (2) só existe **um** `SuperAdmin`, sempre o usuário de `ADMIN_EMAIL` — qualquer outro usuário que tenha essa role (ex.: `ADMIN_EMAIL` mudou, ou alguém alterou direto no banco) é rebaixado automaticamente para `admin`. A API de troca de role (`PATCH /users/:email/role`) nunca aceita atribuir `SuperAdmin` manualmente.

Com o servidor rodando, o Swagger fica disponível na raiz: `http://localhost:<PORT>/`.

Testes:

```bash
npm run test       # unitários
npm run test:e2e   # end-to-end
npm run test:cov   # cobertura
```

### Front-end

```bash
cd front
npm install
ng serve
```

Acesse `http://localhost:4200/`. A aplicação recarrega automaticamente ao alterar os arquivos-fonte.

As URLs de API/WebSocket ficam em `src/environments/` (`environment.ts`, `environment.development.ts`, `environment.prod.ts`). O `googleClientId` vem vazio em `environment.ts`/`environment.development.ts` — preencha localmente com o Client ID do seu OAuth do Google antes de rodar (não commitar o valor real). Em `environment.docker.ts` e `environment.prod.ts` o campo é o placeholder `__GOOGLE_CLIENT_ID__`, substituído em build-time a partir da variável de ambiente `GOOGLE_CLIENT_ID` (ver [Dockerfile](front/Dockerfile) e [vercel.json](front/vercel.json)).

O `googleMapsApiKey` segue exatamente o mesmo mecanismo, a partir da variável `GOOGLE_MAPS_API_KEY` — precisa de uma API key do [Google Maps Platform](https://console.cloud.google.com/google/maps-apis) com a **Places API** habilitada e faturamento ativo no projeto (é uma chave separada do `GOOGLE_CLIENT_ID` do login). Habilita o seletor de farmácia (busca + mapa) no modal de vincular medicamento — sem a chave configurada, esse campo simplesmente não aparece no formulário, o resto do app funciona normalmente.

Build de produção:

```bash
ng build
```

Os artefatos ficam em `dist/farmacia-front/browser/` (a aplicação usa o builder novo do Angular — `dist/farmacia-front/` sozinho não é servível).

#### Deploy no Vercel

O [front/vercel.json](front/vercel.json) já configura build, output e o rewrite de SPA (toda rota cai em `index.html`, senão refresh em `/dashboard` etc. dá 404). No painel do Vercel:

1. **Root Directory:** `front` (é um monorepo — sem isso o Vercel tenta buildar a raiz do repo).
2. **Framework Preset:** Angular (o Vercel detecta pelo `angular.json`; se detectar errado, force `Other` — o `vercel.json` já define build/output command).
3. **Environment Variables:** adicione `GOOGLE_CLIENT_ID` com o Client ID do OAuth do Google — é lido pelo `buildCommand` do `vercel.json` em build-time, mesma mecânica do Docker.
4. **Backend:** `apiUrl`/`socketUrl` de `environment.prod.ts` apontam pra URL fixa do backend (hoje no Render) — se essa URL mudar, precisa editar o arquivo e fazer novo deploy.

> Depois do primeiro deploy, atualize `FRONTEND_URL` no backend (Render) para a URL gerada pelo Vercel — o CORS do back ([main.ts](back/src/main.ts)) só libera essa origem exata, então sem isso a API bloqueia todas as requisições do front em produção.

Testes:

```bash
ng test
```

Executa a suíte de testes unitários com [Vitest](https://vitest.dev/).

#### Estrutura de pastas

```
front/src/app/
├── auth-guard/        # authGuard (sessão) e roleGuard (papel)
├── auth-interceptor/  # anexa o Bearer token e trata 401/403 globalmente
├── common/
│   ├── auth-login/     # estado de sessão (signals) e chamadas de auth
│   └── socket-io/      # SyncService (WebSocket) e componentes de progresso
├── components/         # componentes compartilhados (navbar, modais, etc.)
└── pages/               # uma pasta por tela, cada uma com seus dto/ e services/
```

#### Aliases de import

Configurados em `front/tsconfig.json`:

| Alias | Aponta para |
|---|---|
| `@env/*` | `src/environments/*` |
| `@shared/*` | `src/app/common/*` |
| `@core/*` | `src/app/components/*` |
| `@features/*` | `src/app/pages/*` |
| `@shareImports/*` | `src/app/*` |

---

## Recursos adicionais

Para mais informações sobre o Angular CLI, incluindo referência completa de comandos, veja [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
