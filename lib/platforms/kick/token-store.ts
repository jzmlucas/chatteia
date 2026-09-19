import { refreshKickAccessToken } from "./oauth";
import { pool } from "@/lib/db/pool";

export type KickToken = {
  broadcasterUserId: string;
  username: string;
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresAt: number;
  scope: string[];
};

type KickTokenRow = {
  broadcaster_user_id: string;
  username: string;
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_at: number | string;
  scope: string[] | null;
};

function rowToToken(row: KickTokenRow): KickToken {
  return {
    broadcasterUserId: String(row.broadcaster_user_id),
    username: row.username,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenType: row.token_type,
    expiresAt: Number(row.expires_at),
    scope: Array.isArray(row.scope) ? row.scope : [],
  };
}

export async function saveKickToken(token: KickToken) {
  try {
    await pool.query(
        `insert into kick_tokens
             (broadcaster_user_id, username, access_token, refresh_token, token_type, expires_at, scope, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, now())
         on conflict (broadcaster_user_id)
         do update set
             username = excluded.username,
             access_token = excluded.access_token,
             refresh_token = excluded.refresh_token,
             token_type = excluded.token_type,
             expires_at = excluded.expires_at,
             scope = excluded.scope,
             updated_at = now()`,
        [
          token.broadcasterUserId,
          token.username,
          token.accessToken,
          token.refreshToken,
          token.tokenType,
          token.expiresAt,
          [...new Set(token.scope)],
        ]
    );
  } catch (error) {
    console.error("[KICK] Erro ao salvar token no Postgres:", error);

    throw new Error(
        `Falha ao salvar token da KICK no Postgres: ${(error as Error).message}`
    );
  }
}

export async function getKickToken(broadcasterUserId: string) {
  try {
    const { rows } = await pool.query<KickTokenRow>(
        `select broadcaster_user_id, username, access_token, refresh_token, token_type, expires_at, scope
         from kick_tokens
         where broadcaster_user_id = $1
         limit 1`,
        [broadcasterUserId]
    );

    return rows[0] ? rowToToken(rows[0]) : null;
  } catch (error) {
    console.error("[KICK] Erro ao buscar token no Postgres:", error);

    throw new Error(`Falha ao buscar token da KICK: ${(error as Error).message}`);
  }
}

export async function getAllKickTokens() {
  try {
    const { rows } = await pool.query<KickTokenRow>(
        `select broadcaster_user_id, username, access_token, refresh_token, token_type, expires_at, scope
         from kick_tokens
         order by username asc`
    );

    return rows.map(rowToToken);
  } catch (error) {
    console.error("[KICK] Erro ao buscar tokens no Postgres:", error);

    throw new Error(`Falha ao buscar tokens da KICK: ${(error as Error).message}`);
  }
}

export async function deleteKickToken(broadcasterUserId: string) {
  try {
    await pool.query(
        "delete from kick_tokens where broadcaster_user_id = $1",
        [broadcasterUserId]
    );
  } catch (error) {
    console.error("[KICK] Erro ao remover token do Postgres:", error);

    throw new Error(`Falha ao remover token da KICK: ${(error as Error).message}`);
  }
}

export async function getValidKickToken(broadcasterUserId: string) {
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
    const refreshed = await refreshKickAccessToken(token.refreshToken);

    const nextToken: KickToken = {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      tokenType: refreshed.token_type,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
      scope: refreshed.scope
          ? refreshed.scope.split(" ").filter(Boolean)
          : token.scope,
    };

    await saveKickToken(nextToken);

    return nextToken;
  } catch (error) {
    console.error("[KICK] Falha ao renovar token:", error);

    return token;
  }
}

export async function getKickTokenByChannel(channel: string) {
  const normalized = channel.trim().replace(/^#/, "").toLowerCase();

  try {
    const { rows } = await pool.query<KickTokenRow>(
        `select broadcaster_user_id, username, access_token, refresh_token, token_type, expires_at, scope
         from kick_tokens
         where lower(username) = $1
         limit 1`,
        [normalized]
    );

    return rows[0] ? rowToToken(rows[0]) : null;
  } catch (error) {
    console.error("[KICK] Erro ao buscar canal no Postgres:", error);

    throw new Error(`Falha ao buscar canal da KICK: ${(error as Error).message}`);
  }
}
