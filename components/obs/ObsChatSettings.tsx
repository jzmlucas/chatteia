"use client";

import {
    ObsChatSettings as ObsChatSettingsType,
} from "@/types/chat/obs";

type Props = {
    settings: ObsChatSettingsType;
    updateSettings: (
        changes: Partial<ObsChatSettingsType>
    ) => void;
    resetSettings: () => void;
};

export function ObsChatSettings({
    settings,
    updateSettings,
    resetSettings,
}: Props) {
    return (
        <div className="space-y-6">
            {/* APARÊNCIA */}
            <section>
                <div className="mb-4 border-b border-white/10 pb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Aparência
                    </h2>

                    <p className="mt-1 text-[11px] text-white/30">
                        Personalize a aparência das mensagens.
                    </p>
                </div>

                <div className="grid gap-4">
                    {/* Fonte */}
                    <label className="space-y-1.5">
                        <span className="block text-xs text-white/60">
                            Fonte
                        </span>

                        <select
                            value={settings.fontFamily}
                            onChange={(event) =>
                                updateSettings({
                                    fontFamily:
                                        event.target.value,
                                })
                            }
                            className="h-9 w-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none transition focus:border-white/20"
                        >
                            <option value="Inter">
                                Inter
                            </option>

                            <option value="Arial">
                                Arial
                            </option>

                            <option value="Verdana">
                                Verdana
                            </option>

                            <option value="Tahoma">
                                Tahoma
                            </option>

                            <option value="system-ui">
                                System
                            </option>
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Tamanho */}
                        <label className="space-y-1.5">
                            <span className="block text-xs text-white/60">
                                Tamanho
                            </span>

                            <input
                                type="number"
                                min={10}
                                max={40}
                                value={
                                    settings.fontSize
                                }
                                onChange={(event) =>
                                    updateSettings({
                                        fontSize:
                                            Number(
                                                event.target
                                                    .value
                                            ),
                                    })
                                }
                                className="h-9 w-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-white/20"
                            />
                        </label>

                        {/* Peso */}
                        <label className="space-y-1.5">
                            <span className="block text-xs text-white/60">
                                Peso
                            </span>

                            <select
                                value={
                                    settings.fontWeight
                                }
                                onChange={(event) =>
                                    updateSettings({
                                        fontWeight:
                                            Number(
                                                event.target
                                                    .value
                                            ),
                                    })
                                }
                                className="h-9 w-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-white/20"
                            >
                                <option value={400}>
                                    Normal
                                </option>

                                <option value={500}>
                                    Medium
                                </option>

                                <option value={600}>
                                    Semibold
                                </option>

                                <option value={700}>
                                    Bold
                                </option>
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Espaçamento */}
                        <label className="space-y-1.5">
                            <span className="block text-xs text-white/60">
                                Espaçamento
                            </span>

                            <input
                                type="number"
                                min={0}
                                max={40}
                                value={
                                    settings.messageSpacing
                                }
                                onChange={(event) =>
                                    updateSettings({
                                        messageSpacing:
                                            Number(
                                                event.target
                                                    .value
                                            ),
                                    })
                                }
                                className="h-9 w-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-white/20"
                            />
                        </label>

                        {/* Arredondamento */}
                        <label className="space-y-1.5">
                            <span className="block text-xs text-white/60">
                                Arredondamento
                            </span>

                            <input
                                type="number"
                                min={0}
                                max={40}
                                value={
                                    settings.borderRadius
                                }
                                onChange={(event) =>
                                    updateSettings({
                                        borderRadius:
                                            Number(
                                                event.target
                                                    .value
                                            ),
                                    })
                                }
                                className="h-9 w-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-white/20"
                            />
                        </label>
                    </div>

                    {/* Máximo de mensagens */}
                    <label className="space-y-1.5">
                        <span className="block text-xs text-white/60">
                            Máximo de mensagens
                        </span>

                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={
                                settings.maxMessages
                            }
                            onChange={(event) =>
                                updateSettings({
                                    maxMessages:
                                        Number(
                                            event.target
                                                .value
                                        ),
                                })
                            }
                            className="h-9 w-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-white/20"
                        />
                    </label>
                </div>
            </section>

            {/* CORES */}
            <section>
                <div className="mb-4 border-b border-white/10 pb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Cores
                    </h2>

                    <p className="mt-1 text-[11px] text-white/30">
                        Defina as cores do chat.
                    </p>
                </div>

                <div className="grid gap-4">
                    {/* Nome */}
                    <ColorInput
                        label="Cor do nome"
                        value={
                            settings.usernameColor
                        }
                        onChange={(value) =>
                            updateSettings({
                                usernameColor:
                                    value,
                            })
                        }
                    />

                    {/* Mensagem */}
                    <ColorInput
                        label="Cor da mensagem"
                        value={
                            settings.messageColor
                        }
                        onChange={(value) =>
                            updateSettings({
                                messageColor:
                                    value,
                            })
                        }
                    />

                    {/* Fundo */}
                    <ColorInput
                        label="Fundo da mensagem"
                        value={
                            settings.messageBackgroundColor
                        }
                        onChange={(value) =>
                            updateSettings({
                                messageBackgroundColor:
                                    value,
                            })
                        }
                    />

                    {/* Opacidade */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-white/60">
                                Opacidade do fundo
                            </span>

                            <span className="text-[10px] text-white/30">
                                {
                                    settings.messageBackgroundOpacity
                                }
                                %
                            </span>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={
                                settings.messageBackgroundOpacity
                            }
                            onChange={(event) =>
                                updateSettings({
                                    messageBackgroundOpacity:
                                        Number(
                                            event.target
                                                .value
                                        ),
                                })
                            }
                            className="w-full"
                        />
                    </div>
                </div>
            </section>

            {/* ELEMENTOS */}
            <section>
                <div className="mb-4 border-b border-white/10 pb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Elementos
                    </h2>
                </div>

                <div className="divide-y divide-white/5 border-y border-white/5">
                    <Toggle
                        label="Mostrar avatar"
                        checked={
                            settings.showAvatar
                        }
                        onChange={(value) =>
                            updateSettings({
                                showAvatar:
                                    value,
                            })
                        }
                    />

                    <Toggle
                        label="Mostrar badges"
                        checked={
                            settings.showBadges
                        }
                        onChange={(value) =>
                            updateSettings({
                                showBadges:
                                    value,
                            })
                        }
                    />

                    <Toggle
                        label="Mostrar horário"
                        checked={
                            settings.showTimestamp
                        }
                        onChange={(value) =>
                            updateSettings({
                                showTimestamp:
                                    value,
                            })
                        }
                    />

                    <Toggle
                        label="Mostrar nome do usuário"
                        checked={
                            settings.showUsername
                        }
                        onChange={(value) =>
                            updateSettings({
                                showUsername:
                                    value,
                            })
                        }
                    />

                    <Toggle
                        label="Fundo nas mensagens"
                        checked={
                            settings.messageBackground
                        }
                        onChange={(value) =>
                            updateSettings({
                                messageBackground:
                                    value,
                            })
                        }
                    />
                </div>
            </section>

            {/* COMPORTAMENTO */}
            <section>
                <div className="mb-4 border-b border-white/10 pb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        Comportamento
                    </h2>

                    <p className="mt-1 text-[11px] text-white/30">
                        Controle o movimento automático das
                        mensagens.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Movimento automático */}
                    <Toggle
                        label="Movimento automático"
                        description="As mensagens se deslocam e desaparecem do overlay."
                        checked={
                            settings.autoScroll
                        }
                        onChange={(value) =>
                            updateSettings({
                                autoScroll:
                                    value,
                            })
                        }
                    />

                    {/* Direção */}
                    <div>
                        <div className="mb-2">
                            <span className="text-xs text-white/60">
                                Direção
                            </span>
                        </div>

                        <div className="grid grid-cols-4 border border-white/10">
                            <DirectionButton
                                label="↑"
                                title="Subir"
                                active={
                                    settings.animationDirection ===
                                    "up"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationDirection:
                                            "up",
                                    })
                                }
                            />

                            <DirectionButton
                                label="↓"
                                title="Descer"
                                active={
                                    settings.animationDirection ===
                                    "down"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationDirection:
                                            "down",
                                    })
                                }
                            />

                            <DirectionButton
                                label="←"
                                title="Esquerda"
                                active={
                                    settings.animationDirection ===
                                    "left"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationDirection:
                                            "left",
                                    })
                                }
                            />

                            <DirectionButton
                                label="→"
                                title="Direita"
                                active={
                                    settings.animationDirection ===
                                    "right"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationDirection:
                                            "right",
                                    })
                                }
                            />
                        </div>
                    </div>

                    {/* Velocidade */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-white/60">
                                Velocidade
                            </span>

                            <span className="text-[10px] text-white/30">
                                {getSpeedLabel(
                                    settings.animationSpeed
                                )}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 border border-white/10">
                            <SpeedButton
                                label="Lenta"
                                active={
                                    settings.animationSpeed ===
                                    "slow"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationSpeed:
                                            "slow",
                                    })
                                }
                            />

                            <SpeedButton
                                label="Normal"
                                active={
                                    settings.animationSpeed ===
                                    "normal"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationSpeed:
                                            "normal",
                                    })
                                }
                            />

                            <SpeedButton
                                label="Rápida"
                                active={
                                    settings.animationSpeed ===
                                    "fast"
                                }
                                onClick={() =>
                                    updateSettings({
                                        animationSpeed:
                                            "fast",
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* RESTAURAR */}
            <button
                type="button"
                onClick={resetSettings}
                className="h-9 border border-white/10 px-4 text-xs text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
                Restaurar padrão
            </button>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* COLOR INPUT                                                                */
/* -------------------------------------------------------------------------- */

function ColorInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="space-y-1.5">
            <span className="block text-xs text-white/60">
                {label}
            </span>

            <div className="flex h-9">
                <input
                    type="color"
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    className="h-9 w-12 cursor-pointer border border-white/10 bg-transparent p-0"
                />

                <input
                    type="text"
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    className="min-w-0 flex-1 border border-l-0 border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-white/20"
                />
            </div>
        </label>
    );
}

