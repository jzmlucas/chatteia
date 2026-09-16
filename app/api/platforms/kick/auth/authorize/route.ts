import { NextRequest, NextResponse } from "next/server";
import {
  createKickAuthorizationUrl,
  createKickCodeChallenge,
  createKickCodeVerifier,
  createKickOAuthState,
} from "@/lib/platforms/kick/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const state = createKickOAuthState();
  const codeVerifier = createKickCodeVerifier();
  const codeChallenge = createKickCodeChallenge(codeVerifier);

  const authorizationUrl = createKickAuthorizationUrl({
    state,
    codeChallenge,
  });

  const locale =
      request.nextUrl.searchParams.get("locale") || "pt-br";

  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set("kick_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  response.cookies.set("kick_oauth_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  response.cookies.set(
      "kick_oauth_locale",
      encodeURIComponent(locale),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      }
  );

  return response;
}