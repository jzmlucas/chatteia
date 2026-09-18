# Resolvendo "email rate limit exceeded" (Supabase)

O Supabase, no plano Free (e em qualquer projeto sem SMTP próprio
configurado), usa um serviço de e-mail compartilhado só para testes.
Esse serviço tem um limite muito baixo — por padrão **2 a 4 e-mails
por hora**, somando confirmação de cadastro, recuperação de senha,
magic link etc. Ao passar disso, a API do Auth retorna o erro:

```
email rate limit exceeded
```

O código do app já foi ajustado para lidar bem com isso:
- Mensagem amigável em vez do erro cru (`lib/auth/errors.ts`)
- Cooldown de 60s no formulário de cadastro e no botão de reenvio,
  para não ficar batendo no limite sem perceber
  (`hooks/auth/useEmailCooldown.ts`)
- Botão "Reenviar e-mail de confirmação" no cadastro e no login

Só que isso **não aumenta a cota** — só evita desperdiçá-la. Para
resolver de verdade, escolha uma das opções abaixo.

## Opção 1 — Configurar SMTP próprio (recomendado para produção)

1. Crie uma conta em um provedor de e-mail transacional (todos têm
   plano grátis generoso): [Resend](https://resend.com),
   [Brevo](https://www.brevo.com) ou [Postmark](https://postmarkapp.com).
2. Pegue as credenciais SMTP do provedor (host, porta, usuário, senha).
3. No painel do Supabase: **Authentication → Emails → SMTP Settings**
   → ligue "Enable Custom SMTP" e preencha os dados.
4. Salve. A partir daí os e-mails saem pelo seu provedor, com limites
   muito mais altos (geralmente centenas/dia no plano grátis).

## Opção 2 — Desligar a confirmação por e-mail (bom para desenvolvimento)

Se você só quer testar o cadastro/login localmente sem se preocupar
com e-mails agora:

1. No painel do Supabase: **Authentication → Providers → Email**
2. Desligue **"Confirm email"**
3. Agora o `signUp` já retorna sessão ativa na hora — sem precisar
   confirmar nada. Pode ligar de novo quando for para produção (com
   SMTP próprio configurado).

## Opção 3 — Aumentar o rate limit (Pro plan)

No plano pago do Supabase é possível pedir ajuste de rate limits pelo
suporte, mas isso ainda usa o serviço de e-mail deles, que não é
recomendado para produção de qualquer forma. A Opção 1 é o caminho
correto a médio prazo.
