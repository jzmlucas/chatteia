import { NextRequest, NextResponse } from "next/server";

import { getOAuthProvider } from "@/lib/auth/oauth";
import { createSession, setSessionCookieOnResponse } from "@/lib/auth/session";
import { findOrCreateUserFromOAuth } from "@/lib/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "chatteia_oauth_state";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider: providerId } = await params;
    const appUrl = new URL(request.url).origin;

    const provider = getOAuthProvider(providerId);

    if (!provider) {
        return NextResponse.redirect(`${appUrl}/login?oauth_error=1`);
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const expectedState = request.cookies.get(STATE_COOKIE_NAME)?.value;

    if (!code || !state || !expectedState || state !== expectedState) {
        return NextResponse.redirect(`${appUrl}/login?oauth_error=1`);
    }

    try {
        const redirectUri = `${appUrl}/api/auth/oauth/${providerId}/callback`;

        const profile = await provider.exchangeCodeForProfile({
            code,
            redirectUri,
        });

        const user = await findOrCreateUserFromOAuth({
            provider: providerId,
            providerAccountId: profile.providerAccountId,
            email: profile.email,
            suggestedUsername: profile.suggestedUsername,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
        });

        const { rawToken, expiresAt } = await createSession(user.id);

        const response = NextResponse.redirect(`${appUrl}/`);

        setSessionCookieOnResponse(response, rawToken, expiresAt);

        // Consome o cookie de state (uso único).
        response.cookies.set(STATE_COOKIE_NAME, "", { maxAge: 0, path: "/" });

        return response;
    } catch (error) {
        console.error(`[OAuth:${providerId}] Falha no callback:`, error);

        return NextResponse.redirect(`${appUrl}/login?oauth_error=1`);
    }
}
