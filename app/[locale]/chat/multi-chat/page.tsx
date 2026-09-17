"use client";

import { useTranslations } from "next-intl";

import { ChatFeed } from "@/components/chat/ChatFeed";
import { MultiChatHeader } from "@/components/chat/MultiChatHeader";

import { useMultiChatState } from "@/hooks/chat/useMultiChatState";

export default function MultiChatPage() {
    const t = useTranslations("multiChat");

    const {
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
    } = useMultiChatState();

    return (
        <main className="h-dvh flex flex-col overflow-hidden">
            <MultiChatHeader
                targets={targets}
                connectedCount={connectedCount}
                obsUrl={obsUrl}
                filter={filter}
                onFilterChange={setFilter}
                showAdd={showAdd}
                onToggleShowAdd={() => {
                    setShowAdd((value) => !value);
                    setAddError("");
                }}
                platform={platform}
                onPlatformChange={handlePlatformChange}
                newChannel={newChannel}
                onNewChannelChange={(value) => {
                    setNewChannel(value);

                    if (addError) {
                        setAddError("");
                    }
                }}
                addError={addError}
                channelPlaceholder={channelPlaceholder}
                onAddChannel={addChannel}
                onRemoveTarget={removeTarget}
            />

            <ChatFeed
                messages={feedMessages}
                showChannelTag
                emptyLabel={
                    targets.length === 0
                        ? t("noChannels")
                        : t("waitingMessages")
                }
            />
        </main>
    );
}