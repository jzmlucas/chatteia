import { refreshKickAccessToken } from "./oauth";
import { supabaseAdmin } from "@/lib/supabase/server";

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
  const { error } = await supabaseAdmin
      .from("kick_tokens")
      .upsert(
          {
            broadcaster_user_id: token.broadcasterUserId,
            username: token.username,
            access_token: token.accessToken,
            refresh_token: token.refreshToken,
            token_type: token.tokenType,
            expires_at: token.expiresAt,
            scope: [...new Set(token.scope)],
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "broadcaster_user_id",
          }
      );

  if (error) {
    console.error("[KICK] Erro ao salvar token no Supabase:", error);

    throw new Error(
        `Falha ao salvar token da KICK no Supabase: ${error.message}`
    );
  }
}

export async function getKickToken(
    broadcasterUserId: string
) {
  const { data, error } = await supabaseAdmin
      .from("kick_tokens")
      .select(
          `
        broadcaster_user_id,
        username,
        access_token,
        refresh_token,
        token_type,
        expires_at,
        scope
      `
      )
      .eq("broadcaster_user_id", broadcasterUserId)
      .maybeSingle();

  if (error) {
    console.error(
        "[KICK] Erro ao buscar token no Supabase:",
        error
    );

    throw new Error(
        `Falha ao buscar token da KICK: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return rowToToken(data as KickTokenRow);
}

export async function getAllKickTokens() {
  const { data, error } = await supabaseAdmin
      .from("kick_tokens")
      .select(
          `
        broadcaster_user_id,
        username,
        access_token,
        refresh_token,
        token_type,
        expires_at,
        scope
      `
      )
      .order("username", {
        ascending: true,
      });

  if (error) {
    console.error(
        "[KICK] Erro ao buscar tokens no Supabase:",
        error
    );

    throw new Error(
        `Falha ao buscar tokens da KICK: ${error.message}`
    );
  }

  return (data ?? []).map((row) =>
      rowToToken(row as KickTokenRow)
  );
}

export async function deleteKickToken(
    broadcasterUserId: string
) {
  const { error } = await supabaseAdmin
      .from("kick_tokens")
      .delete()
      .eq("broadcaster_user_id", broadcasterUserId);

  if (error) {
    console.error(
        "[KICK] Erro ao remover token do Supabase:",
        error
    );

    throw new Error(
        `Falha ao remover token da KICK: ${error.message}`
    );
  }
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

  const { data, error } = await supabaseAdmin
      .from("kick_tokens")
      .select(
          `
        broadcaster_user_id,
        username,
        access_token,
        refresh_token,
        token_type,
        expires_at,
        scope
      `
      )
      .ilike("username", normalized)
      .maybeSingle();

  if (error) {
    console.error(
        "[KICK] Erro ao buscar canal no Supabase:",
        error
    );

    throw new Error(
        `Falha ao buscar canal da KICK: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return rowToToken(data as KickTokenRow);
}