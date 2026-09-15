export const locales = [
    "pt-br",
    "en",
    "es",
    "ru",
] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "pt-br";

export const localeLabels: Record<AppLocale, string> = {
    "pt-br": "Português (Brasil)",
    en: "English",
    es: "Español",
    ru: "Русский",
};

export const localeFlags: Record<AppLocale, string> = {
    "pt-br": "🇧🇷",
    en: "🇺🇸",
    es: "🇪🇸",
    ru: "🇷🇺",
};

export const intlLocaleMap: Record<AppLocale, string> = {
    "pt-br": "pt-BR",
    en: "en-US",
    es: "es-ES",
    ru: "ru-RU",
};

export function isAppLocale(
    value: string
): value is AppLocale {
    return (locales as readonly string[]).includes(value);
}