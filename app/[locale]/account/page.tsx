"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AccountPanel } from "@/components/auth/AccountPanel";
import { HomeLogoLink } from "@/components/layout/HomeLogoLink";

export default function AccountPage() {
    return (
        <AuthGuard>
            <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
                <HomeLogoLink />

                <AccountPanel />
            </main>
        </AuthGuard>
    );
}
