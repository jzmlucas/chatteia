"use client";

import { Check, ChevronDown } from "lucide-react";
import {
    motion,
    type Transition,
    useReducedMotion,
    type Variants,
} from "motion/react";
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { cn } from "@/lib/utils";

const INSTANT: Transition = {
    duration: 0,
};

const CHEVRON_TRANSITION: Transition = {
    type: "spring",
    duration: 0.4,
    bounce: 0.3,
};

const LIST_VARIANTS: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.035,
            delayChildren: 0.03,
        },
    },
};

const ITEM_VARIANTS: Variants = {
    hidden: {
        opacity: 0,
        y: -6,
        filter: "blur(3px)",
    },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
    },
};

type Placement = "bottom" | "top";

type ChatSelectContextValue = {
    value: string | undefined;
    open: boolean;
    setOpen: (open: boolean) => void;
    select: (value: string) => void;
    register: (
        value: string,
        label: string
    ) => void;
    unregister: (value: string) => void;
    labelFor: (
        value: string | undefined
    ) => string | undefined;
    reduce: boolean;
    triggerId: string;
    listId: string;
    disabled: boolean;
    placement: Placement;
    setPlacement: (
        placement: Placement
    ) => void;
};

const ChatSelectContext =
    createContext<ChatSelectContextValue | null>(
        null
    );

function useChatSelectContext(
    component: string
) {
    const context = useContext(
        ChatSelectContext
    );

    if (!context) {
        throw new Error(
            `${component} must be used inside <ChatSelect>`
        );
    }

    return context;
}

type ChatSelectProps = {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
};

