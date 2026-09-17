import type { FeedMessage } from "@/components/chat/ChatFeed";

export const CHANNEL_COLORS = ["#9146FF", "#53FC18", "#FF0000", "#00D4FF"];

export type MultiPlatform = "twitch" | "kick" | "youtube";

export type Connection = {
    status: string;
    statusDetail?: string;
    messages: FeedMessage[];
};

export function prepareChannelInput(
    platform: MultiPlatform,
    value: string
): string {
    const input = value.trim();

    if (!input) {
        return "";
    }

    if (platform === "twitch") {
        if (input.startsWith("@")) {
            return "";
        }

        return `twitch:${input}`;
    }

    if (platform === "kick") {
        if (input.startsWith("@")) {
            return "";
        }

        return `kick:${input}`;
    }

    return `youtube:${input}`;
}