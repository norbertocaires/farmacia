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
| Vincular/editar medicamento | Busca por código EAN (com leitura de código de barras via câmera) que preenche os dados do catálogo automaticamente |
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
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_ROLE` | Conta `SuperAdmin` criada automaticamente no primeiro boot, caso ainda não exista |

> Em desenvolvimento, `synchronize: true` (TypeORM) mantém o schema do banco sincronizado com as entidades automaticamente — não há migrations.

> Se `ADMIN_EMAIL`, `ADMIN_USERNAME` ou `ADMIN_PASSWORD` não estiverem definidos, o seed do admin é apenas ignorado (com um log de erro) — não há senha padrão fixa no código.

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

As URLs de API/WebSocket ficam em `src/environments/` (`environment.ts`, `environment.development.ts`, `environment.prod.ts`). O `googleClientId` vem vazio nesses arquivos — preencha localmente com o Client ID do seu OAuth do Google antes de rodar (não commitar o valor real). No build via Docker (`environment.docker.ts`), o valor é injetado automaticamente a partir da variável `GOOGLE_CLIENT_ID` do `.env` da raiz, no build do `front` (ver [Dockerfile](front/Dockerfile)).

Build de produção:

```bash
ng build
```

Os artefatos ficam em `dist/`.

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
