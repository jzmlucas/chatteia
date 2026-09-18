import { NextRequest, NextResponse } from "next/server";
import { exchangeKickCode } from "@/lib/platforms/kick/oauth";
import { saveKickToken } from "@/lib/platforms/kick/token-store";
import { fetchKickCurrentUser } from "@/lib/platforms/kick/user";
import { subscribeKickChat } from "@/lib/platforms/kick/subscriptions";
import { platformConnectionRepo } from "@/lib/repositories/platformConnections";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCookie(request: NextRequest, name: string) {
  return request.cookies.get(name)?.value;
}

function redirectToConnect(
  request: NextRequest,
  params: Record<string, string>,
  locale = "pt-br"
) {
  const safeLocale = /^[a-zA-Z-]{2,10}$/.test(locale)
    ? locale
    : "pt-br";

  const url = new URL(`/${safeLocale}/kick/connect`, request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const storedState = getCookie(request, "kick_oauth_state");
  const codeVerifier = getCookie(request, "kick_oauth_verifier");

  const localeCookie = getCookie(request, "kick_oauth_locale");
  const locale = localeCookie
    ? decodeURIComponent(localeCookie)
    : "pt-br";

  if (error) {
    return redirectToConnect(request, { error }, locale);
  }

  if (!code || !state) {
    return redirectToConnect(
      request,
      { error: "Código OAuth ou state ausente." },
      locale
    );
  }

  if (!storedState || !codeVerifier || state !== storedState) {
    return redirectToConnect(
      request,
      { error: "Sessão OAuth da KICK expirada ou inválida." },
      locale
    );
  }

  try {
    const token = await exchangeKickCode({
      code,
      codeVerifier,
    });

    const user = await fetchKickCurrentUser(token.access_token);

    await saveKickToken({
      broadcasterUserId: user.id,
      username: user.username,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      tokenType: token.token_type,
      expiresAt: Date.now() + token.expires_in * 1000,
      scope: token.scope
        ? token.scope.split(" ").filter(Boolean)
        : [],
    });

    // Vincula a conta KICK ao usuário logado no Chatteia (via repositório desacoplado)
    try {
      const sessionUser = await getSessionUser(request);

      if (sessionUser) {
        await platformConnectionRepo.save({
          chatteiaUserId: sessionUser.id,
          platform: "kick",
          platformUsername: user.username,
          platformUserId: user.id,
          connectedAt: new Date(),
        });
      } else {
        console.warn(
          "[KICK] Nenhuma sessão do Chatteia encontrada no callback — conexão não vinculada."
        );
      }
    } catch (linkError) {
      // Não bloqueia o fluxo principal — apenas loga o erro
      console.error("[KICK] Falha ao vincular conta ao usuário Chatteia:", linkError);
    }

    let subscriptionOk = true;
    let subscriptionError = "";

    try {
      await subscribeKickChat(Number(user.id));
    } catch (error) {
      subscriptionOk = false;

      subscriptionError =
        error instanceof Error
          ? error.message
          : "Falha ao assinar o chat.";

      console.error(
        "[KICK] Falha ao assinar chat:",
        error
      );
    }

    const response = redirectToConnect(
      request,
      {
        success: "1",
        channel: user.username,
        ...(subscriptionOk
          ? {}
          : { subscriptionError }),
      },
      locale
    );

    response.cookies.set("kick_oauth_state", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("kick_oauth_verifier", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[KICK] Falha no OAuth:", error);

    return redirectToConnect(
      request,
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao autorizar a KICK.",
      },
      locale
    );
  }
}