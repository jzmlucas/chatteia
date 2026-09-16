"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatConnectionStatus, UnifiedChatMessage } from "@/lib/chat/types";

const MAX_MESSAGES = 300;

type Connection = {
  channel: string;
  messages: UnifiedChatMessage[];
  status: ChatConnectionStatus;
  statusDetail?: string;
};

type Result = {
  messages: UnifiedChatMessage[];
  connections: Record<string, Connection>;
};

function normalizeChannels(channels: string[]) {
  return Array.from(
    new Set(
      channels
        .map((channel) => channel.trim().replace(/^#/, "").toLowerCase())
        .filter((channel) => /^[a-zA-Z0-9_]{3,25}$/.test(channel))
    )
  );
}

export function useKickMultiChat(channels: string[]): Result {
  const normalized = useMemo(
    () => normalizeChannels(channels),
    [channels.join("|")]
  );

  const [connections, setConnections] = useState<Record<string, Connection>>({});

  useEffect(() => {
    let active = true;
    const sources = new Map<string, EventSource>();
    const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
    const attempts = new Map<string, number>();

    setConnections((current) => {
      const next: Record<string, Connection> = {};
      for (const channel of normalized) {
        next[channel] = current[channel] ?? {
          channel,
          messages: [],
          status: "idle",
        };
      }
      return next;
    });

    function connect(channel: string) {
      if (!active) return;

      const previous = sources.get(channel);
      previous?.close();

      setConnections((current) => ({
        ...current,
        [channel]: {
          channel,
          messages: current[channel]?.messages ?? [],
          status: "connecting",
          statusDetail: "Conectando à KICK…",
        },
      }));

      const source = new EventSource(
        `/api/platforms/kick/stream?channel=${encodeURIComponent(channel)}`
      );
      sources.set(channel, source);

      source.onopen = () => {
        if (!active) return;
        attempts.set(channel, 0);
        setConnections((current) => ({
          ...current,
          [channel]: {
            channel,
            messages: current[channel]?.messages ?? [],
            status: "connected",
          },
        }));
      };

      source.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as UnifiedChatMessage;
          if (!active) return;

          setConnections((current) => {
            const previousConnection = current[channel] ?? {
              channel,
              messages: [],
              status: "connected" as const,
            };

            if (previousConnection.messages.some((item) => item.id === message.id)) {
              return current;
            }

            return {
              ...current,
              [channel]: {
                ...previousConnection,
                status: "connected",
                statusDetail: undefined,
                messages: [...previousConnection.messages, message].slice(-MAX_MESSAGES),
              },
            };
          });
        } catch {
          // Ignore malformed events.
        }
      };

      source.onerror = async () => {
        source.close();
        sources.delete(channel);
        if (!active) return;

        const response = await fetch(
          `/api/platforms/kick/stream?channel=${encodeURIComponent(channel)}`,
          { cache: "no-store" }
        ).catch(() => null);

        if (response?.status === 403) {
          setConnections((current) => ({
            ...current,
            [channel]: {
              channel,
              messages: current[channel]?.messages ?? [],
              status: "error",
              statusDetail: "Este canal KICK ainda não autorizou o Chatteia.",
            },
          }));
          return;
        }

        const attempt = (attempts.get(channel) ?? 0) + 1;
        attempts.set(channel, attempt);
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15_000);

        setConnections((current) => ({
          ...current,
          [channel]: {
            channel,
            messages: current[channel]?.messages ?? [],
            status: "reconnecting",
            statusDetail: "Reconectando…",
          },
        }));

        const timer = setTimeout(() => connect(channel), delay);
        reconnectTimers.set(channel, timer);
      };
    }

    for (const channel of normalized) {
      connect(channel);
    }

    return () => {
      active = false;
      for (const source of sources.values()) source.close();
      for (const timer of reconnectTimers.values()) clearTimeout(timer);
      sources.clear();
      reconnectTimers.clear();
    };
  }, [normalized]);

  const messages = useMemo(
    () =>
      normalized
        .flatMap((channel) => connections[channel]?.messages ?? [])
        .sort((a, b) => a.timestamp - b.timestamp),
    [normalized, connections]
  );

  return { messages, connections };
}
