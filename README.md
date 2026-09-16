# Chatteia <img width="48" height="48" src="https://img.icons8.com/color-glass/48/parrot.png" alt="parrot"/>

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deploy Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**Aplicação de monitoramento de chat de lives em tempo real para streamers e espectadores.**

---

## VISÃO GERAL


O **Chatteia** é uma aplicação web que permite acompanhar o chat de qualquer canal da Twitch em tempo real, direto do navegador, sem necessidade de instalar nada ou criar conta.

A aplicação atua como um **cliente leve de IRC-over-WebSocket**, conectando-se diretamente à infraestrutura de chat da Twitch e traduzindo o protocolo IRC em uma interface de chat moderna.

O produto disponibiliza recursos centralizados para:

- **Busca e Acesso Rápido:** Localização de qualquer canal público pelo nome de usuário ou link da Twitch.
- **Leitura em Tempo Real:** Recepção e parsing de mensagens IRC (tags, cores, badges, nomes de exibição) assim que chegam.
- **Resiliência de Conexão:** Reconexão automática com backoff exponencial em caso de queda do WebSocket.
- **Experiência de Chat:** Auto-scroll inteligente, filtro de mensagens por texto e troca de canal sem recarregar a página.

> **Nota de Design:** Na versão atual (MVP), a conexão com a Twitch é feita de forma **anônima e somente leitura** (login `justinfanXXXXX`), sem exigir OAuth, Client ID ou backend. Isso mantém a aplicação inteiramente client-side, permitindo hospedagem estática na Vercel sem custo de infraestrutura.

---

## ARQUITETURA DE SOFTWARE

O projeto segue uma arquitetura simples orientada a **componentes client-side** do App Router do Next.js, isolando a lógica de protocolo (IRC) da camada de apresentação (React).

```
┌──────────────────────────────────────────────────────────────────┐
│                        Navegador do Usuário                      │
└───────────────────────────┬────────────────────────────────────┘
                             │ HTTP (SSR/estático)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Camada de Apresentação                       │
│        (app/page.tsx, app/chat/[channel]/page.tsx, layout)       │
└───────────────────────────┬────────────────────────────────────┘
                             │ instancia / consome
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Camada de Protocolo (Cliente)                 │
│         (lib/irc.ts — parsing IRC, reconexão, eventos)      │
└───────────────────────────┬────────────────────────────────────┘
                             │ wss://
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Twitch IRC (irc-ws.chat.twitch.tv)            │
└──────────────────────────────────────────────────────────────────┘
```

### Isolamento do Protocolo de Chat

A camada de apresentação **nunca lida com o protocolo IRC bruto**. Todo o parsing (tags, PRIVMSG, PING/PONG, badges, cores) é resolvido em `lib/platforms`, que expõe apenas eventos de alto nível para a UI:

$$\text{Frame IRC bruto} \longrightarrow \text{parseIrcLine()} \longrightarrow \text{TwitchChatMessage} \longrightarrow \text{Componente React}$$

Isso permite substituir a fonte de dados (ex: trocar IRC por uma API própria, ou adicionar outras plataformas de chat) sem alterar a camada visual.

---

## TECNOLOGIAS E FERRAMENTAS

### Core & Framework

- **Next.js 14 (App Router):** Roteamento por pastas, componentes client-side e otimização de build.
- **React 18:** Componentização e gerenciamento de estado da UI (hooks).
- **TypeScript 5:** Tipagem estática em toda a camada de protocolo e componentes.
- **TailwindCSS 3:** Estilização utilitária com tema customizado (cores da Twitch).

### Comunicação em Tempo Real

- **WebSocket nativo (browser API):** Conexão direta com `wss://irc-ws.chat.twitch.tv`, sem SDKs externas.
- **Protocolo IRC (Twitch Tags/Commands):** Parsing manual de tags (`display-name`, `color`, `badges`) e comandos (`PRIVMSG`, `PING`, `NOTICE`).

### Infraestrutura

- **Vercel:** Hospedagem e deploy contínuo a partir do GitHub, sem necessidade de servidor dedicado (aplicação 100% client-side na versão atual).

---

## FUNCIONALIDADES E ROTAS

| Rota                 | Descrição                                                                 | Parâmetros                          |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `/`                   | Home com barra de busca de canal (aceita nome ou link `twitch.tv/canal`)   | —                                    |
| `/chat/[channel]`     | Tela de chat em tempo real do canal informado, com filtro e troca rápida  | `channel` (string, Path Variable)   |

