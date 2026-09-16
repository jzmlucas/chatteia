import { handleKickWebhook } from "@/lib/platforms/kick/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("[KICK WEBHOOK ROUTE] POST recebido");

  console.log("[KICK WEBHOOK ROUTE] Headers:", {
    messageId: request.headers.get("Kick-Event-Message-Id"),
    timestamp: request.headers.get("Kick-Event-Message-Timestamp"),
    signature: Boolean(
        request.headers.get("Kick-Event-Signature")
    ),
    eventType: request.headers.get("Kick-Event-Type"),
  });

  return handleKickWebhook(request);
}