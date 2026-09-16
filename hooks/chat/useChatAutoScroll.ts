"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

const BOTTOM_THRESHOLD = 80;

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

    const previousMessageCountRef =
        useRef(messageCount);

    const isInitialScrollRef =
        useRef(true);

    const isProgrammaticScrollRef =
        useRef(false);

    useEffect(() => {
        const previousCount =
            previousMessageCountRef.current;

        const currentCount =
            messageCount;

        previousMessageCountRef.current =
            currentCount;

        if (currentCount <= previousCount) {
            return;
        }

        const addedMessages =
            currentCount - previousCount;

        if (autoScroll) {
            requestAnimationFrame(() => {
                const element =
                    scrollRef.current;

                if (!element) {
                    return;
                }

                isProgrammaticScrollRef.current =
                    true;

                element.scrollTo({
                    top: element.scrollHeight,
                    behavior:
                        isInitialScrollRef.current
                            ? "auto"
                            : "smooth",
                });

                isInitialScrollRef.current =
                    false;

                window.setTimeout(() => {
                    isProgrammaticScrollRef.current =
                        false;
                }, 100);
            });

            setNewMessagesCount(0);

            return;
        }

        setNewMessagesCount(
            (count) =>
                count + addedMessages
        );
    }, [
        messageCount,
        autoScroll,
    ]);

    function isAtBottom(
        element: HTMLDivElement
    ) {
        const distanceFromBottom =
            element.scrollHeight -
            element.scrollTop -
            element.clientHeight;

        return (
            distanceFromBottom <=
            BOTTOM_THRESHOLD
        );
    }

    function handleScroll() {
        const element =
            scrollRef.current;

        if (!element) {
            return;
        }

        if (
            isProgrammaticScrollRef.current
        ) {
            return;
        }

        const atBottom =
            isAtBottom(element);

        if (atBottom) {
            setAutoScroll(true);
            setNewMessagesCount(0);
        } else {
            setAutoScroll(false);
        }
    }

    function scrollToBottom() {
        const element =
            scrollRef.current;

        if (!element) {
            return;
        }

        setAutoScroll(true);
        setNewMessagesCount(0);

        isProgrammaticScrollRef.current =
            true;

        element.scrollTo({
            top: element.scrollHeight,
            behavior: "smooth",
        });

        window.setTimeout(() => {
            isProgrammaticScrollRef.current =
                false;
        }, 400);
    }

    return {
        scrollRef,
        autoScroll,
        newMessagesCount,
        handleScroll,
        scrollToBottom,
    };
}