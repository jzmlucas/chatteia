"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { HomeLogoLink } from "@/components/layout/HomeLogoLink";

export default function RegisterPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <HomeLogoLink />

            <RegisterForm />
        </main>
    );
}
