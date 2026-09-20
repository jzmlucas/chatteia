import { NextResponse } from "next/server";

import { readSessionCookie, validateSessionToken } from "@/lib/auth/session";
import { setActiveMode } from "@/lib/auth/users";
import { isBillingEnforced } from "@/lib/billing/config";
import {
    hasStreamerAccess,
    isSubscriptionEntitled,
} from "@/lib/billing/entitlements";
import { findSubscriptionByUserId } from "@/lib/billing/subscriptions";
import { toSubscriptionSummary, type BillingState } from "@/types/billing";
import { toProfile } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const token = await readSessionCookie();

    if (!token) {
        return NextResponse.json({ profile: null });
    }

    const { user } = await validateSessionToken(token);

    if (!user) {
        return NextResponse.json({ profile: null });
    }

    const subscription = await findSubscriptionByUserId(user.id);
    const entitled = hasStreamerAccess(subscription);

    let current = user;

    // Rede de segurança: o webhook já rebaixa quem perde a assinatura, mas o
    // acesso também pode acabar só pelo relógio (período vencido, cortesia
    // manual expirada) sem nenhum evento. Idempotente: só escreve na
    // transição streamer -> user.
    if (!entitled && user.active_mode === "streamer") {
        current = (await setActiveMode(user.id, "user")) ?? user;
    }

    const billing: BillingState = {
        enforced: isBillingEnforced(),
        entitled,
        subscribed: isSubscriptionEntitled(subscription),
        subscription: toSubscriptionSummary(subscription),
    };

    return NextResponse.json({
        profile: toProfile(current),
        billing,
    });
}
