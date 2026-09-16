import { getAllKickTokens, getValidKickToken } from "./token-store";

const KICK_API_URL = process.env.KICK_API_URL || "https://api.kick.com/public/v1";

export async function subscribeKickChat(broadcasterUserId: number | string) {
  const broadcasterIdStr = String(broadcasterUserId);
  const token = await getValidKickToken(broadcasterIdStr);

  if (!token) {
    throw new Error("Token da KICK não encontrado.");
  }

  console.log("[KICK] Subscription request:", {
    broadcasterUserId: broadcasterIdStr,
    tokenType: token.tokenType,
    scope: token.scope,
    expiresAt: token.expiresAt,
    expired: token.expiresAt <= Date.now(),
  });

  const payload = {
    broadcaster_user_id: Number(broadcasterIdStr),
    method: "webhook",
    events: [
      {
        name: "chat.message.sent",
        version: 1,
      },
    ],
  };

  const response = await fetch(`${KICK_API_URL}/events/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    console.error("[KICK] Falha ao criar assinatura:", {
      status: response.status,
      data,
    });

    throw new Error(`KICK subscriptions HTTP ${response.status}`);
  }

  return data;
}

export async function getKickSubscriptions(broadcasterUserId: number | string) {
  const broadcasterIdStr = String(broadcasterUserId);
  const token = await getValidKickToken(broadcasterIdStr);

  if (!token) {
    throw new Error("Token da KICK não encontrado.");
  }

  const response = await fetch(`${KICK_API_URL}/events/subscriptions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(`KICK subscriptions HTTP ${response.status}`);
  }

  return data;
}

export async function getAllKickSubscriptions() {
  const tokens = await getAllKickTokens();
  const result = [];

  for (const token of tokens) {
    try {
      result.push({
        broadcasterUserId: token.broadcasterUserId,
        username: token.username,
        subscriptions: await getKickSubscriptions(token.broadcasterUserId),
      });
    } catch (error) {
      result.push({
        broadcasterUserId: token.broadcasterUserId,
        username: token.username,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  return result;
}