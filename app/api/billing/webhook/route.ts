import { getStripe } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint do webhook do Stripe. É AQUI que o acesso é concedido/removido.
 *
 * - Sem sessão/cookie de propósito: quem autentica é a ASSINATURA do
 *   payload (header `stripe-signature` + STRIPE_WEBHOOK_SECRET).
 * - Precisa do corpo CRU (`request.text()`); qualquer parse antes quebra a
 *   verificação da assinatura.
 * - Só devolvemos 2xx quando o evento foi tratado. Erro interno => 500 e o
 *   Stripe reenvia (a idempotência está em billing_events).
 */
export async function POST(request: Request) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (!secret || !process.env.STRIPE_SECRET_KEY?.trim()) {
        return Response.json(
            { error: "BILLING_NOT_CONFIGURED" },
            { status: 503 }
        );
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return Response.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
    }

    const body = await request.text();

    let event;

    try {
        event = await getStripe().webhooks.constructEventAsync(
            body,
            signature,
            secret
        );
    } catch {
        return Response.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
    }

    try {
        const result = await handleStripeEvent(event);

        return Response.json({ received: true, result });
    } catch (error) {
        console.error(
            `[BILLING] Falha ao processar ${event.type} (${event.id}):`,
            error instanceof Error ? error.message : error
        );

        return Response.json({ error: "PROCESSING_FAILED" }, { status: 500 });
    }
}
