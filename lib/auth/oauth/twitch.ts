import type { OAuthProfile, OAuthProvider } from "./types";

type TwitchTokenResponse = {
    access_token: string;
    message?: string;
};

type TwitchUsersResponse = {
    data: Array<{
        id: string;
        login: string;
        display_name: string;
        email?: string;
        profile_image_url?: string;
    }>;
};

export const twitchProvider: OAuthProvider = {
    id: "twitch",

    getAuthorizationUrl({ state, redirectUri }) {
        const clientId = process.env.TWITCH_CLIENT_ID;

        if (!clientId) {
            throw new Error("TWITCH_CLIENT_ID não configurado.");
        }

        const url = new URL("https://id.twitch.tv/oauth2/authorize");

        url.searchParams.set("client_id", clientId);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "user:read:email");
        url.searchParams.set("state", state);

        return url.toString();
    },

    async exchangeCodeForProfile({ code, redirectUri }): Promise<OAuthProfile> {
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error(
                "TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET não configurados."
            );
        }

        const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
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

        const tokenData = (await tokenResponse.json()) as TwitchTokenResponse;

        if (!tokenResponse.ok || !tokenData.access_token) {
            throw new Error(
                `Falha ao trocar código da Twitch: ${tokenData.message ?? "erro desconhecido"}`
            );
        }

        const userResponse = await fetch("https://api.twitch.tv/helix/users", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                "Client-Id": clientId,
            },
        });

        if (!userResponse.ok) {
            throw new Error("Falha ao buscar perfil da Twitch.");
        }

        const userData = (await userResponse.json()) as TwitchUsersResponse;
        const twitchUser = userData.data[0];

        if (!twitchUser) {
            throw new Error("Twitch não retornou dados do usuário.");
        }

        if (!twitchUser.email) {
            throw new Error(
                "A conta da Twitch precisa ter um e-mail verificado (escopo user:read:email)."
            );
        }

        return {
            providerAccountId: twitchUser.id,
            email: twitchUser.email,
            suggestedUsername: twitchUser.login,
            displayName: twitchUser.display_name,
            avatarUrl: twitchUser.profile_image_url ?? null,
        };
    },
};
