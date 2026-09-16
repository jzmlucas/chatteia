export type TwitchBadgeRef = {
  setId: string;
  version: string;
};

export type TwitchEmoteRef = {
  id: string;
  start: number;
  end: number;
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
  emotes: TwitchEmoteRef[];
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

  onStatus?: (
      status: TwitchIrcStatus,
      detail?: string
  ) => void;

  onUserCount?: (count: number) => void;
};

const IRC_WS_URL =
    "wss://irc-ws.chat.twitch.tv:443";

const DEFAULT_COLOR = "#9146FF";

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 15000;

const CONNECTION_TIMEOUT = 10000;
const HEARTBEAT_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 45000;

function parseTags(
    tagString: string
): Record<string, string> {
  const tags: Record<string, string> = {};

  if (!tagString) {
    return tags;
  }

  for (const pair of tagString.split(";")) {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) {
      tags[pair] = "";
      continue;
    }

    const key = pair.slice(
        0,
        separatorIndex
    );

    const value = pair.slice(
        separatorIndex + 1
    );

    tags[key] = value;
  }

  return tags;
}

function parseBadges(
    badgeString: string
): TwitchBadgeRef[] {
  if (!badgeString) {
    return [];
  }

  const badges: TwitchBadgeRef[] = [];

  for (const badge of badgeString.split(",")) {
    if (!badge) {
      continue;
    }

    const separatorIndex =
        badge.indexOf("/");

    if (separatorIndex === -1) {
      continue;
    }

    const setId = badge.slice(
        0,
        separatorIndex
    );

    const version = badge.slice(
        separatorIndex + 1
    );

    if (!setId || !version) {
      continue;
    }

    badges.push({
      setId,
      version,
    });
  }

  return badges;
}

function parseEmotes(
    emoteString: string
): TwitchEmoteRef[] {
  if (!emoteString) {
    return [];
  }

  const emotes: TwitchEmoteRef[] = [];

  for (const group of emoteString.split("/")) {
    if (!group) {
      continue;
    }

    const separatorIndex =
        group.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const id = group.slice(
        0,
        separatorIndex
    );

    const positions = group.slice(
        separatorIndex + 1
    );

    if (!id || !positions) {
      continue;
    }

    for (const position of positions.split(",")) {
      const [
        startString,
        endString,
      ] = position.split("-");

      const start = Number(startString);
      const end = Number(endString);

      if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 0 ||
          end < start
      ) {
        continue;
      }

      emotes.push({
        id,
        start,
        end,
      });
    }
  }

  return emotes.sort(
      (a, b) => a.start - b.start
  );
}

function parseIrcLine(
    line: string,
    channelLower: string
): TwitchChatMessage | null {
  let raw = line;

  let tags: Record<string, string> = {};

  if (raw.startsWith("@")) {
    const spaceIdx =
        raw.indexOf(" ");

    if (spaceIdx === -1) {
      return null;
    }

    tags = parseTags(
        raw.slice(
            1,
            spaceIdx
        )
    );

    raw = raw.slice(
        spaceIdx + 1
    );
  }

  if (!raw.includes("PRIVMSG")) {
    return null;
  }

  const privmsgIdx =
      raw.indexOf("PRIVMSG");

  const prefix = raw
      .slice(
          0,
          privmsgIdx
      )
      .trim();

  const rest = raw
      .slice(
          privmsgIdx +
          "PRIVMSG".length
      )
      .trim();

  const firstColon =
      rest.indexOf(":");

  if (firstColon === -1) {
    return null;
  }

  const message = rest.slice(
      firstColon + 1
  );

  let isAction = false;
  let cleanMessage = message;

  if (
      message.startsWith("\u0001ACTION") &&
      message.endsWith("\u0001")
  ) {
    isAction = true;

    cleanMessage = message.slice(
        8,
        -1
    );
  }

  const usernameMatch =
      prefix.match(/:([^!]+)!/);

  const username =
      usernameMatch?.[1] ||
      "desconhecido";

  const displayName =
      tags["display-name"] ||
      username;

  const color =
      tags["color"]?.length
          ? tags["color"]
          : DEFAULT_COLOR;

  const badges = parseBadges(
      tags["badges"] || ""
  );

  const emotes = parseEmotes(
      tags["emotes"] || ""
  );

  return {
    id:
        tags["id"] ||
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

    channel: channelLower,

    channelId:
        tags["room-id"] || null,

    username,

    displayName,

    color,

    message: cleanMessage,

    badges,

    emotes,

    isAction,

    timestamp: Date.now(),
  };
}

