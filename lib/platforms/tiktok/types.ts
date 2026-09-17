export type TikTokChatEvent = {
    uniqueId: string;
    nickname: string;
    userId?: string;
    comment: string;
    profilePictureUrl?: string;
    followRole?: number;
    isModerator?: boolean;
    isSubscriber?: boolean;
};

export type TikTokWebhookPayload = {
    channel: string;
    event: TikTokChatEvent;
};