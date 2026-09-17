import { subscribeTikTokChat } from "@/lib/platforms/tiktok/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);

    const channel = (url.searchParams.get("channel") ?? "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    if (!/^[a-zA-Z0-9_.]{2,50}$/.test(channel)) {
        return Response.json({ error: "Canal inválido." }, { status: 400 });
    }

    // Garante que o worker externo está de fato conectado a essa live.
    // Fire-and-forget: se falhar, o stream ainda abre, só não vai
    // receber mensagens até o worker conseguir conectar.
    const workerUrl = process.env.TIKTOK_WORKER_URL;
    const workerSecret = process.env.TIKTOK_WORKER_SECRET;

    if (workerUrl && workerSecret) {
        fetch(`${workerUrl}/watch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-tiktok-worker-secret": workerSecret,
            },
            body: JSON.stringify({ channel }),
        }).catch((error) => {
            console.error("[TIKTOK] Falha ao acionar o worker:", error);
        });
    }

    const encoder = new TextEncoder();
    let cleanup: (() => void) | null = null;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            const send = (data: string) => {
                try {
                    controller.enqueue(encoder.encode(data));
                } catch {
                    // Client disconnected.
                }
            };

            send(`event: ready\ndata: ${JSON.stringify({ channel })}\n\n`);

            cleanup = subscribeTikTokChat(channel, (message) => {
                send(`data: ${JSON.stringify(message)}\n\n`);
            });

            heartbeat = setInterval(() => {
                send(`: heartbeat ${Date.now()}\n\n`);
            }, 15_000);
        },
        cancel() {
            cleanup?.();
            cleanup = null;

            if (heartbeat) {
                clearInterval(heartbeat);
                heartbeat = null;
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}