export function ChatSelect({
    value,
    defaultValue,
    onValueChange,
    disabled = false,
    className,
    children,
}: ChatSelectProps) {
    const reduce =
        useReducedMotion() ?? false;

    const baseId = useId();

    const rootRef =
        useRef<HTMLDivElement>(null);

    const [internalOpen, setInternalOpen] =
        useState(false);

    const [internalValue, setInternalValue] =
        useState(defaultValue);

    const [labels, setLabels] =
        useState<Map<string, string>>(
            new Map()
        );

    const [placement, setPlacement] =
        useState<Placement>("bottom");

    const controlled =
        value !== undefined;

    const currentValue = controlled
        ? value
        : internalValue;

    const setOpen = useCallback(
        (next: boolean) => {
            setInternalOpen(next);
        },
        []
    );

    const select = useCallback(
        (next: string) => {
            if (!controlled) {
                setInternalValue(next);
            }

            onValueChange?.(next);

            setInternalOpen(false);
        },
        [
            controlled,
            onValueChange,
        ]
    );

    const register = useCallback(
        (
            itemValue: string,
            label: string
        ) => {
            setLabels((previous) => {
                if (
                    previous.get(
                        itemValue
                    ) === label
                ) {
                    return previous;
                }

                return new Map(
                    previous
                ).set(
                    itemValue,
                    label
                );
            });
        },
        []
    );

    const unregister = useCallback(
        (itemValue: string) => {
            setLabels((previous) => {
                if (
                    !previous.has(
                        itemValue
                    )
                ) {
                    return previous;
                }

                const next = new Map(
                    previous
                );

                next.delete(itemValue);

                return next;
            });
        },
        []
    );

    useEffect(() => {
        if (!internalOpen) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (event.key === "Escape") {
                setInternalOpen(false);
            }
        }

        function handlePointerDown(
            event: PointerEvent
        ) {
            if (
                rootRef.current &&
                !rootRef.current.contains(
                    event.target as Node
                )
            ) {
                setInternalOpen(false);
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        window.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            window.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [internalOpen]);

    const context =
        useMemo<ChatSelectContextValue>(
            () => ({
                value: currentValue,
                open: internalOpen,
                setOpen,
                select,
                register,
                unregister,
                labelFor: (itemValue) =>
                    itemValue === undefined
                        ? undefined
                        : labels.get(
                              itemValue
                          ),
                reduce,
                triggerId: `${baseId}-trigger`,
                listId: `${baseId}-list`,
                disabled,
                placement,
                setPlacement,
            }),
            [
                currentValue,
                internalOpen,
                setOpen,
                select,
                register,
                unregister,
                labels,
                reduce,
                baseId,
                disabled,
                placement,
            ]
        );

    return (
        <ChatSelectContext.Provider
            value={context}
        >
            <div
                ref={rootRef}
                className={cn(
                    "relative w-full",
                    internalOpen
                        ? "z-50"
                        : "z-0",
                    className
                )}
            >
                {children}
            </div>
        </ChatSelectContext.Provider>
    );
}

type ChatSelectTriggerProps = {
    children: ReactNode;
    className?: string;
};

export function ChatSelectTrigger({
    children,
    className,
}: ChatSelectTriggerProps) {
    const context =
        useChatSelectContext(
            "ChatSelectTrigger"
        );

    return (
        <motion.button
            type="button"
            id={context.triggerId}
            disabled={context.disabled}
            aria-haspopup="listbox"
            aria-expanded={context.open}
            aria-controls={context.listId}
            onClick={() =>
                context.setOpen(
                    !context.open
                )
            }
            initial={false}
            animate={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
            }}
            transition={INSTANT}
            className={cn(
                "relative z-30 flex h-11 w-full",
                "items-center justify-between gap-3",
                "border border-zinc-700",
                "bg-[#111113]",
                "px-3.5",
                "text-left text-sm",
                "text-zinc-100",
                "outline-none",
                "transition-colors duration-200",
                "hover:border-zinc-500",
                "focus-visible:border-[#F55376]",
                "focus-visible:ring-1",
                "focus-visible:ring-[#F55376]/40",
                "disabled:pointer-events-none",
                "disabled:opacity-50",
                className
            )}
        >
            {children}

            <motion.span
                aria-hidden="true"
                animate={{
                    rotate: context.open
                        ? 180
                        : 0,
                }}
                transition={
                    context.reduce
                        ? { duration: 0 }
                        : CHEVRON_TRANSITION
                }
                className="shrink-0 text-zinc-500"
            >
                <ChevronDown className="h-4 w-4" />
            </motion.span>
        </motion.button>
    );
}

type ChatSelectValueProps = {
    placeholder?: string;
    className?: string;
};

export function ChatSelectValue({
    placeholder,
    className,
}: ChatSelectValueProps) {
    const context =
        useChatSelectContext(
            "ChatSelectValue"
        );

    const label =
        context.labelFor(
            context.value
        );

    return (
        <span
            className={cn(
                "truncate",
                label
                    ? "text-zinc-100"
                    : "text-zinc-500",
                className
            )}
        >
            {label ??
                placeholder ??
                "Select"}
        </span>
    );
}

type ChatSelectContentProps = {
    children: ReactNode;
    className?: string;
};

export function ChatSelectContent({
    children,
    className,
}: ChatSelectContentProps) {
    const context =
        useChatSelectContext(
            "ChatSelectContent"
        );

    const innerRef =
        useRef<HTMLDivElement>(null);

    const [height, setHeight] =
        useState(0);

    const open = context.open;

    useLayoutEffect(() => {
        const node =
            innerRef.current;

        if (!node) {
            return;
        }

        const measure = () => {
            setHeight(
                node.offsetHeight
            );
        };

        measure();

        const observer =
            new ResizeObserver(
                measure
            );

        observer.observe(node);

        return () =>
            observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        const trigger =
            document.getElementById(
                context.triggerId
            );

        const node =
            innerRef.current;

        if (!trigger || !node) {
            return;
        }

        const rect =
            trigger.getBoundingClientRect();

        const contentHeight =
            node.offsetHeight;

        const below =
            window.innerHeight -
            rect.bottom;

        const above = rect.top;

        context.setPlacement(
            below <
                contentHeight + 16 &&
            above > below
                ? "top"
                : "bottom"
        );
    }, [
        open,
        context.triggerId,
        context.setPlacement,
    ]);

    const isTop =
        context.placement === "top";

    return (
        <motion.div
            id={context.listId}
            role="listbox"
            aria-labelledby={
                context.triggerId
            }
            aria-hidden={!open}
            initial={false}
            animate={
                context.reduce
                    ? {
                          opacity:
                              open
                                  ? 1
                                  : 0,
                          height:
                              open
                                  ? height
                                  : 0,
                      }
                    : {
                          opacity:
                              open
                                  ? 1
                                  : 0,
                          height:
                              open
                                  ? height
                                  : 0,
                          marginTop:
                              isTop
                                  ? 0
                                  : open
                                    ? 6
                                    : 0,
                          marginBottom:
                              isTop
                                  ? open
                                      ? 6
                                      : 0
                                  : 0,
                      }
            }
            transition={
                context.reduce
                    ? {
                          duration: 0.12,
                      }
                    : {
                          opacity: open
                              ? {
                                    duration:
                                        0.18,
                                }
                              : {
                                    duration:
                                        0.12,
                                },
                          height: open
                              ? {
                                    type: "spring",
                                    duration:
                                        0.4,
                                    bounce:
                                        0.14,
                                }
                              : {
                                    duration:
                                        0.22,
                                    ease: [
                                        0.16,
                                        1,
                                        0.3,
                                        1,
                                    ],
                                },
                      }
            }
            style={{
                transformOrigin: isTop
                    ? "bottom"
                    : "top",
                overflow: "hidden",
                pointerEvents: open
                    ? "auto"
                    : "none",
            }}
            className={cn(
                "absolute left-0 right-0 z-[60]",
                "border border-zinc-700",
                "bg-[#111113]",
                "shadow-2xl",
                isTop
                    ? "bottom-full"
                    : "top-full",
                className
            )}
        >
            <motion.div
                ref={innerRef}
                variants={
                    context.reduce
                        ? undefined
                        : LIST_VARIANTS
                }
                initial={false}
                animate={
                    open
                        ? "show"
                        : "hidden"
                }
                className="p-1"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

type ChatSelectItemProps = {
    value: string;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
};

export function ChatSelectItem({
    value,
    children,
    disabled = false,
    className,
}: ChatSelectItemProps) {
    const context =
        useChatSelectContext(
            "ChatSelectItem"
        );

    const selected =
        context.value === value;

    const label =
        typeof children ===
        "string"
            ? children
            : value;

    useLayoutEffect(() => {
        context.register(
            value,
            label
        );

        return () =>
            context.unregister(
                value
            );
    }, [
        context.register,
        context.unregister,
        value,
        label,
    ]);

    return (
        <motion.div
            variants={
                context.reduce
                    ? undefined
                    : ITEM_VARIANTS
            }
        >
            <button
                type="button"
                role="option"
                aria-selected={
                    selected
                }
                disabled={disabled}
                onClick={() =>
                    context.select(
                        value
                    )
                }
                className={cn(
                    "flex h-9 w-full",
                    "items-center justify-between",
                    "gap-2",
                    "px-2.5",
                    "text-left text-sm",
                    "outline-none",
                    "transition-colors",
                    selected
                        ? "bg-[#F55376]/12 text-[#F55376]"
                        : [
                              "text-zinc-400",
                              "hover:bg-zinc-800",
                              "hover:text-zinc-100",
                              "focus-visible:bg-zinc-800",
                              "focus-visible:text-zinc-100",
                          ],
                    "disabled:pointer-events-none",
                    "disabled:opacity-50",
                    className
                )}
            >
                {children}

                {selected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#F55376]" />
                )}
            </button>
        </motion.div>
    );
}
