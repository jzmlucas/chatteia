"use client";

import { useTranslations } from "next-intl";
import { ChatTarget, targetKey } from "@/lib/chat/targets";
import { FeedMessage, ChatFeed } from "@/components/chat/ChatFeed";
import { useMultiChatLayout, ChatGroupData } from "@/hooks/chat/useMultiChatLayout";
import React, { useState } from "react";

// Simple SVG Icons
const GripVertical = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="9" cy="12" r="1"/>
        <circle cx="9" cy="5" r="1"/>
        <circle cx="9" cy="19" r="1"/>
        <circle cx="15" cy="12" r="1"/>
        <circle cx="15" cy="5" r="1"/>
        <circle cx="15" cy="19" r="1"/>
    </svg>
);

const Rows3 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M21 9H3"/>
        <path d="M21 15H3"/>
    </svg>
);

const Columns2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M12 3v18"/>
    </svg>
);

interface MultiChatBoardProps {
    targets: ChatTarget[];
    feedMessages: FeedMessage[];
}

export function MultiChatBoard({ targets, feedMessages }: MultiChatBoardProps) {
    const t = useTranslations("multiChat");
    const { groups, moveTarget, createNewGroup, unifyAll, separateByPlatform, isLoaded } = useMultiChatLayout(targets);
    const [draggingTarget, setDraggingTarget] = useState<string | null>(null);
    const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

    if (!isLoaded) return null;

    const handleDragStart = (e: React.DragEvent, tKey: string, fromGroupId: string) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ tKey, fromGroupId }));
        setDraggingTarget(tKey);
    };

    const handleDragOver = (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        if (dragOverGroup !== groupId) {
            setDragOverGroup(groupId);
        }
    };

    const handleDrop = (e: React.DragEvent, toGroupId: string | null) => {
        e.preventDefault();
        setDragOverGroup(null);
        setDraggingTarget(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));
            if (data && data.tKey && data.fromGroupId) {
                if (toGroupId && toGroupId !== data.fromGroupId) {
                    moveTarget(data.tKey, data.fromGroupId, toGroupId);
                } else if (!toGroupId) {
                    // Create new group
                    createNewGroup(data.tKey, data.fromGroupId);
                }
            }
        } catch (err) {
            // ignore
        }
    };

    const handleDragEnd = () => {
        setDraggingTarget(null);
        setDragOverGroup(null);
    };

    // Calculate grid columns based on number of groups to make it responsive
    const numGroups = groups.length;
    let gridColsClass = "grid-cols-1";
    if (numGroups === 2) gridColsClass = "lg:grid-cols-2";
    else if (numGroups === 3) gridColsClass = "lg:grid-cols-3";
    else if (numGroups >= 4) gridColsClass = "lg:grid-cols-2 xl:grid-cols-4"; // 2x2 or 1x4

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Layout Controls */}
            {targets.length > 1 && (
                <div className="flex justify-end p-2 gap-2 bg-zinc-900 border-b border-zinc-800">
                    <button
                        onClick={unifyAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                        title={t("layoutUnified") || "Unificar chats"}
                    >
                        <Rows3 className="w-3.5 h-3.5" />
                        Unificado
                    </button>
                    <button
                        onClick={separateByPlatform}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                        title={t("layoutByPlatform") || "Separar por plataforma"}
                    >
                        <Columns2 className="w-3.5 h-3.5" />
                        Por Plataforma
                    </button>
                </div>
            )}

            {/* Board Area */}
            <div 
                className={`flex-1 p-2 bg-black overflow-y-auto ${groups.length > 1 ? 'grid gap-2 ' + gridColsClass : 'flex flex-col'}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverGroup !== "NEW") setDragOverGroup("NEW");
                }}
                onDrop={(e) => handleDrop(e, null)}
            >
                {groups.map((group) => {
                    // Filter messages for this group
                    const groupMessages = feedMessages.filter(msg => {
                        const msgKey = `${msg.platform}:${msg.channel}`;
                        return group.targetKeys.includes(msgKey);
                    });

                    return (
                        <div 
                            key={group.id}
                            className={`flex flex-col flex-1 min-h-[300px] border rounded overflow-hidden transition-colors ${dragOverGroup === group.id ? 'border-pink-500 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-950'}`}
                            onDragOver={(e) => {
                                e.stopPropagation();
                                handleDragOver(e, group.id);
                            }}
                            onDrop={(e) => {
                                e.stopPropagation();
                                handleDrop(e, group.id);
                            }}
                        >
                            {/* Group Header - Draggable Tabs */}
                            <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900 border-b border-zinc-800 min-h-[40px]">
                                {group.targetKeys.map(tKey => {
                                    const targetInfo = targets.find(t => targetKey(t) === tKey);
                                    if (!targetInfo) return null;
                                    const isDragging = draggingTarget === tKey;
                                    
                                    return (
                                        <div
                                            key={tKey}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, tKey, group.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-medium cursor-grab active:cursor-grabbing border ${isDragging ? 'opacity-50 border-dashed border-zinc-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'}`}
                                        >
                                            <GripVertical className="w-3 h-3 text-zinc-500" />
                                            <span className="capitalize">{targetInfo.platform}</span>
                                            <span className="text-zinc-500">/</span>
                                            <span>{targetInfo.channel}</span>
                                        </div>
                                    );
                                })}
                                {group.targetKeys.length === 0 && (
                                    <div className="text-xs text-zinc-600 px-2 italic">Arraste chats para cá</div>
                                )}
                            </div>

                            {/* Group Feed */}
                            <ChatFeed
                                messages={groupMessages}
                                showChannelTag={group.targetKeys.length > 1}
                                emptyLabel={targets.length === 0 ? t("noChannels") : t("waitingMessages")}
                            />
                        </div>
                    );
                })}

                {/* Drop Zone for new group if dragging */}
                {draggingTarget && (
                    <div 
                        className={`flex items-center justify-center min-h-[300px] border-2 border-dashed rounded transition-colors ${dragOverGroup === "NEW" ? 'border-pink-500 bg-pink-500/10' : 'border-zinc-800 bg-transparent'}`}
                    >
                        <p className="text-zinc-500 text-sm font-medium pointer-events-none">
                            Solte aqui para separar este chat
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