### Recursos da tela de chat

- Indicador de status da conexão (conectando / conectado / reconectando / erro).
- Filtro de mensagens por texto ou nome de usuário.
- Auto-scroll com botão de "novas mensagens" quando o usuário rola para cima.
- Troca de canal sem sair da tela.
- Exibição de badges e cor de nome conforme configurado pelo usuário na Twitch.

---

## TRATAMENTO DE ERROS E RECONEXÃO

A camada de protocolo (`lib/platforms`) trata os seguintes cenários de falha, reportando o status para a UI via callback (`onStatus`):

```
{
  "status": "error",
  "detail": "Canal não encontrado."
}
```

```
{
  "status": "reconnecting",
  "detail": undefined
}
```

- **Queda de conexão:** reconexão automática com backoff exponencial (1s → 2s → 4s ... até 15s de teto).
- **Canal inexistente:** identificado via mensagens `NOTICE` do IRC e reportado na interface.
- **Falha de handshake anônimo:** reportado como erro de conexão, sem exposição de detalhes internos do protocolo ao usuário final.

---

## ESTRUTURA DO PROJETO

<details>
<summary>Exibir Estrutura</summary>

```
chatteia/
├── app/
│   ├── chat/
│   │   └── [channel]/
│   │       └── page.tsx        # Tela de chat em tempo real
│   │
│   ├── favicon.ico
│   ├── globals.css             # Estilos globais + Tailwind
│   ├── layout.tsx              # Layout raiz, metadata e favicons
│   └── page.tsx                 # Home com busca de canal
│
├── lib/
│   └── irc.ts             # Cliente WebSocket IRC (parsing, reconexão, eventos)
│
├── public/
│   ├── icons8-twitch-cool-16.png
│   ├── icons8-twitch-cool-32.png
│   └── chatteia.png
│
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

</details>

---

## CONFIGURAÇÃO E EXECUÇÃO LOCAL

### Pré-requisitos

- **Node.js 18+** instalado.
- Nenhuma chave de API é necessária na versão atual (conexão anônima e somente leitura).

### Passos para Execução

1. **Clone o repositório:**

```bash
git clone https://github.com/jzmlucas/chatteia.git
cd chatteia
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

4. **Acesse a aplicação:** Com o servidor em execução, abra no navegador:

  - **Home:** `http://localhost:3000`
  - **Chat de um canal:** `http://localhost:3000/chat/<nome_do_canal>`

### Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel, clique em **New Project** e importe o repositório.
3. Framework preset: **Next.js** (detectado automaticamente).
4. Nenhuma variável de ambiente é necessária na versão atual.
5. Deploy.

---

## ROADMAP DE EVOLUÇÃO

- [x] **MVP:** Busca de canal, leitura de chat da Twitch em tempo real via IRC anônimo, reconexão automática, filtro de mensagens.
- [ ] **Autenticação de usuários:** Login via NextAuth + planos pagos para funcionalidades premium.
- [ ] **OAuth da Twitch:** Envio de mensagens, badges de moderação corretos, dados via API Helix.
- [ ] **Emotes:** Renderização de emotes Twitch, BetterTTV, FrankerFaceZ e 7TV nas mensagens.
- [x] **Multi-chat:** Visualização de múltiplos chats.
- [ ] **Estatísticas em tempo real:** Mensagens por minuto, top chatters, palavras mais usadas, gráficos de atividade.
- [ ] **Persistência:** Histórico de chat salvo em banco (Postgres/Supabase) para replay e busca.
- [ ] **Painel de moderação:** Ações de moderador via token com escopo apropriado.
- [ ] **Alertas por palavra-chave:** Notificação ao usuário quando um termo específico aparecer no chat.
- [ ] **Suporte multiplataforma de chat:**
  - [ ] **TikTok Live** — leitura de chat de lives via integração com a API/WebSocket não-oficial do TikTok Live.
  - [ ] **Kick** — leitura de chat via WebSocket público do Kick.
  - [ ] **YouTube Live** — leitura de chat ao vivo via YouTube Data API (Live Chat Messages).
  - [ ] Interface unificada para acompanhar chats de diferentes plataformas na mesma tela.

---

## Autor

Desenvolvido por **Lucas Joly**.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/jzmlucas)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jzmlucas)