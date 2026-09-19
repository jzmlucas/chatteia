# Migração Supabase → Postgres puro — Chatteia

## 1. Como aplicar

Extraia este .zip **na raiz do seu projeto**, sobrescrevendo os arquivos
existentes com o mesmo caminho (ex: `contexts/AuthContext.tsx`).

## 2. Rode a migration no seu Postgres

```bash
createdb chatteia
psql chatteia -f postgres/migrations/0001_init.sql
```

## 3. Apague estes arquivos (não existem mais / foram substituídos)

```
app/api/session/sync/route.ts   (e a pasta app/api/session/sync/ e app/api/session/ se ficarem vazias)
lib/supabase/client.ts
lib/supabase/server.ts
lib/repositories/platformConnections/supabase.ts
types/supabase.ts
```

## 4. Instale as novas dependências

```bash
npm install pg bcryptjs nodemailer
npm install --save-dev @types/pg @types/nodemailer @types/bcryptjs
npm uninstall @supabase/supabase-js
```

(O `package.json` incluído aqui já reflete essas mudanças — se você
substituí-lo, rode só `npm install` depois.)

## 5. Variáveis de ambiente — adicione no `.env.local`

```bash
# Conexão com o Postgres (local, sem SSL)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/chatteia
DATABASE_SSL=false

# SMTP (opcional pro teste local — sem isso, os e-mails de verificação
# e reset de senha aparecem no console do servidor Next.js, não são
# enviados de verdade)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="Chatteia <no-reply@seudominio.com>"

# Login social (opcional — configure só o(s) que for usar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET já devem existir no seu .env
# atual (usados hoje pra outra coisa) — são reaproveitados aqui também.
```

## 6. Remova as variáveis antigas do Supabase (não são mais usadas)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY (o que você tiver)
```

## 7. Se for usar login social, registre os redirect URIs

No Google Cloud Console e/ou no painel de dev da Twitch, registre:

```
http://localhost:3000/api/auth/oauth/google/callback
http://localhost:3000/api/auth/oauth/twitch/callback
```

## 8. Teste o fluxo completo

1. `npm run dev`
2. Cadastre uma conta em `/register`
3. Copie o link de confirmação que vai aparecer **no console do
   terminal** (já que o SMTP provavelmente não está configurado no seu
   teste local) e abra no navegador
4. Faça login em `/login`
5. Teste "esqueci minha senha" e a edição de perfil

## Pendências recomendadas antes de produção (não incluídas aqui)

- Rate limiting em `/api/auth/login` e `/api/auth/register`
- PKCE no fluxo OAuth (hoje só tem proteção via `state`/CSRF)
- Job periódico para limpar `sessions`, `email_verification_tokens` e
  `password_reset_tokens` expirados
