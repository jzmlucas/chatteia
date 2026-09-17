import { adaptTikTokMessage } from "@/lib/platforms/tiktok/adapter";
import { publishTikTokChat } from "@/lib/platforms/tiktok/bus";
import type { TikTokWebhookPayload } from "@/lib/platforms/tiktok/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const secret = request.headers.get("x-tiktok-worker-secret");

    if (!secret || secret !== process.env.TIKTOK_WORKER_SECRET) {
        return Response.json({ error: "Não autorizado." }, { status: 401 });
    }

    let payload: TikTokWebhookPayload;

    try {
        payload = await request.json();
    } catch {
        return Response.json({ error: "JSON inválido." }, { status: 400 });
    }

    if (!payload?.channel || !payload?.event?.comment) {
        return Response.json(
            { error: "Payload incompleto." },
            { status: 400 }
        );
    }

    const channel = payload.channel.trim().toLowerCase();

    const message = adaptTikTokMessage(channel, payload.event);

    publishTikTokChat(message);

    return Response.json({ ok: true });
}