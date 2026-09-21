"use client";

import { useTranslations } from "next-intl";

import { ResendConfirmationEmail } from "@/components/auth/ResendConfirmationEmail";
import { useLoginForm } from "@/hooks/auth/useLoginForm";
import { Link } from "@/i18n/navigation";

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
            className="w-full max-w-sm border border-twitch-border bg-twitch-panel p-6 shadow-2xl"
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
                    className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="email@email.com"
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
                    className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <p className="mb-4 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                    {error}
                </p>
            )}

            {needsResend && (
                <ResendConfirmationEmail email={email} />
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t("loading")}
                    </>
                ) : (
                    t("loginSubmit")
                )}
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
