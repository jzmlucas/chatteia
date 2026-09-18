"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeLabels, localeFlags, type AppLocale } from "@/i18n/config";

export function LanguageSwitcher() {
    const t = useTranslations("languageSwitcher");
    const currentLocale = useLocale() as AppLocale;
    const pathname = usePathname();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleSelect(locale: AppLocale) {
        setOpen(false);
        // Troca só o idioma, mantendo a rota atual (home, chat, multi-chat…)
        router.replace(pathname, { locale });
    }

    return (
        <div ref={containerRef} className="relative inline-block text-left">
    <button
        type="button"
    onClick={() => setOpen((prev) => !prev)}
    title={t("srLabel")}
    aria-label={t("srLabel")}
    aria-haspopup="listbox"
    aria-expanded={open}
    className="flex items-center gap-1.5 rounded-lg border border-twitch-border bg-twitch-panel px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-[#F55376]"
    >
    <span aria-hidden="true">{localeFlags[currentLocale]}</span>
        <span className="hidden sm:inline">{localeLabels[currentLocale]}</span>
        <span aria-hidden="true" className="text-zinc-500">▾</span>
    </button>

    {open && (
        <ul
            role="listbox"
        className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-twitch-border bg-twitch-panel shadow-lg"
            >
            {locales.map((locale) => (
                    <li key={locale}>
                    <button
                        type="button"
                role="option"
                aria-selected={locale === currentLocale}
        onClick={() => handleSelect(locale)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-twitch-dark ${
            locale === currentLocale
                ? "text-[#F55376] font-semibold"
                : "text-zinc-200"
        }`}
    >
        <span aria-hidden="true">{localeFlags[locale]}</span>
        {localeLabels[locale]}
        </button>
        </li>
    ))}
        </ul>
    )}
    </div>
);
}