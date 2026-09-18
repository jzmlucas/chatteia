"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { HomeLogoLink } from "@/components/layout/HomeLogoLink";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <HomeLogoLink />

            <LoginForm />
        </main>
    );
}
