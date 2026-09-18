import { useState, useEffect, useCallback } from "react";
import { ChatTarget, targetKey } from "@/lib/chat/targets";

export interface ChatGroupData {
    id: string;
    targetKeys: string[];
}

export function useMultiChatLayout(activeTargets: ChatTarget[]) {
    const [groups, setGroups] = useState<ChatGroupData[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize and sync with activeTargets
    useEffect(() => {
        const activeKeys = activeTargets.map(targetKey);

        setGroups((prevGroups) => {
            // Load from local storage if not loaded
            let initialGroups = prevGroups;
            if (!isLoaded) {
                try {
                    const saved = localStorage.getItem("chatteia_multichat_layout");
                    if (saved) {
                        initialGroups = JSON.parse(saved);
                    }
                } catch (e) {
                    // Ignore error
                }
            }

            // Remove targets that are no longer active and deduplicate
            let nextGroups = initialGroups
                .map((g) => ({
                    ...g,
                    targetKeys: Array.from(new Set(g.targetKeys.filter((k) => activeKeys.includes(k)))),
                }))
                .filter((g) => g.targetKeys.length > 0);

            // Find new targets that aren't in any group yet
            const handledKeys = new Set(nextGroups.flatMap((g) => g.targetKeys));
            const unhandledKeys = activeKeys.filter((k) => !handledKeys.has(k));

            if (unhandledKeys.length > 0) {
                if (nextGroups.length > 0) {
                    // Add to first group by default
                    nextGroups[0].targetKeys = Array.from(new Set([...nextGroups[0].targetKeys, ...unhandledKeys]));
                } else {
                    // Create a default unified group
                    nextGroups.push({
                        id: `group-${Date.now()}`,
                        targetKeys: unhandledKeys,
                    });
                }
            }

            return nextGroups;
        });

        if (!isLoaded) {
            setIsLoaded(true);
        }
    }, [activeTargets, isLoaded]);

    // Save to local storage
    useEffect(() => {
        if (isLoaded && groups.length > 0) {
            localStorage.setItem("chatteia_multichat_layout", JSON.stringify(groups));
        } else if (isLoaded && groups.length === 0) {
            localStorage.removeItem("chatteia_multichat_layout");
        }
    }, [groups, isLoaded]);

    const moveTarget = useCallback((targetKeyStr: string, fromGroupId: string, toGroupId: string) => {
        setGroups((prev) => {
            if (fromGroupId === toGroupId) return prev;

            return prev.map(group => {
                if (group.id === fromGroupId) {
                    return { ...group, targetKeys: group.targetKeys.filter(k => k !== targetKeyStr) };
                }
                if (group.id === toGroupId) {
                    // Prevent duplicates just in case
                    const newKeys = group.targetKeys.includes(targetKeyStr) 
                        ? group.targetKeys 
                        : [...group.targetKeys, targetKeyStr];
                    return { ...group, targetKeys: newKeys };
                }
                return group;
            }).filter(g => g.targetKeys.length > 0);
        });
    }, []);

    const createNewGroup = useCallback((targetKeyStr: string, fromGroupId: string) => {
        setGroups((prev) => {
            const nextGroups = prev.map(group => {
                if (group.id === fromGroupId) {
                    return { ...group, targetKeys: group.targetKeys.filter(k => k !== targetKeyStr) };
                }
                return group;
            });

            nextGroups.push({
                id: `group-${Date.now()}`,
                targetKeys: [targetKeyStr],
            });

            return nextGroups.filter(g => g.targetKeys.length > 0);
        });
    }, []);

    const unifyAll = useCallback(() => {
        const activeKeys = activeTargets.map(targetKey);
        if (activeKeys.length === 0) return;
        setGroups([
            {
                id: `group-${Date.now()}`,
                targetKeys: activeKeys,
            },
        ]);
    }, [activeTargets]);

    const separateAll = useCallback(() => {
        const activeKeys = activeTargets.map(targetKey);
        setGroups(
            activeKeys.map((k, idx) => ({
                id: `group-${Date.now()}-${idx}`,
                targetKeys: [k],
            }))
        );
    }, [activeTargets]);

    const separateByPlatform = useCallback(() => {
        const platformMap = new Map<string, string[]>();
        activeTargets.forEach((t) => {
            const list = platformMap.get(t.platform) || [];
            list.push(targetKey(t));
            platformMap.set(t.platform, list);
        });

        const newGroups = Array.from(platformMap.entries()).map(([platform, keys], idx) => ({
            id: `group-${platform}-${Date.now()}-${idx}`,
            targetKeys: keys,
        }));
        
        setGroups(newGroups);
    }, [activeTargets]);

    return {
        groups,
        moveTarget,
        createNewGroup,
        unifyAll,
        separateAll,
        separateByPlatform,
        isLoaded,
    };
}
