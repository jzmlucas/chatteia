import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/getSessionUser";
import {
    getAppUrl,
    isStripeConfigured,
    safeLocale,
} from "@/lib/billing/config";
import { getStripe } from "@/lib/billing/stripe";
import { findSubscriptionByUserId } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
    return NextResponse.json({ error }, { status });
}

/**
 * Abre o Portal do Cliente do Stripe (trocar cartão, ver faturas, cancelar).
 * Requer configurar o portal uma vez no painel do Stripe.
 */
export async function POST(request: NextRequest) {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
        return fail("UNAUTHENTICATED", 401);
    }

    if (!isStripeConfigured()) {
        return fail("BILLING_NOT_CONFIGURED", 503);
    }

    let body: { locale?: unknown } = {};

    try {
        body = await request.json();
    } catch {
        // corpo opcional
    }

    try {
        const subscription = await findSubscriptionByUserId(sessionUser.id);

        if (
            !subscription ||
            subscription.provider !== "stripe" ||
            !subscription.provider_customer_id
        ) {
            return fail("NO_BILLING_ACCOUNT", 404);
        }

        const session = await getStripe().billingPortal.sessions.create({
            customer: subscription.provider_customer_id,
            return_url: `${getAppUrl(request)}/${safeLocale(body.locale)}/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error(
            "[BILLING] Falha ao abrir portal:",
            error instanceof Error ? error.message : error
        );

        return fail("PORTAL_FAILED", 502);
    }
}
