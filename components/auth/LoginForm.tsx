"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { ResendConfirmationEmail } from "@/components/auth/ResendConfirmationEmail";

export function LoginForm() {
    const t = useTranslations("auth");

    const {
        email,
        setEmail,
        password,
        setPassword,
        error,
        loading,
        needsResend,
        handleSubmit,
    } = useLoginForm();

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-xl border border-twitch-border bg-twitch-panel p-6 shadow-2xl"
        >
            <h1 className="mb-1 text-xl font-bold text-zinc-100">
                {t("loginTitle")}
            </h1>

            <p className="mb-6 text-sm text-zinc-400">
                {t("loginSubtitle")}
            </p>

            <div className="mb-4 flex flex-col gap-1.5">
                <label
                    htmlFor="email"
                    className="text-xs font-medium text-zinc-400"
                >
                    {t("emailLabel")}
                </label>

                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    className="rounded-lg border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="voce@email.com"
                />
            </div>

            <div className="mb-2 flex flex-col gap-1.5">
                <label
                    htmlFor="password"
                    className="text-xs font-medium text-zinc-400"
                >
                    {t("passwordLabel")}
                </label>

                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    className="rounded-lg border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <p className="mb-4 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
                    {error}
                </p>
            )}

            {needsResend && (
                <ResendConfirmationEmail email={email} />
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-lg bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
                {loading ? t("loading") : t("loginSubmit")}
            </button>

            <p className="mt-5 text-center text-sm text-zinc-400">
                {t("noAccount")}{" "}
                <Link
                    href="/register"
                    className="font-medium text-[#F55376] hover:underline"
                >
                    {t("registerLink")}
                </Link>
            </p>
        </form>
    );
}
