import { NextRequest, NextResponse } from "next/server";

import { findUserById } from "@/lib/auth/users";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import {
    getAppUrl,
    getPriceId,
    getTrialDays,
    isStripeConfigured,
    safeLocale,
    toStripeLocale,
} from "@/lib/billing/config";
import { isSubscriptionEntitled } from "@/lib/billing/entitlements";
import { getStripe } from "@/lib/billing/stripe";
import {
    ensureStripeCustomer,
    findSubscriptionByUserId,
} from "@/lib/billing/subscriptions";
import type { BillingInterval } from "@/types/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
    return NextResponse.json({ error }, { status });
}

/**
 * Cria uma Checkout Session do Stripe (modo assinatura) e devolve a URL para
 * onde o navegador deve ir. O acesso NÃO é liberado aqui: quem libera é o
 * webhook (lib/billing/webhook.ts) quando o Stripe confirma a assinatura.
 */
export async function POST(request: NextRequest) {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
        return fail("UNAUTHENTICATED", 401);
    }

    if (!isStripeConfigured()) {
        return fail("BILLING_NOT_CONFIGURED", 503);
    }

    let body: { interval?: unknown; locale?: unknown } = {};

    try {
        body = await request.json();
    } catch {
        // corpo opcional
    }

    if (
        body.interval !== undefined &&
        body.interval !== "month" &&
        body.interval !== "year"
    ) {
        return fail("INVALID_INTERVAL", 400);
    }

    const interval: BillingInterval =
        body.interval === "year" ? "year" : "month";

    const priceId = getPriceId(interval);

    if (!priceId) {
        return fail("INVALID_INTERVAL", 400);
    }

    const locale = safeLocale(body.locale);

    try {
        const user = await findUserById(sessionUser.id);

        if (!user) {
            return fail("UNAUTHENTICATED", 401);
        }

        const existing = await findSubscriptionByUserId(user.id);

        // Evita cobrança dupla: quem já tem assinatura viva gerencia no portal.
        if (isSubscriptionEntitled(existing)) {
            return fail("ALREADY_SUBSCRIBED", 409);
        }

        const stripe = getStripe();

        let customerId = existing?.provider_customer_id ?? null;

        if (!customerId) {
            // Idempotency key: dois cliques seguidos não criam dois customers.
            const customer = await stripe.customers.create(
                {
                    email: user.email,
                    name: user.display_name ?? user.username,
                    metadata: { user_id: user.id },
                },
                { idempotencyKey: `chatteia-customer-${user.id}` }
            );

            customerId = customer.id;
        }

        await ensureStripeCustomer(user.id, customerId);

        const appUrl = getAppUrl(request);
        const trialDays = getTrialDays();

        // Sem `payment_method_types`: os meios de pagamento (cartão, Pix,
        // boleto...) são controlados pelo painel do Stripe, sem novo deploy.
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            client_reference_id: user.id,
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true,
            locale: toStripeLocale(locale),
            success_url: `${appUrl}/${locale}/billing?checkout=success`,
            cancel_url: `${appUrl}/${locale}/billing?checkout=canceled`,
            metadata: { user_id: user.id },
            subscription_data: {
                metadata: { user_id: user.id },
                ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
            },
        });

        if (!session.url) {
            return fail("CHECKOUT_FAILED", 502);
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error(
            "[BILLING] Falha ao criar checkout:",
            error instanceof Error ? error.message : error
        );

        return fail("CHECKOUT_FAILED", 502);
    }
}