export class TwitchChatClient {
  private ws: WebSocket | null = null;

  private channel: string;

  private listener: Listener;

  private shouldReconnect = false;

  private reconnectAttempts = 0;

  private reconnectTimer:
      | ReturnType<typeof setTimeout>
      | null = null;

  private connectionTimeoutTimer:
      | ReturnType<typeof setTimeout>
      | null = null;

  private heartbeatTimer:
      | ReturnType<typeof setInterval>
      | null = null;

  private nick: string;

  private connectionGeneration = 0;

  private hasConnected = false;

  private lastPongAt = 0;

  constructor(
      channel: string,
      listener: Listener
  ) {
    this.channel = channel
        .toLowerCase()
        .replace(/^#/, "")
        .trim();

    this.listener = listener;

    this.nick =
        `justinfan${Math.floor(
            10000 +
            Math.random() * 89999
        )}`;
  }

  connect() {
    if (!this.channel) {
      this.listener.onStatus?.(
          "error",
          "Canal inválido."
      );

      return;
    }

    this.shouldReconnect = true;

    this.clearReconnectTimer();

    if (
        this.ws &&
        (
            this.ws.readyState ===
            WebSocket.OPEN ||
            this.ws.readyState ===
            WebSocket.CONNECTING
        )
    ) {
      return;
    }

    this.reconnectAttempts = 0;
    this.hasConnected = false;

    this.openSocket();
  }

  private openSocket() {
    if (!this.shouldReconnect) {
      return;
    }

    this.clearReconnectTimer();
    this.clearConnectionTimeout();
    this.clearHeartbeat();

    const generation =
        ++this.connectionGeneration;

    const isReconnect =
        this.reconnectAttempts > 0 ||
        this.hasConnected;

    this.listener.onStatus?.(
        isReconnect
            ? "reconnecting"
            : "connecting"
    );

    const ws =
        new WebSocket(IRC_WS_URL);

    this.ws = ws;

    this.connectionTimeoutTimer =
        setTimeout(() => {
          if (
              generation !==
              this.connectionGeneration
          ) {
            return;
          }

          if (
              ws.readyState ===
              WebSocket.CONNECTING
          ) {
            this.listener.onStatus?.(
                "error",
                "Tempo limite da conexão com a Twitch excedido."
            );

            ws.close();
          }
        }, CONNECTION_TIMEOUT);

    ws.onopen = () => {
      if (
          generation !==
          this.connectionGeneration
      ) {
        ws.close();
        return;
      }

      this.clearConnectionTimeout();

      this.lastPongAt =
          Date.now();

      ws.send(
          "CAP REQ :twitch.tv/tags twitch.tv/commands"
      );

      ws.send(
          "PASS SCHMOOPIIE"
      );

      ws.send(
          `NICK ${this.nick}`
      );

      ws.send(
          `JOIN #${this.channel}`
      );

      this.hasConnected = true;

      this.listener.onStatus?.(
          "connected"
      );

      this.startHeartbeat(
          ws,
          generation
      );
    };

    ws.onmessage = (event) => {
      if (
          generation !==
          this.connectionGeneration
      ) {
        return;
      }

      const lines = String(
          event.data
      )
          .split("\r\n")
          .filter(Boolean);

      for (const line of lines) {
        if (line.startsWith("PING")) {
          if (
              ws.readyState ===
              WebSocket.OPEN
          ) {
            ws.send(
                "PONG :tmi.twitch.tv"
            );

            this.lastPongAt =
                Date.now();
          }

          continue;
        }

        if (
            line.startsWith(":tmi.twitch.tv PONG") ||
            line.includes(" PONG ")
        ) {
          this.lastPongAt =
              Date.now();

          continue;
        }

        if (line.includes("PRIVMSG")) {
          const msg =
              parseIrcLine(
                  line,
                  this.channel
              );

          if (msg) {
            this.listener.onMessage?.(
                msg
            );
          }
        }

        if (
            line.includes("NOTICE") &&
            line
                .toLowerCase()
                .includes(
                    "login authentication failed"
                )
        ) {
          this.shouldReconnect = false;

          this.listener.onStatus?.(
              "error",
              "Falha de autenticação anônima com a Twitch."
          );

          ws.close();

          continue;
        }

        if (
            line.includes(
                "Improperly formatted"
            ) ||
            line.includes(
                "msg_room_not_found"
            )
        ) {
          this.shouldReconnect = false;

          this.listener.onStatus?.(
              "error",
              "Canal não encontrado."
          );

          ws.close();
        }
      }
    };

    ws.onerror = () => {
      if (
          generation !==
          this.connectionGeneration
      ) {
        return;
      }

      this.listener.onStatus?.(
          "error",
          "Erro na conexão com o chat da Twitch."
      );
    };

    ws.onclose = () => {
      if (
          generation !==
          this.connectionGeneration
      ) {
        return;
      }

      this.clearConnectionTimeout();
      this.clearHeartbeat();

      if (!this.shouldReconnect) {
        this.ws = null;

        this.listener.onStatus?.(
            "closed"
        );

        return;
      }

      this.ws = null;

      this.scheduleReconnect();
    };
  }

  private startHeartbeat(
      ws: WebSocket,
      generation: number
  ) {
    this.clearHeartbeat();

    this.heartbeatTimer =
        setInterval(() => {
          if (
              generation !==
              this.connectionGeneration
          ) {
            this.clearHeartbeat();
            return;
          }

          if (
              !this.shouldReconnect
          ) {
            this.clearHeartbeat();
            return;
          }

          if (
              ws.readyState !==
              WebSocket.OPEN
          ) {
            this.clearHeartbeat();
            return;
          }

          const now =
              Date.now();

          if (
              now -
              this.lastPongAt >
              HEARTBEAT_TIMEOUT
          ) {
            this.listener.onStatus?.(
                "error",
                "A conexão com a Twitch não está respondendo."
            );

            ws.close();

            return;
          }

          try {
            ws.send(
                `PING :chatteia-${now}`
            );
          } catch {
            ws.close();
          }
        }, HEARTBEAT_INTERVAL);
  }

  private clearHeartbeat() {
    if (
        this.heartbeatTimer !==
        null
    ) {
      clearInterval(
          this.heartbeatTimer
      );

      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) {
      return;
    }

    this.clearReconnectTimer();

    this.reconnectAttempts += 1;

    const exponentialDelay =
        Math.min(
            INITIAL_RECONNECT_DELAY *
            2 **
            Math.min(
                this.reconnectAttempts - 1,
                4
            ),
            MAX_RECONNECT_DELAY
        );

    const jitter =
        Math.floor(
            Math.random() * 500
        );

    const delay =
        exponentialDelay + jitter;

    this.listener.onStatus?.(
        "reconnecting",
        `Reconectando em ${Math.ceil(
            delay / 1000
        )}s...`
    );

    this.reconnectTimer =
        setTimeout(() => {
          this.reconnectTimer = null;

          if (!this.shouldReconnect) {
            return;
          }

          this.openSocket();
        }, delay);
  }

  private clearReconnectTimer() {
    if (
        this.reconnectTimer !==
        null
    ) {
      clearTimeout(
          this.reconnectTimer
      );

      this.reconnectTimer = null;
    }
  }

  private clearConnectionTimeout() {
    if (
        this.connectionTimeoutTimer !==
        null
    ) {
      clearTimeout(
          this.connectionTimeoutTimer
      );

      this.connectionTimeoutTimer = null;
    }
  }

  disconnect() {
    this.shouldReconnect = false;

    this.connectionGeneration += 1;

    this.clearReconnectTimer();
    this.clearConnectionTimeout();
    this.clearHeartbeat();

    const ws = this.ws;

    this.ws = null;

    if (ws) {
      ws.close();
    }

    this.listener.onStatus?.(
        "closed"
    );
  }
}