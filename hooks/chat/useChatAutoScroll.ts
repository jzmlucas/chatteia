"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

const BOTTOM_THRESHOLD = 100;

type UseChatAutoScrollOptions = {
    messageCount: number;
};

export function useChatAutoScroll({
                                      messageCount,
                                  }: UseChatAutoScrollOptions) {
    const [autoScroll, setAutoScroll] =
        useState(true);

    const [newMessagesCount, setNewMessagesCount] =
        useState(0);

    const scrollRef =
        useRef<HTMLDivElement>(null);

    const autoScrollRef =
        useRef(true);

    const previousMessageCountRef =
        useRef(messageCount);

    const programmaticScrollRef =
        useRef(false);

    const unlockTimerRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    const rafRef =
        useRef<number | null>(null);

    const scrollToBottomNow =
        useCallback(() => {
            const element =
                scrollRef.current;

            if (!element) {
                return;
            }

            programmaticScrollRef.current =
                true;

            element.scrollTop =
                element.scrollHeight -
                element.clientHeight;

            if (
                unlockTimerRef.current
            ) {
                clearTimeout(
                    unlockTimerRef.current
                );
            }

            unlockTimerRef.current =
                setTimeout(() => {
                    programmaticScrollRef.current =
                        false;
                }, 50);
        }, []);

    const isAtBottom =
        useCallback(
            (
                element: HTMLDivElement
            ) => {
                return (
                    element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight <=
                    BOTTOM_THRESHOLD
                );
            },
            []
        );

    useLayoutEffect(() => {
        const previousCount =
            previousMessageCountRef.current;

        const addedMessages =
            messageCount -
            previousCount;

        previousMessageCountRef.current =
            messageCount;

        if (
            addedMessages <= 0
        ) {
            return;
        }

        if (
            autoScrollRef.current
        ) {
            if (
                rafRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    rafRef.current
                );
            }

            rafRef.current =
                requestAnimationFrame(() => {
                    rafRef.current =
                        null;

                    scrollToBottomNow();
                });

            setNewMessagesCount(
                0
            );

            return;
        }

        setNewMessagesCount(
            (current) =>
                current +
                addedMessages
        );
    }, [
        messageCount,
        scrollToBottomNow,
    ]);

    useLayoutEffect(() => {
        const element =
            scrollRef.current;

        if (!element) {
            return;
        }

        if (
            messageCount === 0
        ) {
            return;
        }

        if (
            !autoScrollRef.current
        ) {
            return;
        }

        scrollToBottomNow();
    }, [
        messageCount,
        scrollToBottomNow,
    ]);

    useEffect(() => {
        const element =
            scrollRef.current;

        if (!element) {
            return;
        }

        let frame: number | null =
            null;

        const observer =
            new MutationObserver(() => {
                if (
                    !autoScrollRef.current
                ) {
                    return;
                }

                if (
                    frame !== null
                ) {
                    cancelAnimationFrame(
                        frame
                    );
                }

                frame =
                    requestAnimationFrame(
                        () => {
                            frame = null;

                            if (
                                autoScrollRef.current
                            ) {
                                scrollToBottomNow();
                            }
                        }
                    );
            });

        observer.observe(
            element,
            {
                childList: true,
                subtree: true,
            }
        );

        return () => {
            observer.disconnect();

            if (
                frame !== null
            ) {
                cancelAnimationFrame(
                    frame
                );
            }
        };
    }, [
        scrollToBottomNow,
    ]);

    useEffect(() => {
        function handleVisibilityChange() {
            if (
                document.visibilityState !==
                "visible"
            ) {
                return;
            }

            if (
                !autoScrollRef.current
            ) {
                return;
            }

            requestAnimationFrame(() => {
                scrollToBottomNow();
            });
        }

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        window.addEventListener(
            "focus",
            handleVisibilityChange
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            window.removeEventListener(
                "focus",
                handleVisibilityChange
            );
        };
    }, [
        scrollToBottomNow,
    ]);

    const handleScroll =
        useCallback(() => {
            const element =
                scrollRef.current;

            if (!element) {
                return;
            }

            if (
                programmaticScrollRef.current
            ) {
                return;
            }

            const atBottom =
                isAtBottom(element);

            if (atBottom) {
                autoScrollRef.current =
                    true;

                setAutoScroll(
                    true
                );

                setNewMessagesCount(
                    0
                );

                return;
            }

            autoScrollRef.current =
                false;

            setAutoScroll(
                false
            );
        }, [
            isAtBottom,
        ]);

    const scrollToBottom =
        useCallback(() => {
            autoScrollRef.current =
                true;

            setAutoScroll(
                true
            );

            setNewMessagesCount(
                0
            );

            scrollToBottomNow();
        }, [
            scrollToBottomNow,
        ]);

    useEffect(() => {
        return () => {
            if (
                rafRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    rafRef.current
                );
            }

            if (
                unlockTimerRef.current
            ) {
                clearTimeout(
                    unlockTimerRef.current
                );
            }
        };
    }, []);

    return {
        scrollRef,
        autoScroll,
        newMessagesCount,
        handleScroll,
        scrollToBottom,
    };
}