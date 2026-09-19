"use client";

import { useRouter } from "next/navigation";

import { useTranslations } from "next-intl";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { HomeLogoLink } from "@/components/layout/HomeLogoLink";
import { useAuth } from "@/contexts/AuthContext";

function AccountContent() {
    const t = useTranslations("auth");
    const tp = useTranslations("profile");

    const {
        activeMode,
        isStreamer,
    } = useAuth();

    const router = useRouter();

    const isStreamerMode =
        isStreamer &&
        activeMode === "streamer";

    const title =
        isStreamerMode
            ? tp("hubTitle")
            : t("myAccount");

    const description =
        isStreamerMode
            ? tp("accountPageDescriptionStreamer")
            : tp("accountPageDescriptionUser");

    function handleBack() {
        router.back();
    }

    return (
        <main className="flex min-h-screen flex-col items-center px-4 py-8">
            <HomeLogoLink />

            <div className="mb-5 w-full max-w-lg">
                <button
                    type="button"
                    onClick={handleBack}
                    className="mb-5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                    {isStreamerMode
                        ? tp("backToHub")
                        : tp("backGeneric")}
                </button>

                <h1 className="text-xl font-bold text-zinc-100">
                    {title}
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                    {description}
                </p>
            </div>

            <AccountPanel />
        </main>
    );
}

export default function AccountPage() {
    return (
        <AuthGuard>
            <AccountContent />
        </AuthGuard>
    );
}