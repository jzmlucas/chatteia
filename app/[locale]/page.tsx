"use client";

import { useTranslations } from "next-intl";

import { HomeChatForm } from "@/components/home/HomeChatForm";
import { SettingsMenu } from "@/components/home/SettingsMenu";

import { useHomeForm } from "@/hooks/home/useHomeForm";

export default function HomePage() {
    const t = useTranslations("home");

    const {
        platform,
        channel,
        setChannel,
        secondPlatform,
        secondChannel,
        setSecondChannel,
        multi,
        setMulti,
        error,
        channelPlaceholder,
        secondChannelPlaceholder,
        handleSubmit,
        handlePlatformChange,
    } = useHomeForm();

    return (
        <>
            <main className="flex min-h-screen items-center justify-center px-4 py-8">
                <div className="w-full max-w-6xl">
                    <section className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
                        <div className="mb-8 flex flex-col items-center gap-3">
                            <img
                                width="96"
                                height="96"
                                src="https://img.icons8.com/color-glass/96/parrot.png"
                                alt=""
                                aria-hidden="true"
                                draggable="false"
                            />

                            <h1 className="text-3xl font-bold tracking-tight">
                                Chatteia
                            </h1>
                        </div>

                        <p className="mb-8 max-w-md text-zinc-300">
                            {t("subtitle")}
                        </p>

                        <HomeChatForm
                            platform={platform}
                            channel={channel}
                            onChannelChange={setChannel}
                            secondPlatform={secondPlatform}
                            secondChannel={secondChannel}
                            onSecondChannelChange={setSecondChannel}
                            multi={multi}
                            onMultiChange={setMulti}
                            error={error}
                            channelPlaceholder={channelPlaceholder}
                            secondChannelPlaceholder={secondChannelPlaceholder}
                            onSubmit={handleSubmit}
                            onPlatformChange={handlePlatformChange}
                        />

                        <p className="mt-6 text-sm text-zinc-500">
                            {t("footer")}
                        </p>
                    </section>
                </div>
            </main>

            <SettingsMenu />
        </>
    );
}