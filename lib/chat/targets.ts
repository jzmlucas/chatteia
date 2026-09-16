import type { ChatPlatform } from "./types";

export type ChatTarget = {
  platform: ChatPlatform;
  channel: string;
};

export function normalizeChatTarget(value: string): ChatTarget | null {
  const raw = value.trim();
  const separator = raw.indexOf(":");

  const platform =
    separator > 0 ? raw.slice(0, separator).toLowerCase() : "twitch";
  const channel =
    separator > 0 ? raw.slice(separator + 1) : raw;

  if (platform !== "twitch" && platform !== "kick") return null;

  const normalizedChannel = channel.replace(/^#/, "").trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,25}$/.test(normalizedChannel)) return null;

  return { platform, channel: normalizedChannel };
}

export function targetKey(target: ChatTarget) {
  return `${target.platform}:${target.channel}`;
}
