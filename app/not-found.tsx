"use client";

import { useEffect } from "react";

export default function NotFound() {
useEffect(() => {
document.title = "404 — Chatteia";
}, []);

return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
        {/* Background glow */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-[120px]"
        />

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
            {/* Logo */}
            <Link
                href="/"
                className="mb-12 text-3xl font-semibold tracking-tight transition-opacity hover:opacity-80"
            >
                Chatteia
            </Link>

            {/* 404 */}
            <div
                aria-hidden="true"
                className="select-none text-[clamp(7rem,25vw,13rem)] font-black leading-none tracking-[-0.08em] text-foreground/10"
            >
                404
            </div>

            {/* Content */}
            <div className="-mt-10">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Página não encontrada
                </h1>

                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                    Parece que você tentou acessar um endereço que não
                    existe ou que foi movido para outro lugar.
                </p>

                {/* Action */}
                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-pink-500 px-6 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition-all duration-200 hover:bg-pink-400 hover:shadow-pink-500/30 active:scale-[0.98]"
                    >
                        Voltar para o início
                    </Link>
                </div>
            </div>

            {/* Small footer */}
            <p className="mt-16 text-xs text-muted-foreground/60">
                Chatteia
            </p>
        </div>
    </main>
);
}
