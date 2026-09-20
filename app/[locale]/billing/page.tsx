"use client";

import { Suspense, useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { HomeLogoLink } from "@/components/layout/HomeLogoLink";
import { useAuth } from "@/contexts/AuthContext";
import { intlLocaleMap, type AppLocale } from "@/i18n/config";
import { Link, useRouter } from "@/i18n/navigation";
import type { BillingInterval, PlanInfo, PlanPrice } from "@/types/billing";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

/** Valor em unidade menor (centavos) -> texto na moeda/idioma certos. */
function formatPrice(price: PlanPrice, locale: string): string {
    const currency = price.currency.toUpperCase();

    // Moedas sem centavos (ex.: JPY) não dividem por 100.
    const digits =
        new Intl.NumberFormat("en", {
            style: "currency",
            currency,
        }).resolvedOptions().maximumFractionDigits ?? 2;

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
    }).format(price.amount / 10 ** digits);
}

function formatDate(iso: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(iso)
    );
}

function BillingContent() {
    const t = useTranslations("billing");
    const appLocale = useLocale() as AppLocale;
    const intlLocale = intlLocaleMap[appLocale] ?? "pt-BR";

    const router = useRouter();
    const searchParams = useSearchParams();
    const checkoutParam = searchParams.get("checkout");

    const {
        billing,
        isStreamer,
        isStreamerMode,
        refreshProfile,
        setActiveMode,
        enableStreamerMode,
    } = useAuth();

    const [plan, setPlan] = useState<PlanInfo | null>(null);
    const [planFailed, setPlanFailed] = useState(false);
    const [interval, setBillingInterval] =
        useState<BillingInterval>("month");

    const [busy, setBusy] = useState<
        "checkout" | "portal" | "activate" | null
    >(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [waiting, setWaiting] = useState(checkoutParam === "success");

    const subscribed = billing?.subscribed ?? false;
    const subscription = billing?.subscription ?? null;

    // Preços vêm do Stripe (via /api/billing/plan) — nada hardcoded aqui.
    useEffect(() => {
        let active = true;

        fetch("/api/billing/plan")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("plan");
                }

                return response.json() as Promise<PlanInfo>;
            })
            .then((data) => {
                if (!active) {
                    return;
                }

                setPlan(data);

                if (
                    data.prices.length > 0 &&
                    !data.prices.some((price) => price.interval === "month")
                ) {
                    setBillingInterval(data.prices[0].interval);
                }
            })
            .catch(() => {
                if (active) {
                    setPlanFailed(true);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    // Voltou do Stripe: o webhook pode levar alguns segundos. Consultamos a
    // sessão até a assinatura aparecer (ou desistimos e avisamos).
    useEffect(() => {
        if (checkoutParam !== "success") {
            return;
        }

        if (subscribed) {
            setWaiting(false);
            return;
        }

        let attempts = 0;

        const timer = setInterval(async () => {
            attempts += 1;

            await refreshProfile();

            if (attempts >= POLL_MAX_ATTEMPTS) {
                clearInterval(timer);
                setWaiting(false);
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkoutParam, subscribed]);

    async function redirectTo(
        endpoint: "/api/billing/checkout" | "/api/billing/portal",
        kind: "checkout" | "portal",
        body: Record<string, unknown>
    ) {
        setBusy(kind);
        setErrorCode(null);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = (await response.json().catch(() => ({}))) as {
                url?: string;
                error?: string;
            };

            if (response.ok && data.url) {
                // Sai do app (Stripe). Mantém "busy" até a navegação acontecer.
                window.location.assign(data.url);
                return;
            }

            setErrorCode(data.error ?? "GENERIC");
        } catch {
            setErrorCode("GENERIC");
        }

        setBusy(null);
    }

    function handleSubscribe() {
        void redirectTo("/api/billing/checkout", "checkout", {
            interval,
            locale: appLocale,
        });
    }

    function handleManage() {
        void redirectTo("/api/billing/portal", "portal", {
            locale: appLocale,
        });
    }

    async function handleActivate() {
        setBusy("activate");
        setErrorCode(null);

        const result = isStreamer
            ? await setActiveMode("streamer")
            : await enableStreamerMode();

        if (result === "ok") {
            router.push("/profile");
            return;
        }

        setErrorCode("GENERIC");
        setBusy(null);
    }

    function errorMessage(code: string): string {
        switch (code) {
            case "UNAUTHENTICATED":
                return t("errorUnauthenticated");
            case "BILLING_NOT_CONFIGURED":
                return t("errorNotConfigured");
            case "ALREADY_SUBSCRIBED":
                return t("errorAlreadySubscribed");
            case "NO_BILLING_ACCOUNT":
                return t("errorNoBillingAccount");
            default:
                return t("errorGeneric");
        }
    }

    function statusLabel(status: string): string {
        const key = `status.${status}`;

        return t.has(key) ? t(key) : status;
    }

    const selectedPrice =
        plan?.prices.find((price) => price.interval === interval) ?? null;

    const trialDays = plan?.trialDays ?? 0;

    const features = [
        t("feature1"),
        t("feature2"),
        t("feature3"),
        t("feature4"),
    ];

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            <HomeLogoLink />

            <div className="mb-5 w-full max-w-lg">
                <Link
                    href="/account"
                    className="mb-5 inline-block text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                    {t("back")}
                </Link>

                <h1 className="text-xl font-bold text-zinc-100">
                    {t("title")}
                </h1>

                <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
            </div>

            <div className="w-full max-w-lg space-y-4">
                {billing && !billing.enforced && (
                    <p className="border border-twitch-border bg-twitch-panel px-4 py-3 text-xs text-zinc-400">
                        {t("notEnforcedNotice")}
                    </p>
                )}

                {checkoutParam === "canceled" && !subscribed && (
                    <p className="border border-twitch-border bg-twitch-panel px-4 py-3 text-xs text-zinc-400">
                        {t("checkoutCanceled")}
                    </p>
                )}

                {checkoutParam === "success" && waiting && !subscribed && (
                    <p
                        role="status"
                        className="border border-[#F55376]/30 bg-[#F55376]/10 px-4 py-3 text-xs text-zinc-200"
                    >
                        {t("checkoutProcessing")}
                    </p>
                )}

                {checkoutParam === "success" && !waiting && !subscribed && (
                    <p className="border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
                        {t("checkoutDelayed")}
                    </p>
                )}

                {errorCode && (
                    <p
                        role="alert"
                        className="border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-400"
                    >
                        {errorMessage(errorCode)}
                    </p>
                )}

                {subscribed && subscription ? (
                    <section className="border border-twitch-border bg-twitch-panel p-6 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-zinc-100">
                                {t("planName")}
                            </h2>

                            <span className="bg-[#F55376]/20 px-2 py-0.5 text-[11px] text-[#F55376]">
                                {statusLabel(subscription.status)}
                            </span>
                        </div>

                        {subscription.provider === "manual" && (
                            <p className="mt-2 text-xs text-zinc-500">
                                {t("providerManual")}
                            </p>
                        )}

                        {subscription.status === "trialing" &&
                            subscription.trialEnd && (
                                <p className="mt-3 text-sm text-zinc-300">
                                    {t("trialEndsOn", {
                                        date: formatDate(
                                            subscription.trialEnd,
                                            intlLocale
                                        ),
                                    })}
                                </p>
                            )}

                        {subscription.currentPeriodEnd &&
                            subscription.status !== "trialing" && (
                                <p className="mt-3 text-sm text-zinc-300">
                                    {subscription.cancelAtPeriodEnd
                                        ? t("endsOn", {
                                              date: formatDate(
                                                  subscription.currentPeriodEnd,
                                                  intlLocale
                                              ),
                                          })
                                        : t("renewsOn", {
                                              date: formatDate(
                                                  subscription.currentPeriodEnd,
                                                  intlLocale
                                              ),
                                          })}
                                </p>
                            )}

                        {subscription.status === "past_due" && (
                            <p className="mt-3 border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-xs text-yellow-200">
                                {t("pastDueWarning")}
                            </p>
                        )}

                        <div className="mt-6 flex flex-col gap-3">
                            {!isStreamerMode && (
                                <button
                                    type="button"
                                    onClick={handleActivate}
                                    disabled={busy !== null}
                                    className="w-full border border-[#F55376] bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {busy === "activate"
                                        ? t("activating")
                                        : t("activateMode")}
                                </button>
                            )}

                            {isStreamerMode && (
                                <Link
                                    href="/profile"
                                    className="block w-full border border-[#F55376] bg-[#F55376] px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                >
                                    {t("goToHub")}
                                </Link>
                            )}

                            {subscription.provider === "stripe" && (
                                <button
                                    type="button"
                                    onClick={handleManage}
                                    disabled={busy !== null}
                                    className="w-full border border-twitch-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                                >
                                    {busy === "portal"
                                        ? t("redirecting")
                                        : t("manage")}
                                </button>
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="border border-twitch-border bg-twitch-panel p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-100">
                                    {t("planName")}
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {t("planTagline")}
                                </p>
                            </div>

                            {trialDays > 0 && (
                                <span className="shrink-0 bg-[#F55376]/20 px-2 py-0.5 text-[11px] text-[#F55376]">
                                    {t("trialBadge", { days: trialDays })}
                                </span>
                            )}
                        </div>

                        {plan && plan.prices.length > 1 && (
                            <div
                                role="group"
                                aria-label={t("intervalLabel")}
                                className="mt-5 grid grid-cols-2 border border-zinc-700 bg-zinc-900 p-1"
                            >
                                {plan.prices.map((price) => (
                                    <button
                                        key={price.interval}
                                        type="button"
                                        aria-pressed={
                                            interval === price.interval
                                        }
                                        onClick={() =>
                                            setBillingInterval(price.interval)
                                        }
                                        className={`h-8 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                                            interval === price.interval
                                                ? "bg-[#F55376] text-white"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                    >
                                        {price.interval === "year"
                                            ? t("intervalYear")
                                            : t("intervalMonth")}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-5 min-h-[3rem]">
                            {selectedPrice ? (
                                <p className="text-3xl font-bold text-zinc-100">
                                    {formatPrice(selectedPrice, intlLocale)}
                                    <span className="ml-1 text-sm font-normal text-zinc-500">
                                        {selectedPrice.interval === "year"
                                            ? t("perYear")
                                            : t("perMonth")}
                                    </span>
                                </p>
                            ) : planFailed || (plan && !plan.enabled) ? (
                                <p className="text-sm text-zinc-500">
                                    {t("unavailable")}
                                </p>
                            ) : (
                                <p className="text-sm text-zinc-500">
                                    {t("loadingPlan")}
                                </p>
                            )}
                        </div>

                        <ul className="mt-5 space-y-2">
                            {features.map((feature) => (
                                <li
                                    key={feature}
                                    className="flex items-start gap-2 text-sm text-zinc-300"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="mt-0.5 text-[#F55376]"
                                    >
                                        ✓
                                    </span>

                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={handleSubscribe}
                            disabled={busy !== null || !selectedPrice}
                            className="mt-6 w-full border border-[#F55376] bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {busy === "checkout"
                                ? t("redirecting")
                                : trialDays > 0
                                  ? t("startTrial", { days: trialDays })
                                  : t("subscribe")}
                        </button>

                        <p className="mt-3 text-center text-[11px] text-zinc-600">
                            {t("securePayment")}
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}

export default function BillingPage() {
    return (
        <AuthGuard>
            <Suspense fallback={null}>
                <BillingContent />
            </Suspense>
        </AuthGuard>
    );
}
