export type YouTubeChannel = {
    id: string;
    title: string;
    handle: string | null;
};

export type YouTubeLive = {
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    liveChatId: string;
};

export type YouTubeChatMessage = {
    id: string;
    snippet: {
        type: string;
        liveChatId: string;
        authorChannelId?: string;
        publishedAt: string;
        displayMessage?: string;
        textMessageDetails?: {
            messageText?: string;
        };
        superChatDetails?: {
            amountDisplayString?: string;
            userComment?: string;
        };
    };
    authorDetails?: {
        channelId?: string;
        channelUrl?: string;
        displayName?: string;
        profileImageUrl?: string;
        isVerified?: boolean;
        isChatOwner?: boolean;
        isChatSponsor?: boolean;
        isChatModerator?: boolean;
    };
};

export type YouTubeChatResponse = {
    nextPageToken?: string;
    pollingIntervalMillis?: number;
    items: YouTubeChatMessage[];
};