# Chatteia

Agregador multi-plataforma de chat ao vivo (Twitch, Kick, YouTube, TikTok)
com autenticação própria (e-mail/senha + login social) rodando 100% em
**Postgres puro + Node**, sem depender de Supabase ou de nenhum serviço
gerenciado de terceiros para dados/autenticação.

> Este README documenta o estado atual do projeto **pós-migração do
> Supabase**. Ambiente-alvo: **Postgres e o app Node/Next.js rodando
> juntos na mesma VPS**.

---

## Índice

1. [Stack](#stack)
2. [Estrutura completa do projeto](#estrutura-completa-do-projeto)
3. [Variáveis de ambiente](#variáveis-de-ambiente)
4. [Banco de dados](#banco-de-dados)
5. [Deploy na VPS (Postgres + Node juntos)](#deploy-na-vps-postgres--node-juntos)
6. [Worker do TikTok (processo separado)](#worker-do-tiktok-processo-separado)
7. [Arquivos obsoletos — pode apagar](#arquivos-obsoletos--pode-apagar)
8. [Scripts úteis](#scripts-úteis)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| i18n | next-intl (pt-br, en, es, ru) |
| Banco de dados | **PostgreSQL puro** (via `pg`) |
| Autenticação | Implementação própria — bcrypt + sessão em cookie httpOnly |
| E-mail transacional | `nodemailer` (SMTP configurável) |
| Login social | OAuth 2.0 genérico — Google e Twitch prontos |
| Chat Twitch | IRC anônimo (WebSocket direto do navegador) |
| Chat Kick | Webhooks + assinatura via API oficial |
| Chat YouTube | YouTube Data API (polling) |
| Chat TikTok | Worker Node externo (não-oficial) + SSE |

---

## Estrutura completa do projeto

```
Chatteia/
├── Dockerfile                          # build multi-stage (precisa atualizar ARGs — ver seção Deploy)
├── .dockerignore
├── .env.local                          # nunca commitar — ver seção Variáveis de ambiente
├── middleware.ts                       # só roteamento i18n, sem lógica de auth
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── postgres/
│   └── migrations/
│       └── 0001_init.sql               # schema completo (users, sessions, tokens, oauth, platform_connections, kick_tokens)
│
├── types/
│   ├── user.ts                         # UserRow, Profile — tipos do usuário/autenticação
│   └── chat/
│       └── obs.ts                      # tipos de configuração do overlay OBS
│
├── i18n/
│   ├── config.ts                       # locales suportados
│   ├── navigation.ts                   # Link/useRouter/redirect com prefixo de idioma
│   └── request.ts
│
├── messages/                           # traduções (pt-br, en, es, ru)
│   ├── pt-br.json
│   ├── en.json
│   ├── es.json
│   └── ru.json
│
├── lib/
│   ├── db/
│   │   └── pool.ts                     # pool de conexão `pg` (singleton)
│   │
│   ├── auth/                           # autenticação própria (substitui Supabase Auth)
│   │   ├── password.ts                 # hash/verify (bcryptjs)
│   │   ├── tokens.ts                   # geração/hash de tokens opacos
│   │   ├── session.ts                  # criação/validação/expiração de sessão
│   │   ├── users.ts                    # acesso à tabela `users`
│   │   ├── errors.ts                   # mapeia códigos de erro → traduções
│   │   ├── getSessionUser.ts           # helper usado pelas rotas de API (Kick, connections)
│   │   └── oauth/
│   │       ├── types.ts                # interface genérica de provedor OAuth
│   │       ├── google.ts               # provedor Google
│   │       ├── twitch.ts               # provedor Twitch (login social — reaproveita TWITCH_CLIENT_ID)
│   │       └── index.ts                # registro de provedores ativos
│   │
│   ├── email/
│   │   ├── sendEmail.ts                # SMTP com fallback pro console (sem SMTP configurado)
│   │   └── templates.ts                # e-mails de verificação e reset de senha
│   │
│   ├── chat/
│   │   ├── types.ts                    # ChatPlatform, UnifiedChatMessage
│   │   ├── targets.ts                  # parsing/normalização de "twitch:canal" etc.
│   │   ├── normalizeChannel.ts         # normalização de input da home (por plataforma)
│   │   ├── multiChat.ts                # tipos e helpers do multi-chat
│   │   └── chatteiaRoom.ts             # helpers de sala/apelido (chat nativo — não usado hoje)
│   │
│   ├── repositories/
│   │   └── platformConnections/
│   │       ├── types.ts                # interface do repositório (independente de banco)
│   │       ├── postgres.ts             # implementação ativa (Postgres via `pg`)
│   │       └── index.ts                # exporta a instância ativa
│   │
│   └── platforms/
│       ├── twitch/
│       │   ├── irc.ts                  # barrel de compatibilidade
│       │   ├── ircParsers.ts           # parsers puros do protocolo IRC
│       │   ├── ircClient.ts            # classe TwitchChatClient (WebSocket + reconexão)
│       │   └── adapter.ts, badges.ts, emotes.ts, types.ts
│       │
│       ├── kick/
│       │   ├── oauth.ts                # OAuth da Kick (autorizar canal p/ webhooks)
│       │   ├── webhook.ts              # verificação de assinatura (chave pública fixa da Kick)
│       │   ├── subscriptions.ts        # assinatura de eventos via API da Kick
│       │   ├── token-store.ts          # tokens por broadcaster (Postgres via `pg`)
│       │   ├── bus.ts                  # fan-out em memória (webhook → SSE)
│       │   └── authorized-channels.ts, adapter.ts, types.ts, user.ts
│       │
│       ├── youtube/
│       │   └── api.ts, adapter.ts, types.ts
│       │
│       └── tiktok/
│           ├── types.ts, adapter.ts
│           └── bus.ts                  # fan-out em memória (webhook → SSE) — ver nota na seção do worker
│
├── contexts/
│   └── AuthContext.tsx                 # estado de auth no client (fetch /api/auth/session)
│
├── hooks/
│   ├── auth/
│   │   ├── useLoginForm.ts             # POST /api/auth/login
│   │   ├── useRegisterForm.ts          # POST /api/auth/register
│   │   ├── useResendConfirmation.ts    # POST /api/auth/resend-verification
│   │   ├── useAccountForm.ts           # PATCH /api/auth/profile
│   │   └── useEmailCooldown.ts         # rate-limit client-side (sem dependência externa)
│   │
│   ├── chat/
│   │   ├── useMultiChatState.ts        # orquestra Twitch+Kick+YouTube+TikTok no multi-chat
│   │   ├── useChatActivity.ts, useChatAutoScroll.ts, useMultiChatLayout.ts
│   │   ├── useObsChatSettings.ts       # configurações do overlay via querystring
│   │   └── useObsTransparentBackground.ts
│   │
│   ├── home/
│   │   └── useHomeForm.ts              # formulário da home (single/multi-chat)
│   │
│   └── platforms/
│       ├── twitch/  (useTwitchChannel, useTwitchMultiChat, useTwitchConnectionManager, useTwitchChannelInfo)
│       ├── kick/    (useKickChannel, useKickMultiChat)
│       ├── youtube/ (useYouTubeChannel, useYouTubeMultiChat)
│       └── tiktok/  (useTiktokChannel, useTikTokMultiChat) — conectam DIRETO no worker externo (ver seção do worker)
│
├── components/
│   ├── auth/       (LoginForm, RegisterForm, AccountPanel, AuthGuard, UserMenu, ResendConfirmationEmail)
│   ├── account/    (PlatformConnections, PlatformCard, platformMeta)
│   ├── home/       (HomeChatForm, SettingsMenu)
│   ├── chat/       (ChatFeed, ChatMessage, ChatMessageContent, MultiChatHeader, ChatNewMessagesButton, CopyObsLinkButton, layout/MultiChatBoard)
│   ├── obs/        (ObsChatPreview, ObsChatSettings)
│   ├── layout/     (GlobalHeader, ProfileMenu, AvatarIcon, HomeLogoLink, MaskedEmail)
│   └── i18n/       (LanguageSwitcher)
│
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                    # home
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── account/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── kick/connect/page.tsx       # fluxo de autorização de streamer da Kick
│   │   ├── chat/
│   │   │   ├── twitch/[channel]/page.tsx  (+ /settings)
│   │   │   ├── kick/[channel]/page.tsx
│   │   │   ├── youtube/[channel]/page.tsx
│   │   │   ├── tiktok/[channel]/page.tsx
│   │   │   ├── multi-chat/page.tsx
│   │   │   └── [channel]/page.tsx      # redirect de compatibilidade (Twitch sem prefixo → /chat/twitch/…)
│   │   └── obs/
│   │       ├── [channel]/page.tsx      # overlay OBS single-canal (Twitch)
│   │       └── multi-chat/page.tsx     # overlay OBS multi-chat
│   │
│   └── api/
│       ├── auth/                       # toda a autenticação própria
│       │   ├── register, login, logout, session, profile
│       │   ├── verify-email, resend-verification
│       │   ├── forgot-password, reset-password
│       │   └── oauth/[provider]/{authorize,callback}
│       │
│       └── platforms/
│           ├── connections/            # conexões de plataforma do usuário logado
│           ├── kick/                   # oauth, webhook, subscriptions, channels, me, stream (SSE)
│           ├── twitch/                 # badges, emotes, streams (dados auxiliares — chat em si é direto por WebSocket)
│           ├── youtube/chat/           # polling da API do YouTube
│           └── tiktok/                 # webhook, watch, stream — ver nota abaixo
│
└── public/
    └── chatteia*.png                   # ícones/favicon
```

> **Nota sobre `lib/platforms/tiktok/bus.ts` e `app/api/platforms/tiktok/{webhook,watch,stream}`:**
> esses arquivos implementam um proxy (worker → webhook → SSE via Next.js).
> Os hooks atuais (`useTiktokChannel.ts`, `useTikTokMultiChat.ts`) **não
> usam mais esse caminho** — eles conectam **direto** no worker via
> `NEXT_PUBLIC_TIKTOK_WORKER_URL` (`GET {worker}/stream?channel=...`).
> As rotas antigas ficaram como código morto; podem ser removidas com
> segurança, ou reaproveitadas se você preferir voltar a proxiar pelo
> Next.js no futuro (ver seção do worker).

---

## Variáveis de ambiente

Arquivo `.env.local` (nunca commitar). Tabela completa — **todas** as
variáveis usadas em algum ponto do código:

### Core / aplicação

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NODE_ENV` | Automática | `production` em build/deploy, `development` local |

### Banco de dados (Postgres puro)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | String de conexão, ex: `postgresql://usuario:senha@localhost:5432/chatteia` |
| `DATABASE_SSL` | Não | `"true"` se seu Postgres exigir SSL. Deixe vazio/`false` para Postgres local na própria VPS. |

### Autenticação e sessão

Não precisa de nenhuma variável de "segredo de JWT" — a sessão é um
token aleatório opaco guardado (com hash) na tabela `sessions`, não um
JWT assinado. Nada a configurar aqui além do `DATABASE_URL` acima.

### E-mail (verificação de cadastro e reset de senha)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SMTP_HOST` | Não* | Host do seu servidor SMTP |
| `SMTP_PORT` | Não* | Porta (587 STARTTLS, 465 SSL) |
| `SMTP_USER` | Não* | Usuário SMTP |
| `SMTP_PASSWORD` | Não* | Senha/API key SMTP |
| `SMTP_FROM` | Não | Remetente exibido, ex: "Chatteia <no-reply@seudominio.com>" |

\* Sem essas 4 configuradas, os e-mails são impressos no console do
processo Node (`lib/email/sendEmail.ts`) — útil para testes locais, mas
configure antes de ir pra produção de verdade, senão ninguém recebe o
e-mail de confirmação de cadastro.

### Login social (OAuth) — opcional, ative só o que for usar

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Não | Client ID do Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Não | Client Secret do Google |
| `TWITCH_CLIENT_ID` | Já existe* | Reaproveitado do app da Twitch abaixo |
| `TWITCH_CLIENT_SECRET` | Já existe* | Reaproveitado do app da Twitch abaixo |

\* O mesmo app da Twitch já usado para outras integrações serve para
login social — só é preciso registrar mais um redirect URI nele (ver
seção de Deploy).

Redirect URIs a registrar nos consoles de cada provedor:
```
{SEU_DOMINIO}/api/auth/oauth/google/callback
{SEU_DOMINIO}/api/auth/oauth/twitch/callback
```

### Twitch (dados auxiliares — o chat em si é IRC anônimo, sem OAuth)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `TWITCH_CLIENT_ID` | Sim | Usado por `lib/platforms/twitch` (badges/emotes/streams) e login social |
| `TWITCH_CLIENT_SECRET` | Sim | Idem |

### Kick

| Variável | Obrigatória | Descrição |
|---|---|---|
| `KICK_CLIENT_ID` | Sim | App OAuth da Kick |
| `KICK_CLIENT_SECRET` | Sim | Idem |
| `KICK_REDIRECT_URI` | Sim | Ex: `{SEU_DOMINIO}/api/platforms/kick/auth/callback` |
| `KICK_API_URL` | Não | Default: `https://api.kick.com/public/v1` |

### YouTube

| Variável | Obrigatória | Descrição |
|---|---|---|
| `YOUTUBE_API_KEY` | Sim | Chave da YouTube Data API v3 |

### TikTok (worker externo)

| Variável | Obrigatória | Onde é usada |
|---|---|---|
| `NEXT_PUBLIC_TIKTOK_WORKER_URL` | Sim | Client-side — o navegador conecta direto nela (`hooks/platforms/tiktok/*`). Precisa ser a URL pública do worker (ex: `https://tiktok-worker.seudominio.com`), com HTTPS se o site também for HTTPS (mixed content é bloqueado pelo navegador). |
| `TIKTOK_WORKER_URL` | Só se usar as rotas antigas | Server-side, usado por `app/api/platforms/tiktok/{watch,stream}/route.ts` (código morto — ver nota da seção anterior) |
| `TIKTOK_WORKER_SECRET` | Só se usar as rotas antigas | Idem |

### Removidas — não usar mais (resquícios do Supabase)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SUPABASE_JWKS_URL
```

### `.env.local` completo de referência

```bash
# --- Banco de dados ---
DATABASE_URL=postgresql://chatteia:senha@localhost:5432/chatteia
DATABASE_SSL=false

# --- E-mail (SMTP) ---
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="Chatteia <no-reply@seudominio.com>"

# --- Login social ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- Twitch (auxiliar + login social) ---
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

# --- Kick ---
KICK_CLIENT_ID=
KICK_CLIENT_SECRET=
KICK_REDIRECT_URI=https://seudominio.com/api/platforms/kick/auth/callback
KICK_API_URL=https://api.kick.com/public/v1

# --- YouTube ---
YOUTUBE_API_KEY=

# --- TikTok worker ---
NEXT_PUBLIC_TIKTOK_WORKER_URL=https://tiktok-worker.seudominio.com
```

---

## Banco de dados

Schema completo em `postgres/migrations/0001_init.sql`. Tabelas:

| Tabela | Papel |
|---|---|
| `users` | Usuários + perfil (substitui `auth.users` + `profiles` do Supabase) |
| `sessions` | Sessões de login (token com hash, expiração deslizante) |
| `email_verification_tokens` | Tokens de confirmação de cadastro |
| `password_reset_tokens` | Tokens de "esqueci minha senha" |
| `oauth_accounts` | Vínculo de contas logadas via Google/Twitch |
| `platform_connections` | Conexões do usuário com Twitch/Kick/YouTube/TikTok (feature de conta) |
| `kick_tokens` | Tokens OAuth por broadcaster da Kick (para webhooks — independente do login do Chatteia) |

Rodar a migration:

```bash
createdb chatteia
psql "$DATABASE_URL" -f postgres/migrations/0001_init.sql
```

A pasta `supabase/migrations/` ainda existe no repo mas está obsoleta —
pode ser removida (ver seção de arquivos obsoletos).

---

## Deploy na VPS (Postgres + Node juntos)

Como o Postgres e o Node.js do Chatteia vão rodar na mesma máquina:

1. `DATABASE_URL` aponta para `localhost` (ou o socket Unix do
   Postgres) — não precisa expor a porta 5432 publicamente.
2. `DATABASE_SSL=false` — SSL entre processos na mesma VPS é
   desnecessário (diferente de um Postgres gerenciado remoto).
3. Rode o Postgres como serviço do sistema (`systemctl enable postgresql`)
   ou em um container Docker próprio — o app só precisa alcançar a porta.

### Atualize o Dockerfile

Ele ainda tem ARG/ENV do Supabase. Se você builda via Docker, troque o
bloco de variáveis por:

```dockerfile
ARG DATABASE_URL
ARG DATABASE_SSL
ARG SMTP_HOST
ARG SMTP_PORT
ARG SMTP_USER
ARG SMTP_PASSWORD
ARG SMTP_FROM
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG TWITCH_CLIENT_ID
ARG TWITCH_CLIENT_SECRET
ARG KICK_CLIENT_ID
ARG KICK_CLIENT_SECRET
ARG KICK_REDIRECT_URI
ARG KICK_API_URL
ARG YOUTUBE_API_KEY
ARG NEXT_PUBLIC_TIKTOK_WORKER_URL
ARG GIT_SHA

ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_SSL=$DATABASE_SSL
ENV SMTP_HOST=$SMTP_HOST
ENV SMTP_PORT=$SMTP_PORT
ENV SMTP_USER=$SMTP_USER
ENV SMTP_PASSWORD=$SMTP_PASSWORD
ENV SMTP_FROM=$SMTP_FROM
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV TWITCH_CLIENT_ID=$TWITCH_CLIENT_ID
ENV TWITCH_CLIENT_SECRET=$TWITCH_CLIENT_SECRET
ENV KICK_CLIENT_ID=$KICK_CLIENT_ID
ENV KICK_CLIENT_SECRET=$KICK_CLIENT_SECRET
ENV KICK_REDIRECT_URI=$KICK_REDIRECT_URI
ENV KICK_API_URL=$KICK_API_URL
ENV YOUTUBE_API_KEY=$YOUTUBE_API_KEY
ENV NEXT_PUBLIC_TIKTOK_WORKER_URL=$NEXT_PUBLIC_TIKTOK_WORKER_URL
ENV GIT_SHA=$GIT_SHA
```

(mantendo o resto do arquivo igual — `NEXT_TELEMETRY_DISABLED`, estágio
`runner`, etc.)

### Sem Docker (alternativa mais simples numa VPS só sua)

```bash
npm ci
npm run build
pm2 start npm --name chatteia -- start
pm2 save
```

Coloque um Nginx na frente com HTTPS (Let's Encrypt/certbot) apontando
pra porta que o Next.js expõe.

---

## Worker do TikTok (processo separado)

O chat da TikTok não tem API oficial pra terceiros — o worker usa uma
lib não-oficial que precisa de um processo Node de vida longa (não
roda dentro do Next.js/serverless). Como agora tudo está na sua VPS,
ele pode rodar como um segundo processo na mesma máquina:

```bash
pm2 start index.js --name tiktok-worker --cwd ./tiktok-worker
```

O navegador do usuário conecta direto nesse worker via
`NEXT_PUBLIC_TIKTOK_WORKER_URL` (SSE), então:

- Exponha o worker num subdomínio com HTTPS (ex:
  `tiktok-worker.seudominio.com`) via Nginx/reverse proxy — se o site
  principal é HTTPS, o navegador bloqueia uma conexão SSE para um
  endpoint HTTP puro (mixed content).
- Configure CORS no worker liberando a origem do seu domínio principal.

---

## Arquivos obsoletos — pode apagar

```
supabase/migrations/                    # substituído por postgres/migrations/
.kick-tokens.json                       # tokens da Kick agora vivem no Postgres
app/[locale]/page.tsx.save
app/[locale]/layout.tsx.save
app/layout.tsx.save
app/api/platforms/tiktok/webhook/route.ts   # não usado pelos hooks atuais (ver nota da estrutura)
app/api/platforms/tiktok/watch/route.ts     # idem
app/api/platforms/tiktok/stream/route.ts    # idem
lib/platforms/tiktok/bus.ts                 # idem
```

Confirme antes de apagar os 4 últimos (rotas do TikTok) que nenhum
outro lugar do código ainda os referencia — se você pretende voltar a
proxiar o TikTok pelo Next.js no futuro (em vez de conexão direta do
navegador com o worker), mantenha-os.

---

## Scripts úteis

```bash
npm run dev              # desenvolvimento local
npm run build            # build de produção
npm run start             # roda o build
psql "$DATABASE_URL" -f postgres/migrations/0001_init.sql   # aplica o schema
```
