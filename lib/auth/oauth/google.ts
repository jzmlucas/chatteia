import type { OAuthProfile, OAuthProvider } from "./types";

type GoogleTokenResponse = {
    access_token: string;
    id_token?: string;
    error?: string;
    error_description?: string;
};

type GoogleUserInfo = {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
};

export const googleProvider: OAuthProvider = {
    id: "google",

    getAuthorizationUrl({ state, redirectUri }) {
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!clientId) {
            throw new Error("GOOGLE_CLIENT_ID não configurado.");
        }

        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

        url.searchParams.set("client_id", clientId);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "openid email profile");
        url.searchParams.set("state", state);
        url.searchParams.set("prompt", "select_account");

        return url.toString();
    },

    async exchangeCodeForProfile({ code, redirectUri }): Promise<OAuthProfile> {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error(
                "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados."
            );
        }

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new Error(
                `Falha ao trocar código do Google: ${tokenData.error_description ?? tokenData.error ?? "erro desconhecido"}`
            );
        }

        const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            }
        );

        if (!userInfoResponse.ok) {
            throw new Error("Falha ao buscar perfil do Google.");
        }

        const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

        return {
            providerAccountId: userInfo.sub,
            email: userInfo.email,
            suggestedUsername: userInfo.email.split("@")[0],
            displayName: userInfo.name ?? null,
            avatarUrl: userInfo.picture ?? null,
        };
    },
};
