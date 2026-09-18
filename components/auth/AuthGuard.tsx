"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

type AuthGuardProps = {
    children: React.ReactNode;
    requireStreamer?: boolean;
};

export function AuthGuard({
                               children,
                               requireStreamer = false,
                           }: AuthGuardProps) {
    const t = useTranslations("auth");

    const router = useRouter();

    const { user, profile, loading, isStreamer } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");

            return;
        }

        if (requireStreamer && profile && !isStreamer) {
            router.replace("/account");
        }
    }, [loading, user, profile, isStreamer, requireStreamer, router]);

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-zinc-400">
                    {t("loading")}
                </p>
            </div>
        );
    }

    if (requireStreamer && !isStreamer) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-zinc-400">
                    {t("loading")}
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
