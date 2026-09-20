# Chatteia

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Agregador multi-plataforma de chat ao vivo (Twitch, Kick, YouTube, TikTok) com autenticação própria (e-mail/senha + login social) rodando 100% em Postgres puro + Node.

## Índice

1. [Visão geral](#visão-geral)
2. [Stack](#stack)
3. [Funcionalidades](#funcionalidades)
4. [Arquitetura](#arquitetura)
5. [Requisitos](#requisitos)
6. [Variáveis de ambiente](#variáveis-de-ambiente)
7. [Banco de dados](#banco-de-dados)
8. [Instalação local](#instalação-local)
9. [Self-hosting em produção](#self-hosting-em-produção)
10. [Docker](#docker)
11. [TikTok worker](#tiktok-worker)
12. [Estrutura do projeto](#estrutura-do-projeto)
13. [Dicas de segurança](#dicas-de-segurança)

---

## Visão geral

O Chatteia foi pensado para funcionar como uma plataforma autônoma, com:

- autenticação própria com e-mail, senha e sessão em cookie
- login OAuth para Google e Twitch
- recuperação de senha e confirmação por e-mail
- visualização de chat de canais individuais
- multi-chat para combinar vários canais em uma tela
- overlay para OBS
- suporte a Twitch, Kick, YouTube e TikTok

O objetivo principal é permitir que alguém hospede o sistema em sua própria infraestrutura e tenha um painel de chat com pouca dependência de serviços externos.

---

## Stack

- [Next.js](https://nextjs.org/) 16
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [pg](https://node-postgres.com/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [nodemailer](https://nodemailer.com/)
- [next-intl](https://next-intl-docs.vercel.app/)

---

## Funcionalidades

### Autenticação

- cadastro com usuário, e-mail e senha
- confirmação de e-mail
- login com sessão em cookie
- reset de senha
- login social com Google e Twitch

### Chat

- Twitch via IRC/WebSocket
- Kick via OAuth + webhooks + subscriptions
- YouTube via API de chat
- TikTok via worker externo e SSE

### Multi-chat e OBS

- tela de multi-chat com vários canais simultâneos
- pages de canal por plataforma
- overlay com layout compatível com OBS
- links de overlay gerados na aplicação

---

## Arquitetura

A aplicação usa uma arquitetura simples e direta:

- Frontend: Next.js App Router
- Backend: rotas de API dentro do próprio app
- Banco: PostgreSQL
- Sessões: armazenadas no banco com token opaco
- Integrações externas: Kick, Twitch, YouTube e TikTok

A autenticação foi implementada internamente, sem depender de Supabase. O banco é a fonte principal de dados do sistema.

---

## Requisitos

Para rodar localmente ou self-hosted, você precisa de:

- Node.js 20+
- npm
- PostgreSQL 14+
- domínio opcional para produção
- SMTP configurado para e-mails em produção
- acesso às chaves OAuth das plataformas desejadas

Se for rodar com Docker, também será útil ter:

- Docker
- Docker Buildx

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as variáveis abaixo.

### Variáveis obrigatórias

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/chatteia
```

### Variáveis opcionais, mas importantes na prática

```env
NODE_ENV=development
DATABASE_SSL=false

TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=

KICK_CLIENT_ID=
KICK_CLIENT_SECRET=
KICK_REDIRECT_URI=http://localhost:3000/api/platforms/kick/auth/callback
KICK_API_URL=https://api.kick.com/public/v1

YOUTUBE_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Chatteia <no-reply@seu-dominio.com>

NEXT_PUBLIC_TIKTOK_WORKER_URL=
TIKTOK_WORKER_URL=
TIKTOK_WORKER_SECRET=
```

### O que cada uma faz

| Variável | Necessária | Descrição |
|---|---:|---|
| `DATABASE_URL` | Sim | String de conexão do PostgreSQL. O app não funciona sem ela. |
| `DATABASE_SSL` | Não | Use `true` quando o banco exigir SSL. |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Não para leitura simples, sim para OAuth e outras APIs | Necessárias para autenticação e algumas APIs da Twitch. |
| `KICK_CLIENT_ID` / `KICK_CLIENT_SECRET` | Não para leitura simples, sim para integrações KICK | Necessárias para OAuth e webhooks da Kick. |
| `KICK_REDIRECT_URI` | Sim para KICK | URL de callback da OAuth da Kick. |
| `YOUTUBE_API_KEY` | Não para funcionamento básico, sim para YouTube | Necessária para buscar chat do YouTube. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Não para leitura, sim para OAuth do Google | Necessárias para login social do Google. |
| `SMTP_*` | Não, mas recomendado em produção | Habilita envio real de e-mails de verificação e reset. |
| `NEXT_PUBLIC_TIKTOK_WORKER_URL` | Recomendado | URL pública do worker do TikTok. |
| `TIKTOK_WORKER_URL` | Recomendado | URL interna/real do worker, usada pelo backend. |
| `TIKTOK_WORKER_SECRET` | Recomendado | Segredo para autenticar chamadas do worker. |

> Importante: se `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASSWORD` não estiverem configurados, o app imprime e-mails no console em vez de enviá-los.

---

## Banco de dados

O schema principal fica em:

```text
postgres/migrations/0001_init.sql
```

Ele cria as tabelas principais:

- `users`
- `sessions`
- `email_verification_tokens`
- `password_reset_tokens`
- `oauth_accounts`
- `platform_connections`
- `kick_tokens`

### Aplicando a migração

```bash
psql "$DATABASE_URL" -f postgres/migrations/0001_init.sql
```

Ou, se você estiver usando um container Postgres local:

```bash
docker exec -i <container_postgres> psql -U <usuario> -d <database> < postgres/migrations/0001_init.sql
```

---

## Instalação local

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o ambiente

Crie o arquivo `.env.local` com as variáveis mencionadas acima.

### 3. Crie o banco e aplique o schema

```bash
createdb chatteia
psql "$DATABASE_URL" -f postgres/migrations/0001_init.sql
```

### 4. Inicie a aplicação

```bash
npm run dev
```

A aplicação fica em:

```text
http://localhost:3000
```

---

## Self-hosting em produção

### Recomendação

Use uma VPS ou um host Linux com:

- Node.js 20+
- PostgreSQL 14+
- processo do app em execução com contêiner, PM2 ou systemd
- proxy reverso e TLS gerenciados pelo seu painel de deploy, como EasyPanel

Se você estiver no EasyPanel, ele normalmente cuida do serviço de rede, proxy e HTTPS por você. Neste caso, o app pode ficar exposto apenas no container interno e o painel resolve a conexão externa.

### Build de produção

```bash
npm run build
npm run start
```

Se você quiser rodar em produção via Node direto, normalmente o processo fica em um serviço do sistema.

### Exemplo de execução em produção

```bash
NODE_ENV=production npm run start
```

---

## Docker

O projeto inclui um `Dockerfile` multi-stage para build da aplicação e também um `docker-compose.yml` para subir a app e o banco juntos.

### docker-compose

```bash
docker compose up -d --build
```

Esse arquivo monta:

- um container PostgreSQL
- um container da aplicação Next.js
- a conexão interna automática entre os serviços via nome do serviço `db`

Exemplo de configuração usada no compose:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: chatteia
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/chatteia?sslmode=disable
      DATABASE_SSL: "false"
      PORT: 3000
      HOSTNAME: 0.0.0.0
```

### Build da imagem manual

```bash
docker build -t chatteia .
```

### Rodar a imagem manualmente

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://usuario:senha@host:5432/chatteia" \
  -e DATABASE_SSL=false \
  -e HOSTNAME=0.0.0.0 \
  -e PORT=3000 \
  --name chatteia \
  chatteia
```

> Se você usa EasyPanel, normalmente não precisa configurar Nginx dentro do app. O painel cuida da exposição externa e do proxy.

> Em produção, prefira passar as variáveis por secrets ou environment do runtime em vez de deixar valores no Dockerfile.

---

## TikTok worker

O TikTok não usa o mesmo fluxo dos outros chats. O projeto espera um worker externo separado que exponha eventos em tempo real por SSE.

Fluxo típico:

1. o worker recebe eventos do TikTok
2. o worker expõe stream via endpoint HTTP
3. o front-end do Chatteia conecta ao worker com `NEXT_PUBLIC_TIKTOK_WORKER_URL`
4. o cliente recebe mensagens em tempo real

### Variáveis relacionadas

```env
NEXT_PUBLIC_TIKTOK_WORKER_URL=https://seu-worker.example.com
TIKTOK_WORKER_URL=https://seu-worker.example.com
TIKTOK_WORKER_SECRET=seu-segredo-forte
```

Se o worker não estiver disponível, o chat do TikTok não funciona corretamente.

---

## Estrutura do projeto

```text
Chatteia/
├── app/
│   ├── [locale]/
│   ├── api/
│   └── ...
├── components/
├── contexts/
├── hooks/
├── i18n/
├── lib/
│   ├── auth/
│   ├── chat/
│   ├── db/
│   ├── email/
│   ├── platforms/
│   └── repositories/
├── messages/
├── postgres/
│   └── migrations/
├── public/
├── types/
├── .env.local
├── .gitignore
├── Dockerfile
├── middleware.ts
├── next.config.js
├── package.json
├── postcss.config.cjs
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Dicas de segurança

Antes de publicar o projeto:

- nunca commite `.env`, `.env.local`, `.env.production` ou segredos
- nunca exponha `DATABASE_URL` em logs ou stack traces
- use HTTPS em produção
- configure SMTP para e-mails reais
- use uma senha forte para o banco e para o worker do TikTok
- mantenha `KICK_REDIRECT_URI` e URLs públicas consistentes com o domínio real

Arquivos que normalmente não devem entrar no GitHub:

```text
.env
.env.local
.env.production
.env.*
node_modules/
.next/
out/
dist/
.vscode/
.idea/
postgres/data/
.kick-tokens.json
```

---

## Observações finais

Este projeto foi desenvolvido para funcionar como uma base de self-hosting real: Next.js + PostgreSQL + autenticação própria + integrações de chat em tempo real. A parte mais crítica é a configuração correta do banco e das chaves de integração, principalmente Twitch, Kick, YouTube e TikTok.

Se você seguir o setup acima, o sistema fica pronto para ser hosteado e operado de forma independente.


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
