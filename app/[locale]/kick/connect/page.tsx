"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function KickConnectPage() {
  const t = useTranslations("kickConnect");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const success = searchParams.get("success") === "1";
  const channel = searchParams.get("channel");
  const error = searchParams.get("error");
  const subscriptionError = searchParams.get("subscriptionError");

  const authorizeUrl =
      `/api/platforms/kick/auth/authorize?locale=${encodeURIComponent(locale)}`;

  return (
      <main className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-twitch-border bg-twitch-panel p-6 shadow-2xl">
          <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white"
          >
            {t("back")}
          </Link>

          <h1 className="mt-3 text-2xl font-bold">
            {t("title")}
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {t("description")}
          </p>

          {success && channel ? (
              <div className="mt-6 text-green-300">

                {subscriptionError ? (
                    <p className="mt-2 text-sm text-yellow-300">
                      {t("success.subscriptionError", {
                        error: subscriptionError,
                      })}
                    </p>
                ) : (
                    <p className="mt-2 text-sm">
                      {t("success.subscriptionCreated")}
                    </p>
                )}
              </div>
          ) : (
              <a
                  href={authorizeUrl}
                  className="mt-6 inline-flex rounded-lg bg-green-500 px-5 py-3 font-semibold text-black hover:bg-green-400"
              >
                {t("authorize")}
              </a>
          )}

          {error && (
              <div className="mt-6 text-red-300">
                {error}
              </div>
          )}
        </div>
      </main>
  );
}