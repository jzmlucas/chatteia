import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

import type {
    YouTubeChatMessage,
} from "./types";

export function normalizeYouTubeMessage(
    message: YouTubeChatMessage,
    channel: string,
    channelId: string
): UnifiedChatMessage | null {
    const snippet =
        message.snippet;

    if (
        snippet.type !==
        "textMessageEvent" &&
        snippet.type !==
        "superChatEvent"
    ) {
        return null;
    }

    const text =
        snippet
            .textMessageDetails
            ?.messageText ??
        snippet
            .superChatDetails
            ?.userComment ??
        snippet.displayMessage ??
        "";

    if (!text) {
        return null;
    }

    const author =
        message.authorDetails;

    const badges = [];

    if (
        author?.isChatOwner
    ) {
        badges.push({
            id: "owner",
            imageUrl:
                "https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg",
            name: "Owner",
            description:
                "Channel owner",
        });
    }

    if (
        author?.isChatModerator
    ) {
        badges.push({
            id: "moderator",
            imageUrl:
                "https://www.gstatic.com/youtube/img/branding/youtube/svg/youtube_icon.svg",
            name: "Moderator",
            description:
                "Moderator",
        });
    }

    if (
        author?.isChatSponsor
    ) {
        badges.push({
            id: "member",
            imageUrl:
                "https://www.gstatic.com/youtube/img/branding/youtube/svg/youtube_icon.svg",
            name: "Member",
            description:
                "Channel member",
        });
    }

    return {
        id:
        message.id,
        platform:
            "youtube",
        channel,
        channelId,
        username:
            author?.displayName ??
            "YouTube User",
        displayName:
            author?.displayName ??
            "YouTube User",
        color:
            "",
        message:
        text,
        badges,
        emotes: [],
        isAction:
            false,
        timestamp:
            new Date(
                snippet.publishedAt
            ).getTime(),
    };
}