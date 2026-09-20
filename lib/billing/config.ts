import { isAppLocale } from "@/i18n/config";
import type { BillingInterval } from "@/types/billing";

/*
 * Toda a configuração de cobrança vem de variáveis de ambiente lidas em
 * RUNTIME (nunca como build-arg do Docker — são segredos).
 */

export const PLAN_KEY = "streamer";

/**
 * Enquanto for false (padrão), NADA muda para os usuários: o modo streamer
 * continua liberado como antes. Ligue (BILLING_ENFORCED=true) só depois de
 * testar o fluxo completo com as chaves de teste do Stripe.
 */
export function isBillingEnforced(): boolean {
    return process.env.BILLING_ENFORCED === "true";
}

export function getPriceId(interval: BillingInterval): string | null {
    const value =
        interval === "year"
            ? process.env.STRIPE_PRICE_STREAMER_YEARLY
            : process.env.STRIPE_PRICE_STREAMER_MONTHLY;

    return value?.trim() || null;
}

export function getConfiguredIntervals(): BillingInterval[] {
    return (["month", "year"] as const).filter((interval) =>
        Boolean(getPriceId(interval))
    );
}

export function isStripeConfigured(): boolean {
    return (
        Boolean(process.env.STRIPE_SECRET_KEY?.trim()) &&
        getConfiguredIntervals().length > 0
    );
}

export function getTrialDays(): number {
    const parsed = Number.parseInt(process.env.STRIPE_TRIAL_DAYS ?? "0", 10);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }

    return Math.min(parsed, 90);
}

/**
 * URL pública do app (usada nas URLs de retorno do Stripe).
 *
 * Em produção exigimos APP_URL: atrás de proxy/Docker o `request.url` pode
 * refletir o host interno (0.0.0.0:3000) e mandaria o cliente para lugar
 * nenhum depois de pagar.
 */
export function getAppUrl(request: Request): string {
    const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");

    if (configured) {
        return configured;
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("APP_URL não configurado.");
    }

    return new URL(request.url).origin;
}

/** Idiomas do app -> locales aceitos pelo Stripe Checkout. */
export function toStripeLocale(locale: string): "pt-BR" | "en" | "es" | "ru" {
    if (!isAppLocale(locale)) {
        return "pt-BR";
    }

    switch (locale) {
        case "en":
            return "en";
        case "es":
            return "es";
        case "ru":
            return "ru";
        default:
            return "pt-BR";
    }
}

export function safeLocale(value: unknown): string {
    return typeof value === "string" && isAppLocale(value) ? value : "pt-br";
}
