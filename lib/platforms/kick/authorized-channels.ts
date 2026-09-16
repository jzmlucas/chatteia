import { getAllKickTokens } from "./token-store";

export async function isKickChannelAuthorized(channel: string) {
  const normalized = channel.trim().replace(/^#/, "").toLowerCase();

  if (!normalized) {
    return null;
  }

  const tokens = await getAllKickTokens();
  return (
    tokens.find(
      (token) => token.username.trim().toLowerCase() === normalized
    ) ?? null
  );
}
