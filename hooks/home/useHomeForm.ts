import { FormEvent, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { normalizeChannel, type Platform } from "@/lib/chat/normalizeChannel";

export function useHomeForm() {
    const router = useRouter();

    const t = useTranslations("home");

    const [platform, setPlatform] = useState<Platform>("twitch");
    const [channel, setChannel] = useState("");
    const [secondPlatform, setSecondPlatform] = useState<Platform>("kick");
    const [secondChannel, setSecondChannel] = useState("");
    const [multi, setMulti] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const first = normalizeChannel(platform, channel);

        if (!first) {
            setError(
                t(
                    platform === "youtube"
                        ? "errorInvalidYouTubeChannel"
                        : "errorInvalidChannel"
                )
            );

            return;
        }

        if (!multi) {
            setError(null);

            if (platform === "kick") {
                router.push(`/chat/kick/${first}`);

                return;
            }

            if (platform === "youtube") {
                router.push(`/chat/youtube/${first}`);

                return;
            }

            router.push(`/chat/twitch/${first}`);

            return;
        }

        const second = normalizeChannel(secondPlatform, secondChannel);

        if (!second) {
            setError(
                t(
                    secondPlatform === "youtube"
                        ? "errorInvalidSecondYouTubeChannel"
                        : "errorSecondChannel"
                )
            );

            return;
        }

        if (platform === secondPlatform && first === second) {
            setError(t("errorSameChannels"));

            return;
        }

        setError(null);

        const channels = [
            `${platform}:${first}`,
            `${secondPlatform}:${second}`,
        ];

        router.push(
            `/chat/multi-chat?channels=${encodeURIComponent(channels.join(","))}`
        );
    }

    function handlePlatformChange(value: Platform, second = false) {
        if (second) {
            setSecondPlatform(value);
            setSecondChannel("");
        } else {
            setPlatform(value);
            setChannel("");
        }

        setError(null);
    }

    const channelPlaceholder =
        platform === "youtube"
            ? t("youtubeChannelPlaceholder")
            : platform === "kick"
                ? t("kickChannelPlaceholder")
                : t("twitchChannelPlaceholder");

    const secondChannelPlaceholder =
        secondPlatform === "youtube"
            ? t("youtubeChannelPlaceholder")
            : secondPlatform === "kick"
                ? t("kickChannelPlaceholder")
                : t("twitchChannelPlaceholder");

    return {
        platform,
        channel,
        setChannel,
        secondPlatform,
        secondChannel,
        setSecondChannel,
        multi,
        setMulti,
        error,
        setError,
        channelPlaceholder,
        secondChannelPlaceholder,
        handleSubmit,
        handlePlatformChange,
    };
}