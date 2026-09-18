"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useLocale,
    useTranslations,
} from "next-intl";

import {
    usePathname,
    useRouter,
} from "@/i18n/navigation";

import {
    locales,
    localeFlags,
    localeLabels,
    type AppLocale,
} from "@/i18n/config";

export function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale() as AppLocale;
    const t = useTranslations("languageSwitcher");

    const [open, setOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    function handleLocaleChange(locale: AppLocale) {
        setOpen(false);

        router.replace(pathname, {
            locale,
        });
    }

    return (
        <div
            ref={containerRef}
            className="
                fixed
                top-3
                left-3
                z-[100]
                sm:top-5
                sm:left-5
            "
        >
            {open && (
                <div
                    role="listbox"
                    aria-label={t("label")}
                    className="
                        absolute
                        top-[calc(100%+8px)]
                        left-0
                        w-[min(calc(100vw-1.5rem),200px)]
                        overflow-hidden
                        rounded-lg
                        border
                        border-twitch-border
                        bg-twitch-panel
                        py-1
                        shadow-2xl
                    "
                >
                    {locales.map((locale) => {
                        const isSelected = locale === currentLocale;

                        return (
                            <button
                                key={locale}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() =>
                                    handleLocaleChange(locale)
                                }
                                className={`
                                    flex
                                    w-full
                                    items-center
                                    gap-2
                                    whitespace-nowrap
                                    px-3
                                    py-2.5
                                    text-left
                                    text-sm
                                    transition-colors
                                    hover:bg-zinc-800
                                    sm:py-2
                                    ${
                                    isSelected
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-300"
                                }
                                `}
                            >
                                <span className="text-base leading-none">
                                    {localeFlags[locale]}
                                </span>

                                <span className="truncate">
                                    {localeLabels[locale]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={t("srLabel")}
                className="
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-twitch-border
                    bg-twitch-panel
                    px-3
                    py-2.5
                    text-sm
                    text-zinc-100
                    shadow-lg
                    outline-none
                    transition-colors
                    hover:border-zinc-500
                    focus-visible:border-[#F55376]
                    focus-visible:ring-2
                    focus-visible:ring-[#F55376]
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-black
                    sm:py-2
                "
            >
                <span className="text-base leading-none">
                    {localeFlags[currentLocale]}
                </span>

                <span className="max-w-[80px] truncate sm:max-w-none">
                    {localeLabels[currentLocale]}
                </span>

                <span
                    aria-hidden="true"
                    className={`
                        ml-1
                        text-xs
                        text-zinc-400
                        transition-transform
                        ${open ? "rotate-180" : ""}
                    `}
                >
                    ▼
                </span>
            </button>
        </div>
    );
}