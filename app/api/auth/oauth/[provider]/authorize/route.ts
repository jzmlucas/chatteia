import { NextRequest, NextResponse } from "next/server";

import { generateRawToken } from "@/lib/auth/tokens";
import { getOAuthProvider } from "@/lib/auth/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "chatteia_oauth_state";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: providerId } = await params;

    const provider = getOAuthProvider(providerId);

    if (!provider) {
        return NextResponse.json(
            { error: "UNKNOWN_PROVIDER" },
            { status: 404 }
        );
    }

    const appUrl = new URL(request.url).origin;
    const redirectUri = `${appUrl}/api/auth/oauth/${providerId}/callback`;

    const state = generateRawToken();

    const authorizationUrl = provider.getAuthorizationUrl({
        state,
        redirectUri,
    });

    const response = NextResponse.redirect(authorizationUrl);

    // Cookie de curta duração só para validar o `state` no callback
    // (proteção contra CSRF no fluxo OAuth).
    response.cookies.set(STATE_COOKIE_NAME, state, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10,
    });

    return response;
}
