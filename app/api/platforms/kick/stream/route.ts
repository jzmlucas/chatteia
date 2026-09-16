import { isKickChannelAuthorized } from "@/lib/platforms/kick/authorized-channels";
import { subscribeKickChat } from "@/lib/platforms/kick/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const channel = (url.searchParams.get("channel") ?? "")
    .trim()
    .replace(/^#/, "")
    .toLowerCase();

  if (!/^[a-zA-Z0-9_]{3,25}$/.test(channel)) {
    return Response.json({ error: "Canal inválido." }, { status: 400 });
  }

  const authorized = await isKickChannelAuthorized(channel);
  if (!authorized) {
    return Response.json(
      {
        error: "Este canal KICK ainda não autorizou o Chatteia.",
        code: "KICK_CHANNEL_NOT_AUTHORIZED",
        channel,
      },
      { status: 403 }
    );
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

      cleanup = subscribeKickChat(channel, (message) => {
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
