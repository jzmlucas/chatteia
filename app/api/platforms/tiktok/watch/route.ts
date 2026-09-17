export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    let body: { channel?: string };

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "JSON inválido." }, { status: 400 });
    }

    const channel = (body.channel ?? "").trim().replace(/^@/, "").toLowerCase();

    if (!/^[a-zA-Z0-9_.]{2,50}$/.test(channel)) {
        return Response.json({ error: "Canal inválido." }, { status: 400 });
    }

    const workerUrl = process.env.TIKTOK_WORKER_URL;
    const workerSecret = process.env.TIKTOK_WORKER_SECRET;

    if (!workerUrl || !workerSecret) {
        return Response.json(
            { error: "Worker do TikTok não configurado." },
            { status: 503 }
        );
    }

    try {
        await fetch(`${workerUrl}/watch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-tiktok-worker-secret": workerSecret,
            },
            body: JSON.stringify({ channel }),
        });
    } catch (error) {
        console.error("[TIKTOK] Falha ao acionar o worker:", error);

        return Response.json(
            { error: "Não foi possível contatar o worker do TikTok." },
            { status: 502 }
        );
    }

    return Response.json({ ok: true, channel });
}