"use client";

import { useTranslations } from "next-intl";

import { MultiChatHeader } from "@/components/chat/MultiChatHeader";
import { MultiChatBoard } from "@/components/chat/layout/MultiChatBoard";

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

            <MultiChatBoard 
                targets={targets} 
                feedMessages={feedMessages} 
            />
        </main>
    );
}