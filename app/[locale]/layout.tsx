import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { locales, isAppLocale, type AppLocale } from "@/i18n/config";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalHeader } from "@/components/layout/GlobalHeader";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
                                         params,
                                       }: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [
        { url: "/chatteia16.png", sizes: "16x16", type: "image/png" },
        { url: "/chatteia32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/chatteia.png",
    },
  };
}

export default async function LocaleLayout({
                                             children,
                                             params,
                                           }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isAppLocale(rawLocale)) {
    notFound();
  }

  const locale: AppLocale = rawLocale;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <GlobalHeader />
        {children}
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
