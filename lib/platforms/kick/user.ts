const KICK_API_URL =
    "https://api.kick.com/public/v1";

export async function fetchKickCurrentUser(
    accessToken: string
) {
    const response =
        await fetch(
            `${KICK_API_URL}/users`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,
                    Accept:
                        "application/json",
                },
                cache: "no-store",
            }
        );

    const text =
        await response.text();

    let data: any;

    try {
        data =
            JSON.parse(text);
    } catch {
        data = {
            message: text,
        };
    }

    if (!response.ok) {
        console.error(
            "[KICK] User endpoint:",
            {
                status:
                response.status,
                data,
            }
        );

        throw new Error(
            `KICK users HTTP ${response.status}`
        );
    }

    const user =
        Array.isArray(data.data)
            ? data.data[0]
            : data.data;

    if (!user) {
        throw new Error(
            "KICK não retornou o usuário autorizado."
        );
    }

    return {
        id: String(
            user.user_id
        ),
        username:
            user.username ??
            user.name ??
            "",
    };
}