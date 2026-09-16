import { NextResponse } from "next/server";

type TwitchTokenResponse = {
    access_token: string;
};

type TwitchBadge = {
    set_id: string;
    id: string;
    image_url_1x: string;
    image_url_2x: string;
    image_url_4x: string;
    title: string;
    description: string;
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
        const text = await response.text();

        console.error(
            "[TwitchBadges API] Erro ao obter token:",
            response.status,
            text
        );

        throw new Error(
            "Não foi possível autenticar com a Twitch."
        );
    }

    const data =
        (await response.json()) as TwitchTokenResponse;

    return data.access_token;
}

async function twitchFetch(
    url: string,
    headers: HeadersInit
) {
    const response = await fetch(url, {
        headers,
        cache: "no-store",
    });

    const text = await response.text();

    let data: unknown = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = text;
    }

    return {
        response,
        data,
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const channelId =
            searchParams.get("channelId")?.trim();

        const clientId =
            process.env.TWITCH_CLIENT_ID;

        if (!clientId) {
            return NextResponse.json(
                {
                    error:
                        "TWITCH_CLIENT_ID não configurado.",
                },
                { status: 500 }
            );
        }

        const accessToken = await getAccessToken();

        const headers = {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
        };

        const globalResult = await twitchFetch(
            "https://api.twitch.tv/helix/chat/badges/global",
            headers
        );

        if (!globalResult.response.ok) {
            console.error(
                "[TwitchBadges API] Global:",
                globalResult.response.status,
                globalResult.data
            );

            return NextResponse.json(
                {
                    error:
                        "Erro ao buscar badges globais da Twitch.",
                    details: globalResult.data,
                },
                {
                    status:
                    globalResult.response.status,
                }
            );
        }

        const globalData =
            globalResult.data as {
                data?: TwitchBadge[];
            };

        const badges = [
            ...(globalData.data ?? []),
        ];

        if (channelId) {
            const channelResult =
                await twitchFetch(
                    `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${encodeURIComponent(
                        channelId
                    )}`,
                    headers
                );

            if (!channelResult.response.ok) {
                console.error(
                    "[TwitchBadges API] Channel:",
                    channelResult.response.status,
                    channelResult.data
                );

                return NextResponse.json(
                    {
                        error:
                            "Erro ao buscar badges do canal.",
                        details:
                        channelResult.data,
                    },
                    {
                        status:
                        channelResult.response.status,
                    }
                );
            }

            const channelData =
                channelResult.data as {
                    data?: TwitchBadge[];
                };

            badges.push(
                ...(channelData.data ?? [])
            );
        }

        return NextResponse.json({
            data: badges,
        });
    } catch (error) {
        console.error(
            "[TwitchBadges API] Erro:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Erro interno ao buscar badges da Twitch.",
            },
            { status: 500 }
        );
    }
}