/* -------------------------------------------------------------------------- */
/* TOGGLE                                                                     */
/* -------------------------------------------------------------------------- */

function Toggle({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() =>
                onChange(!checked)
            }
            className="flex w-full items-center justify-between gap-4 py-3 text-left"
        >
            <div className="min-w-0">
                <span className="block text-xs text-white/70">
                    {label}
                </span>

                {description && (
                    <span className="mt-0.5 block text-[10px] leading-4 text-white/30">
                        {description}
                    </span>
                )}
            </div>

            <span
                className={[
                    "relative h-5 w-9 shrink-0 transition",
                    checked
                        ? "bg-[#F55376]"
                        : "bg-white/10",
                ].join(" ")}
            >
                <span
                    className={[
                        "absolute top-0.5 h-4 w-4 bg-white transition",
                        checked
                            ? "left-[18px]"
                            : "left-0.5",
                    ].join(" ")}
                />
            </span>
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* DIRECTION BUTTON                                                           */
/* -------------------------------------------------------------------------- */

function DirectionButton({
    label,
    title,
    active,
    onClick,
}: {
    label: string;
    title: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={[
                "h-9 text-sm transition",
                active
                    ? "bg-[#F55376]/10 text-[#f76f9c]"
                    : "bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white",
            ].join(" ")}
        >
            {label}
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* SPEED BUTTON                                                               */
/* -------------------------------------------------------------------------- */

function SpeedButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "h-9 text-[11px] transition",
                active
                    ? "bg-[#F55376]/10 text-[#f76f9c]"
                    : "bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white",
            ].join(" ")}
        >
            {label}
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* SPEED LABEL                                                                */
/* -------------------------------------------------------------------------- */

function getSpeedLabel(
    speed: ObsChatSettingsType["animationSpeed"]
): string {
    switch (speed) {
        case "slow":
            return "Lenta";

        case "fast":
            return "Rápida";

        case "normal":
        default:
            return "Normal";
    }
}