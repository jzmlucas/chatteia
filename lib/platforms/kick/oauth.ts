import crypto from "node:crypto";

const KICK_AUTHORIZE_URL = "https://id.kick.com/oauth/authorize";
const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";

const SCOPES = [
  "user:read",
  "channel:read",
  "events:subscribe",
];

export function createKickOAuthState() {
  return crypto.randomBytes(32).toString("hex");
}

export function createKickCodeVerifier() {
  return crypto.randomBytes(64).toString("base64url");
}

export function createKickCodeChallenge(codeVerifier: string) {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

export function createKickAuthorizationUrl({
  state,
  codeChallenge,
}: {
  state: string;
  codeChallenge: string;
}) {
  const clientId = process.env.KICK_CLIENT_ID;
  const redirectUri = process.env.KICK_REDIRECT_URI;

  if (!clientId) {
    throw new Error("KICK_CLIENT_ID não configurado.");
  }

  if (!redirectUri) {
    throw new Error("KICK_REDIRECT_URI não configurado.");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return `${KICK_AUTHORIZE_URL}?${params.toString()}`;
}

async function parseKickResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

export async function exchangeKickCode({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}) {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;
  const redirectUri = process.env.KICK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Configuração OAuth da KICK incompleta.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(KICK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await parseKickResponse(response);

  if (!response.ok) {
    console.error("[KICK] Token endpoint:", {
      status: response.status,
      data,
    });

    throw new Error(
      String(
        data.error ??
          data.message ??
          `KICK OAuth HTTP ${response.status}`
      )
    );
  }

  if (!data.access_token) {
    throw new Error("KICK não retornou access_token.");
  }

  return {
    access_token: String(data.access_token),
    token_type: String(data.token_type ?? "Bearer"),
    expires_in: Number(data.expires_in ?? 0),
    refresh_token: data.refresh_token
      ? String(data.refresh_token)
      : undefined,
    scope: data.scope ? String(data.scope) : undefined,
  };
}

export async function refreshKickAccessToken(
  refreshToken: string
) {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Configuração OAuth da KICK incompleta.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(KICK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await parseKickResponse(response);

  if (!response.ok || !data.access_token) {
    throw new Error(
      String(
        data.error ??
          data.message ??
          `KICK refresh HTTP ${response.status}`
      )
    );
  }

  return {
    access_token: String(data.access_token),
    token_type: String(data.token_type ?? "Bearer"),
    expires_in: Number(data.expires_in ?? 0),
    refresh_token: data.refresh_token
      ? String(data.refresh_token)
      : refreshToken,
    scope: data.scope ? String(data.scope) : undefined,
  };
}