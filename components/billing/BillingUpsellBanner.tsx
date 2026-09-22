"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Chama pra assinatura em qualquer tela do modo streamer, independente de
 * `BILLING_ENFORCED`. Hoje ninguém é bloqueado sem pagar — mas sem um
 * convite visível e recorrente, ninguém descobre que existe um plano pago
 * pra assinar. Este banner é essa ponte.
 *
 * Só renderiza algo quando faz sentido: usuário é streamer, está no modo
 * streamer, e ainda não tem assinatura viva (`billing.subscribed`).
 */
export function BillingUpsellBanner() {
    const tBilling = useTranslations("billing");

    const { isStreamer, isStreamerMode, billing } = useAuth();

    if (!isStreamer || !isStreamerMode || billing?.subscribed) {
        return null;
    }

    return (
        <Link
            href="/billing"
            className="group mb-6 flex flex-col items-start gap-3 border border-[#F55376]/30 bg-[#F55376]/5 p-4 transition-colors hover:border-[#F55376]/60 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <p className="text-sm font-semibold text-zinc-100">
                    {tBilling("upsellTitle")}
                </p>

                <p className="mt-0.5 text-xs leading-5 text-zinc-400">
                    {tBilling("upsellDesc")}
                </p>
            </div>

            <span className="shrink-0 border border-[#F55376] bg-[#F55376] px-4 py-2 text-xs font-semibold text-white transition-opacity group-hover:opacity-90">
                {tBilling("upsellCta")}
            </span>
        </Link>
    );
}
