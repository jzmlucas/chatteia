import type { UnifiedChatMessage } from "@/lib/chat/types";

export type KickUser = {
  user_id: number;
  username: string;
  is_moderator?: boolean;
  is_subscriber?: boolean;
};

export type KickChannel = {
  broadcaster_user_id: number;
  slug: string;
  user_id?: number;
  username?: string;
};

export type KickIdentityBadge = {
  text: string;
  type: string;
  count?: number;
};

export type KickChatMessage = {
  message_id: string;
  replies_to?: unknown;
  broadcaster: {
    user_id: number;
    username: string;
    channel_slug?: string;
  };
  sender: {
    user_id: number;
    username: string;
    identity?: {
      username_color?: string;
      badges?: KickIdentityBadge[];
    } | null;
  };
  content: string;
  emotes?: Array<{
    emote_id: string;
    positions: Array<{
      s: number;
      e: number;
    }>;
    name?: string;
  }>;
  created_at?: string;
};

export type KickSubscription = {
  id: string;
  name: string;
  version: number;
  broadcaster_user_id: number;
  method: string;
};

export type KickSubscriptionsResponse = {
  data: KickSubscription[];
  pagination?: {
    cursor?: string;
  };
};

export type KickChatMessageResult = {
  message: UnifiedChatMessage;
  broadcasterUserId: string;
};
