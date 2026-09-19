"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useRegisterForm } from "@/hooks/auth/useRegisterForm";

export function RegisterForm() {
    const t = useTranslations("auth");

    const {
        accountType,
        setAccountType,
        username,
        setUsername,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        error,
        loading,
        handleSubmit,
    } = useRegisterForm();

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm border border-twitch-border bg-twitch-panel p-6 shadow-2xl"
        >
            <h1 className="mb-1 text-xl font-bold text-zinc-100">
                {t("registerTitle")}
            </h1>

            <p className="mb-6 text-sm text-zinc-400">
                {t("registerSubtitle")}
            </p>

            <div className="mb-4 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-400">
                    {t("accountTypeLabel")}
                </span>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setAccountType("user")}
                        className={`border px-3 py-2.5 text-sm transition-colors ${accountType === "user"
                                ? "border-[#F55376] bg-[#F55376]/10 text-white"
                                : "border-twitch-border text-zinc-400"
                            }`}
                    >
                        {t("accountTypeUser")}
                    </button>

                    <button
                        type="button"
                        onClick={() => setAccountType("streamer")}
                        className={`border px-3 py-2.5 text-sm transition-colors ${accountType === "streamer"
                                ? "border-[#F55376] bg-[#F55376]/10 text-white"
                                : "border-twitch-border text-zinc-400"
                            }`}
                    >
                        {t("accountTypeStreamer")}
                    </button>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
                <label
                    htmlFor="username"
                    className="text-xs font-medium text-zinc-400"
                >
                    {t("usernameLabel")}
                </label>

                <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="nick"
                />

                <span className="text-[11px] text-zinc-500">
                    {t("usernameHint")}
                </span>
            </div>

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
                    onChange={(event) => setEmail(event.target.value)}
                    className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="email@email.com"
                />
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
                <label
                    htmlFor="password"
                    className="text-xs font-medium text-zinc-400"
                >
                    {t("passwordLabel")}
                </label>

                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="••••••••"
                />
            </div>

            <div className="mb-2 flex flex-col gap-1.5">
                <label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium text-zinc-400"
                >
                    {t("confirmPasswordLabel")}
                </label>

                <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                        setConfirmPassword(event.target.value)
                    }
                    className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    placeholder="••••••••"
                />
            </div>

            {error && (
                <p className="mb-4 mt-2 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? t("loading") : t("registerSubmit")}
            </button>

            <p className="mt-5 text-center text-sm text-zinc-400">
                {t("hasAccount")}{" "}
                <Link
                    href="/login"
                    className="font-medium text-[#F55376] hover:underline"
                >
                    {t("loginLink")}
                </Link>
            </p>
        </form>
    );
}