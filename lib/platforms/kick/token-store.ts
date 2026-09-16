import { promises as fs } from "node:fs";
import path from "node:path";
import { refreshKickAccessToken } from "./oauth";

export type KickToken = {
  broadcasterUserId: string;
  username: string;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresAt: number;
  scope: string[];
};

type KickTokenStore = Record<string, KickToken>;

const filePath = path.join(process.cwd(), ".kick-tokens.json");

async function readStore(): Promise<KickTokenStore> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as KickTokenStore;
  } catch {
    return {};
  }
}

async function writeStore(store: KickTokenStore) {
  await fs.writeFile(
    filePath,
    JSON.stringify(store, null, 2),
    "utf8"
  );
}

export async function saveKickToken(token: KickToken) {
  const store = await readStore();

  store[token.broadcasterUserId] = {
    ...token,
    scope: [...new Set(token.scope)],
  };

  await writeStore(store);
}

export async function getKickToken(
  broadcasterUserId: string
) {
  const store = await readStore();

  return store[broadcasterUserId] ?? null;
}

export async function getAllKickTokens() {
  const store = await readStore();

  return Object.values(store);
}

export async function deleteKickToken(
  broadcasterUserId: string
) {
  const store = await readStore();

  delete store[broadcasterUserId];

  await writeStore(store);
}

export async function getValidKickToken(
  broadcasterUserId: string
) {
  const token = await getKickToken(broadcasterUserId);

  if (!token) {
    return null;
  }

  const refreshWindow = 60_000;

  if (token.expiresAt > Date.now() + refreshWindow) {
    return token;
  }

  if (!token.refreshToken) {
    return token;
  }

  try {
    const refreshed = await refreshKickAccessToken(
      token.refreshToken
    );

    const nextToken: KickToken = {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken:
        refreshed.refresh_token ?? token.refreshToken,
      tokenType: refreshed.token_type,
      expiresAt:
        Date.now() + refreshed.expires_in * 1000,
      scope: refreshed.scope
        ? refreshed.scope
            .split(" ")
            .filter(Boolean)
        : token.scope,
    };

    await saveKickToken(nextToken);

    return nextToken;
  } catch (error) {
    console.error(
      "[KICK] Falha ao renovar token:",
      error
    );

    return token;
  }
}

export async function getKickTokenByChannel(
  channel: string
) {
  const normalized = channel
    .trim()
    .replace(/^#/, "")
    .toLowerCase();

  const tokens = await getAllKickTokens();

  return (
    tokens.find(
      (token) =>
        token.username
          .trim()
          .toLowerCase() === normalized
    ) ?? null
  );
}