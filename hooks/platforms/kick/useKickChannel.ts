"use client";

import { useEffect, useState } from "react";
import type { ChatConnectionStatus, UnifiedChatMessage } from "@/lib/chat/types";

type KickChannelState = {
  messages: UnifiedChatMessage[];
  status: ChatConnectionStatus;
  statusDetail?: string;
};

const MAX_MESSAGES = 300;

export function useKickChannel(channel: string): KickChannelState {
  const [messages, setMessages] = useState<UnifiedChatMessage[]>([]);
  const [status, setStatus] = useState<ChatConnectionStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string>();

  useEffect(() => {
    const normalizedChannel = channel.trim().replace(/^#/, "").toLowerCase();

    if (!normalizedChannel) {
      setMessages([]);
      setStatus("idle");
      setStatusDetail(undefined);
      return;
    }

    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let source: EventSource | null = null;
    let reconnectAttempt = 0;

    setMessages([]);
    setStatus("connecting");
    setStatusDetail("Conectando à KICK…");

    function connect() {
      if (!active) return;

      source?.close();
      source = new EventSource(
        `/api/platforms/kick/stream?channel=${encodeURIComponent(normalizedChannel)}`
      );

      source.onopen = () => {
        if (!active) return;
        reconnectAttempt = 0;
        setStatus("connected");
        setStatusDetail(undefined);
      };

      source.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as UnifiedChatMessage;
          setMessages((current) => {
            if (current.some((item) => item.id === message.id)) return current;
            return [...current, message].slice(-MAX_MESSAGES);
          });
        } catch {
          // Ignore malformed events.
        }
      };

      source.onerror = async () => {
        source?.close();
        source = null;
        if (!active) return;

        const response = await fetch(
          `/api/platforms/kick/stream?channel=${encodeURIComponent(normalizedChannel)}`,
          { method: "GET", cache: "no-store" }
        ).catch(() => null);

        if (response?.status === 403) {
          setStatus("error");
          setStatusDetail("Este canal KICK ainda não autorizou o Chatteia.");
          return;
        }

        reconnectAttempt += 1;
        setStatus("reconnecting");
        setStatusDetail("Reconectando…");
        const delay = Math.min(1000 * 2 ** (reconnectAttempt - 1), 15_000);
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      active = false;
      source?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [channel]);

  return { messages, status, statusDetail };
}
