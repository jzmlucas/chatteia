import { NextResponse } from "next/server";

type TwitchTokenResponse = {
    access_token: string;
};

type TwitchUser = {
    id: string;
    login: string;
    display_name: string;
};

type TwitchChannelInfo = {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    broadcaster_language: string;
    game_name: string;
    game_id: string;
    title: string;
};

type TwitchStream = {
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    game_id: string;
    game_name: string;
    type: string;
    title: string;
    viewer_count: number;
    started_at: string;
    language: string;
    thumbnail_url: string;
};

async function getAccessToken() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "TWITCH_CLIENT_ID ou TWITCH_CLIENT_SECRET não configurado."
        );
    }

    const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(
            clientId
        )}&client_secret=${encodeURIComponent(
            clientSecret
        )}&grant_type=client_credentials`,
        {
            method: "POST",
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error("Não foi possível autenticar com a Twitch.");
    }

    const data = (await response.json()) as TwitchTokenResponse;

    return data.access_token;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const login = searchParams.get("login")?.trim().toLowerCase();

        if (!login) {
            return NextResponse.json(
                { error: "Parâmetro login é obrigatório." },
                { status: 400 }
            );
        }

        if (!/^[a-zA-Z0-9_]{3,25}$/.test(login)) {
            return NextResponse.json(
                { error: "Nome de canal inválido." },
                { status: 400 }
            );
        }

        const clientId = process.env.TWITCH_CLIENT_ID;

        if (!clientId) {
            return NextResponse.json(
                { error: "TWITCH_CLIENT_ID não configurado." },
                { status: 500 }
            );
        }

        const accessToken = await getAccessToken();

        const headers = {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
        };

        // 1. Descobre o broadcaster_id pelo login
        const userResponse = await fetch(
            `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
            {
                headers,
                cache: "no-store",
            }
        );

        if (!userResponse.ok) {
            return NextResponse.json(
                { error: "Erro ao buscar usuário na Twitch." },
                { status: userResponse.status }
            );
        }

        const userData = (await userResponse.json()) as {
            data: TwitchUser[];
        };

        const user = userData.data?.[0];

        if (!user) {
            return NextResponse.json(
                { error: "Canal não encontrado." },
                { status: 404 }
            );
        }

        // 2. Informações do canal
        const channelResponse = await fetch(
            `https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(
                user.id
            )}`,
            {
                headers,
                cache: "no-store",
            }
        );

        if (!channelResponse.ok) {
            return NextResponse.json(
                { error: "Erro ao buscar informações do canal." },
                { status: channelResponse.status }
            );
        }

        const channelData =
            (await channelResponse.json()) as {
                data: TwitchChannelInfo[];
            };

        const channelInfo = channelData.data?.[0];

        // 3. Get Streams → quantidade de espectadores
        const streamResponse = await fetch(
            `https://api.twitch.tv/helix/streams?user_id=${encodeURIComponent(
                user.id
            )}`,
            {
                headers,
                cache: "no-store",
            }
        );

        if (!streamResponse.ok) {
            return NextResponse.json(
                { error: "Erro ao buscar stream do canal." },
                { status: streamResponse.status }
            );
        }

        const streamData =
            (await streamResponse.json()) as {
                data: TwitchStream[];
            };

        const stream = streamData.data?.[0];

        return NextResponse.json({
            channel: {
                id: user.id,
                login: user.login,
                displayName: user.display_name,

                gameName: channelInfo?.game_name ?? "",
                title: channelInfo?.title ?? "",

                isLive: Boolean(stream),
                viewerCount: stream?.viewer_count ?? 0,

                startedAt: stream?.started_at ?? null,
            },
        });
    } catch (error) {
        console.error("Twitch channel error:", error);

        return NextResponse.json(
            { error: "Erro interno ao buscar informações do canal." },
            { status: 500 }
        );
    }
}