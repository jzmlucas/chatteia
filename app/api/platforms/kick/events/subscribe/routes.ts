import { NextRequest } from "next/server";
import { subscribeKickChat } from "@/lib/platforms/kick/subscriptions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const broadcasterUserId = Number(body.broadcasterUserId);

    if (!Number.isInteger(broadcasterUserId) || broadcasterUserId <= 0) {
      return Response.json(
        { error: "broadcasterUserId inválido." },
        { status: 400 }
      );
    }

    const result = await subscribeKickChat(broadcasterUserId);
    return Response.json({ ok: true, result });
  } catch (error) {
    console.error("[KICK] Subscribe:", error);
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar a assinatura da KICK.",
      },
      { status: 500 }
    );
  }
}
