export async function GET() {
    const clientId =
        process.env.KICK_CLIENT_ID;

    const clientSecret =
        process.env.KICK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return Response.json(
            {
                ok: false,
                error: "Variáveis da KICK não encontradas.",
                hasClientId: Boolean(clientId),
                hasClientSecret:
                    Boolean(clientSecret),
            },
            {
                status: 500,
            }
        );
    }

    const body =
        new URLSearchParams({
            grant_type:
                "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
        });

    const response = await fetch(
        "https://id.kick.com/oauth/token",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: body.toString(),
            cache: "no-store",
        }
    );

    const data =
        await response.json();

    return Response.json(
        {
            ok: response.ok,
            status: response.status,
            error: data.error,
            errorDescription:
            data.error_description,
            hasAccessToken:
                Boolean(data.access_token),
        },
        {
            status: response.ok ? 200 : 500,
        }
    );
}