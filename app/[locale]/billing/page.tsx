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

function SuccessIcon() {
    return (
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[#F55376]/10" />

            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#F55376]/30 bg-[#F55376]/10">
                <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M5 12.5L9.5 17L19 7.5"
                        stroke="#F55376"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
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

    /*
     * Voltou do Stripe.
     *
     * O webhook pode levar alguns segundos para atualizar
     * a assinatura no banco. Por isso continuamos consultando
     * o perfil até a assinatura aparecer.
     */
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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = (await response.json().catch(() => ({}))) as {
                url?: string;
                error?: string;
            };

            if (response.ok && data.url) {
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

    /*
     * ============================================================
     * CHECKOUT SUCCESS
     * ============================================================
     *
     * Essa tela aparece somente quando:
     *
     * ?checkout=success
     *
     * e o webhook já confirmou a assinatura.
     */
    if (
        checkoutParam === "success" &&
        !waiting &&
        subscribed &&
        subscription
    ) {
        return (
            <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-8">
                {/* Glow decorativo */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#F55376]/10 blur-[120px]"
                />

                <div className="relative z-10 w-full max-w-xl">
                    <HomeLogoLink />

                    <div className="mt-14 overflow-hidden border border-twitch-border bg-twitch-panel shadow-2xl shadow-black/30">
                        {/* Top accent */}
                        <div className="h-1 w-full bg-[#F55376]" />

                        <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
                            <SuccessIcon />

                            <div className="mt-6">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F55376]">
                                    {t("checkoutSuccessEyebrow")}
                                </p>

                                <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
                                    {t("checkoutSuccessTitle")}
                                </h1>

                                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-400">
                                    {t("checkoutSuccessDescription")}
                                </p>
                            </div>

                            {/* Subscription summary */}
                            <div className="mt-8 border border-twitch-border bg-zinc-950/50 p-5 text-left">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                                            {t("checkoutSuccessPlanLabel")}
                                        </p>

                                        <p className="mt-1 text-base font-semibold text-zinc-100">
                                            {t("planName")}
                                        </p>
                                    </div>

                                    <span className="inline-flex items-center gap-1.5 bg-[#F55376]/10 px-2.5 py-1 text-[11px] font-medium text-[#F55376]">
                                        <span
                                            aria-hidden="true"
                                            className="h-1.5 w-1.5 rounded-full bg-[#F55376]"
                                        />
                                        {statusLabel(subscription.status)}
                                    </span>
                                </div>

                                {subscription.status === "trialing" &&
                                    subscription.trialEnd && (
                                        <div className="mt-5 border-t border-zinc-800 pt-4">
                                            <p className="text-xs text-zinc-500">
                                                {t("trialEndsOn", {
                                                    date: formatDate(
                                                        subscription.trialEnd,
                                                        intlLocale
                                                    ),
                                                })}
                                            </p>
                                        </div>
                                    )}

                                {subscription.currentPeriodEnd &&
                                    subscription.status !== "trialing" && (
                                        <div className="mt-5 border-t border-zinc-800 pt-4">
                                            <p className="text-xs text-zinc-500">
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
                                        </div>
                                    )}
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-3">
                                {!isStreamerMode ? (
                                    <button
                                        type="button"
                                        onClick={handleActivate}
                                        disabled={busy !== null}
                                        className="flex w-full items-center justify-center gap-2 border border-[#F55376] bg-[#F55376] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ff6685] hover:shadow-lg hover:shadow-[#F55376]/10 disabled:cursor-wait disabled:opacity-60"
                                    >
                                        {busy === "activate" ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                {t("activating")}
                                            </>
                                        ) : (
                                            t("activateMode")
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        href="/profile"
                                        className="block w-full border border-[#F55376] bg-[#F55376] px-5 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-[#ff6685] hover:shadow-lg hover:shadow-[#F55376]/10"
                                    >
                                        {t("goToHub")}
                                    </Link>
                                )}

                                {subscription.provider === "stripe" && (
                                    <button
                                        type="button"
                                        onClick={handleManage}
                                        disabled={busy !== null}
                                        className="w-full border border-twitch-border px-5 py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-wait disabled:opacity-60"
                                    >
                                        {busy === "portal"
                                            ? t("redirecting")
                                            : t("manage")}
                                    </button>
                                )}
                            </div>

                            <p className="mt-7 text-[11px] leading-5 text-zinc-600">
                                {t("checkoutSuccessFooter")}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 text-center">
                        <Link
                            href="/account"
                            className="text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                        >
                            {t("back")}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    /*
     * ============================================================
     * CHECKOUT PROCESSANDO
     * ============================================================
     */

    if (checkoutParam === "success" && waiting && !subscribed) {
        return (
            <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F55376]/5 blur-[110px]"
                />

                <div className="relative w-full max-w-md text-center">
                    <HomeLogoLink />

                    <div className="mt-16 border border-twitch-border bg-twitch-panel p-8 shadow-2xl">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#F55376]/20 bg-[#F55376]/5">
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-[#F55376]" />
                        </div>

                        <h1 className="mt-7 text-2xl font-bold text-zinc-100">
                            {t("checkoutProcessingTitle")}
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                            {t("checkoutProcessing")}
                        </p>

                        <div className="mt-6 h-1 overflow-hidden bg-zinc-900">
                            <div className="h-full w-1/2 animate-pulse bg-[#F55376]" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

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

                <p className="mt-1 text-sm text-zinc-500">
                    {t("subtitle")}
                </p>
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

                {checkoutParam === "success" &&
                    !waiting &&
                    !subscribed && (
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
                                    {formatPrice(
                                        selectedPrice,
                                        intlLocale
                                    )}
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
