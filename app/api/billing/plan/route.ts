import { NextResponse } from "next/server";

import {
    getConfiguredIntervals,
    getPriceId,
    getTrialDays,
    isBillingEnforced,
    isStripeConfigured,
} from "@/lib/billing/config";
import { getStripe } from "@/lib/billing/stripe";
import type { PlanInfo, PlanPrice } from "@/types/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * O preço mora no Stripe (fonte da verdade) — a UI nunca hardcoda valores.
 * Cache curto em memória para não bater na API do Stripe a cada visita.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { at: number; prices: PlanPrice[] } | null = null;

async function loadPrices(): Promise<PlanPrice[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
        return cache.prices;
    }

    const stripe = getStripe();

    const results = await Promise.all(
        getConfiguredIntervals().map(async (interval) => {
            const price = await stripe.prices.retrieve(
                getPriceId(interval) as string
            );

            if (
                !price.active ||
                price.unit_amount === null ||
                price.recurring?.interval !== interval
            ) {
                console.warn(
                    `[BILLING] Price ${price.id} ignorado: precisa estar ativo, ` +
                        `ter valor fixo e recorrência "${interval}".`
                );

                return null;
            }

            return {
                interval,
                amount: price.unit_amount,
                currency: price.currency,
            } satisfies PlanPrice;
        })
    );

    const prices = results.filter((item): item is PlanPrice => item !== null);

    cache = { at: Date.now(), prices };

    return prices;
}

export async function GET() {
    const base = {
        enforced: isBillingEnforced(),
        trialDays: getTrialDays(),
    };

    if (!isStripeConfigured()) {
        return NextResponse.json<PlanInfo>({
            ...base,
            enabled: false,
            prices: [],
        });
    }

    try {
        const prices = await loadPrices();

        return NextResponse.json<PlanInfo>({
            ...base,
            enabled: prices.length > 0,
            prices,
        });
    } catch (error) {
        console.error(
            "[BILLING] Falha ao carregar preços:",
            error instanceof Error ? error.message : error
        );

        return NextResponse.json({ error: "PLAN_UNAVAILABLE" }, { status: 502 });
    }
}
