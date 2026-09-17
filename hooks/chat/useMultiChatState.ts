import { FormEvent, useMemo, useState } from "react";

import { useParams, useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

import { useTwitchMultiChat } from "@/hooks/platforms/twitch/useTwitchMultiChat";
import { useKickMultiChat } from "@/hooks/platforms/kick/useKickMultiChat";
import { useYouTubeMultiChat } from "@/hooks/platforms/youtube/useYouTubeMultiChat";

import type { FeedMessage } from "@/components/chat/ChatFeed";

import {
    normalizeChatTarget,
    targetKey,
    type ChatTarget,
} from "@/lib/chat/targets";

import {
    CHANNEL_COLORS,
    prepareChannelInput,
    type Connection,
    type MultiPlatform,
} from "@/lib/chat/multiChat";

export function useMultiChatState() {
    const router = useRouter();

    const params = useParams<{ locale: string }>();

    const searchParams = useSearchParams();

    const t = useTranslations("multiChat");

    const locale = params.locale || "pt-br";

    const [filter, setFilter] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [platform, setPlatform] = useState<MultiPlatform>("twitch");
    const [newChannel, setNewChannel] = useState("");
    const [addError, setAddError] = useState("");

    const targets = useMemo<ChatTarget[]>(() => {
        const raw = searchParams.get("channels") ?? "";

        if (!raw) {
            return [];
        }

        return raw
            .split(",")
            .map(normalizeChatTarget)
            .filter((target): target is ChatTarget => target !== null)
            .filter(
                (target, index, all) =>
                    all.findIndex(
                        (item) => targetKey(item) === targetKey(target)
                    ) === index
            )
            .slice(0, 4);
    }, [searchParams]);

    const twitchChannels = useMemo(
        () =>
            targets
                .filter((target) => target.platform === "twitch")
                .map((target) => target.channel),
        [targets]
    );

    const kickChannels = useMemo(
        () =>
            targets
                .filter((target) => target.platform === "kick")
                .map((target) => target.channel),
        [targets]
    );

    const youtubeChannels = useMemo(
        () =>
            targets
                .filter((target) => target.platform === "youtube")
                .map((target) => target.channel),
        [targets]
    );

    const twitch = useTwitchMultiChat(twitchChannels);
    const kick = useKickMultiChat(kickChannels);
    const youtube = useYouTubeMultiChat(youtubeChannels);

    const connectionMap = useMemo<Record<string, Connection>>(() => {
        const result: Record<string, Connection> = {};

        for (const target of targets) {
            const key = targetKey(target);

            let connection: Connection | undefined;

            if (target.platform === "twitch") {
                connection = twitch.connections[target.channel];
            } else if (target.platform === "kick") {
                connection = kick.connections[target.channel];
            } else {
                connection = youtube.connections[target.channel];
            }

            result[key] = {
                status: connection?.status ?? "idle",
                statusDetail: connection?.statusDetail,
                messages: connection?.messages ?? [],
            };
        }

        return result;
    }, [targets, twitch.connections, kick.connections, youtube.connections]);

    const feedMessages = useMemo<FeedMessage[]>(() => {
        const all: FeedMessage[] = [];

        targets.forEach((target, index) => {
            const connection = connectionMap[targetKey(target)];

            const platformLabel =
                target.platform === "twitch"
                    ? "TWITCH"
                    : target.platform === "kick"
                        ? "KICK"
                        : "YOUTUBE";

            const label = `${platformLabel} · ${target.channel}`;

            for (const message of connection?.messages ?? []) {
                if (filter) {
                    const search = filter.trim().toLowerCase();

                    if (
                        !message.message.toLowerCase().includes(search) &&
                        !message.displayName.toLowerCase().includes(search)
                    ) {
                        continue;
                    }
                }

                all.push({
                    ...message,
                    channelLabel: label,
                    channelColor:
                        CHANNEL_COLORS[index % CHANNEL_COLORS.length],
                });
            }
        });

        return all.sort((a, b) => a.timestamp - b.timestamp);
    }, [targets, connectionMap, filter]);

    function updateUrl(nextTargets: ChatTarget[]) {
        if (nextTargets.length === 0) {
            router.push("/");

            return;
        }

        const channels = nextTargets.map(targetKey).join(",");

        router.replace(
            `/chat/multi-chat?channels=${encodeURIComponent(channels)}`
        );
    }

    function addChannel(event: FormEvent) {
        event.preventDefault();

        setAddError("");

        if (!newChannel.trim()) {
            return;
        }

        const prepared = prepareChannelInput(platform, newChannel);

        if (!prepared) {
            setAddError(
                platform === "youtube"
                    ? t("errorInvalidYouTubeInput")
                    : t("errorAtNotAllowed")
            );

            return;
        }

        const target = normalizeChatTarget(prepared);

        if (!target) {
            setAddError(
                platform === "youtube"
                    ? t("errorInvalidYouTubeChannel")
                    : platform === "twitch"
                        ? t("errorInvalidTwitchChannel")
                        : t("errorInvalidKickChannel")
            );

            return;
        }

        if (
            targets.some((item) => targetKey(item) === targetKey(target))
        ) {
            setAddError(t("errorDuplicateChannel"));

            return;
        }

        if (targets.length >= 4) {
            setAddError(t("errorMaxChannels"));

            return;
        }

        updateUrl([...targets, target]);

        setNewChannel("");
        setAddError("");
        setShowAdd(false);
    }

    function removeTarget(target: ChatTarget) {
        const next = targets.filter(
            (item) => targetKey(item) !== targetKey(target)
        );

        if (next.length === 1) {
            const remaining = next[0];

            if (remaining.platform === "kick") {
                router.push(`/chat/kick/${remaining.channel}`);

                return;
            }

            if (remaining.platform === "youtube") {
                router.push(`/chat/youtube/${remaining.channel}`);

                return;
            }

            router.push(`/chat/twitch/${remaining.channel}`);

            return;
        }

        updateUrl(next);
    }

    function handlePlatformChange(value: MultiPlatform) {
        setPlatform(value);
        setNewChannel("");
        setAddError("");
    }

    const connectedCount = targets.filter(
        (target) => connectionMap[targetKey(target)]?.status === "connected"
    ).length;

    const obsChannels = targets.map(targetKey).join(",");

    const obsUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/${locale}/obs/multi-chat?channels=${encodeURIComponent(obsChannels)}`
            : `/${locale}/obs/multi-chat?channels=${encodeURIComponent(obsChannels)}`;

    const channelPlaceholder =
        platform === "youtube"
            ? t("youtubeChannelPlaceholder")
            : platform === "twitch"
                ? t("twitchChannelPlaceholder")
                : t("kickChannelPlaceholder");

    return {
        locale,
        targets,
        filter,
        setFilter,
        showAdd,
        setShowAdd,
        platform,
        newChannel,
        setNewChannel,
        addError,
        setAddError,
        feedMessages,
        connectedCount,
        obsUrl,
        channelPlaceholder,
        addChannel,
        removeTarget,
        handlePlatformChange,
    };
}