import type { UnifiedChatMessage } from "@/lib/chat/types";

type Listener = (message: UnifiedChatMessage) => void;

type KickChatBus = {
  listeners: Map<string, Set<Listener>>;
};

const GLOBAL_KEY = "__chatteiaKickChatBus";

function getBus(): KickChatBus {
  const globalObject = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: KickChatBus;
  };

  if (!globalObject[GLOBAL_KEY]) {
    globalObject[GLOBAL_KEY] = {
      listeners: new Map(),
    };
  }

  return globalObject[GLOBAL_KEY];
}

export function subscribeKickChat(
  channel: string,
  listener: Listener
) {
  const normalized = channel.trim().replace(/^#/, "").toLowerCase();
  const bus = getBus();

  let listeners = bus.listeners.get(normalized);
  if (!listeners) {
    listeners = new Set();
    bus.listeners.set(normalized, listeners);
  }

  listeners.add(listener);

  return () => {
    listeners?.delete(listener);
    if (listeners && listeners.size === 0) {
      bus.listeners.delete(normalized);
    }
  };
}

export function publishKickChat(message: UnifiedChatMessage) {
  const bus = getBus();
  const channel = message.channel.trim().toLowerCase();
  const listeners = bus.listeners.get(channel);

  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    try {
      listener(message);
    } catch (error) {
      console.error("[KICK] Listener error:", error);
    }
  }
}
