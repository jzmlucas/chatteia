export type TwitchBadgeRef = {
  setId: string;
  version: string;
};

export type TwitchChatMessage = {
  id: string;
  channel: string;
  channelId: string | null;
  username: string;
  displayName: string;
  color: string;
  message: string;
  badges: TwitchBadgeRef[];
  isAction: boolean;
  timestamp: number;
};

export type TwitchIrcStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "closed";

type Listener = {
  onMessage?: (msg: TwitchChatMessage) => void;
  onStatus?: (status: TwitchIrcStatus, detail?: string) => void;
  onUserCount?: (count: number) => void;
};

const IRC_WS_URL = "wss://irc-ws.chat.twitch.tv:443";
const DEFAULT_COLOR = "#9146FF";

function parseTags(tagString: string): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!tagString) return tags;
  tagString.split(";").forEach((pair) => {
    const [key, ...rest] = pair.split("=");
    tags[key] = rest.join("=");
  });
  return tags;
}

function parseIrcLine(line: string, channelLower: string): TwitchChatMessage | null {
  let raw = line;
  let tags: Record<string, string> = {};

  if (raw.startsWith("@")) {
    const spaceIdx = raw.indexOf(" ");
    tags = parseTags(raw.slice(1, spaceIdx));
    raw = raw.slice(spaceIdx + 1);
  }

  if (!raw.includes("PRIVMSG")) return null;

  const privmsgIdx = raw.indexOf("PRIVMSG");
  const prefix = raw.slice(0, privmsgIdx).trim();
  const rest = raw.slice(privmsgIdx + "PRIVMSG".length).trim();

  const firstColon = rest.indexOf(":");
  if (firstColon === -1) return null;

  const message = rest.slice(firstColon + 1);
  let isAction = false;
  let cleanMessage = message;
  if (message.startsWith("\u0001ACTION") && message.endsWith("\u0001")) {
    isAction = true;
    cleanMessage = message.slice(8, -1);
  }

  const usernameMatch = prefix.match(/:([^!]+)!/);
  const username = usernameMatch ? usernameMatch[1] : "desconhecido";

  const displayName = tags["display-name"] || username;
  const color = tags["color"] && tags["color"].length > 0 ? tags["color"] : DEFAULT_COLOR;
  const badges: TwitchBadgeRef[] = tags["badges"]
    ? tags["badges"]
        .split(",")
        .filter(Boolean)
        .map((b) => {
          const [setId, version] = b.split("/");
          return { setId, version: version || "1" };
        })
    : [];

  return {
    id: tags["id"] || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channel: channelLower,
    channelId: tags["room-id"] || null,
    username,
    displayName,
    color,
    message: cleanMessage,
    badges,
    isAction,
    timestamp: Date.now(),
  };
}

export class TwitchChatClient {
  private ws: WebSocket | null = null;
  private channel: string;
  private listener: Listener;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private nick: string;

  constructor(channel: string, listener: Listener) {
    this.channel = channel.toLowerCase().replace(/^#/, "");
    this.listener = listener;
    this.nick = `justinfan${Math.floor(10000 + Math.random() * 89999)}`;
  }

  connect() {
    this.shouldReconnect = true;
    this.openSocket();
  }

  private openSocket() {
    this.listener.onStatus?.(
      this.reconnectAttempts === 0 ? "connecting" : "reconnecting"
    );

    const ws = new WebSocket(IRC_WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send(`PASS SCHMOOPIIE`);
      ws.send(`NICK ${this.nick}`);
      ws.send(`JOIN #${this.channel}`);
      this.reconnectAttempts = 0;
      this.listener.onStatus?.("connected");
    };

    ws.onmessage = (event) => {
      const lines = String(event.data).split("\r\n").filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("PING")) {
          ws.send("PONG :tmi.twitch.tv");
          continue;
        }
        if (line.includes("PRIVMSG")) {
          const msg = parseIrcLine(line, this.channel);
          if (msg) this.listener.onMessage?.(msg);
        }
        if (line.includes("NOTICE") && line.toLowerCase().includes("login authentication failed")) {
          this.listener.onStatus?.("error", "Falha de autenticação anônima com a Twitch.");
        }
        if (line.includes("Improperly formatted") || line.includes("msg_room_not_found")) {
          this.listener.onStatus?.("error", "Canal não encontrado.");
        }
      }
    };

    ws.onerror = () => {
      this.listener.onStatus?.("error", "Erro na conexão com o chat da Twitch.");
    };

    ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectAttempts += 1;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
        this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
      } else {
        this.listener.onStatus?.("closed");
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
