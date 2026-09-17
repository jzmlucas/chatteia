"use client";

import { useParams } from "next/navigation";

import {
    useObsChatSettings,
} from "@/hooks/chat/useObsChatSettings";

import {
    ObsChatSettings,
} from "@/components/obs/ObsChatSettings";

import {
    ObsChatPreview,
} from "@/components/obs/ObsChatPreview";

export default function ObsChatSettingsPage() {
    const params = useParams<{
        locale: string;
        channel: string;
    }>();

    const {
        settings,
        updateSettings,
        resetSettings,
        obsUrl,
    } = useObsChatSettings();

    return (
        <main className="h-screen overflow-hidden bg-[#09090b] text-white">
            <div className="flex h-screen flex-col">
                {/* Header */}
                <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                            OBS Chat
                        </span>

                        <span className="text-xs text-white/30">
                            /
                        </span>

                        <span className="text-xs text-white/40">
                            twitch / {params.channel}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={resetSettings}
                        className="text-xs text-white/40 transition hover:text-white"
                    >
                        Restaurar padrão
                    </button>
                </header>

                {/* Main */}
                <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_1fr]">
                    {/* Settings */}
                    <aside className="min-h-0 border-r border-white/10">
                        <div className="h-full overflow-y-auto px-5 py-4">
                            <div className="mb-4">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">
                                    Aparência
                                </h2>

                                <p className="mt-1 text-[11px] text-white/30">
                                    Personalize o overlay do chat.
                                </p>
                            </div>

                            <ObsChatSettings
                                settings={settings}
                                updateSettings={updateSettings}
                                resetSettings={resetSettings}
                            />
                        </div>
                    </aside>

                    {/* Preview */}
                    <section className="min-w-0 min-h-0">
                        <div className="flex h-full flex-col">
                            <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-5">
                                <span className="text-xs font-medium text-white/60">
                                    Preview
                                </span>

                                <span className="text-[10px] uppercase tracking-widest text-white/20">
                                    tempo real
                                </span>
                            </div>

                            <div className="min-h-0 flex-1 p-4">
                                <div className="relative h-full overflow-hidden bg-[#18181b]">
                                    <div
                                        className="absolute inset-0 opacity-[0.025]"
                                        style={{
                                            backgroundImage:
                                                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
                                            backgroundSize:
                                                "32px 32px",
                                        }}
                                    />

                                    <div className="relative h-full">
                                        <ObsChatPreview
                                            settings={settings}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* OBS URL */}
                <footer className="flex h-14 shrink-0 items-center gap-3 border-t border-white/10 px-5">
                    <div className="min-w-0 flex-1">
                        <input
                            readOnly
                            value={obsUrl}
                            className="h-8 w-full border border-white/10 bg-white/[0.025] px-3 text-[11px] text-white/50 outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        disabled={!obsUrl}
                        onClick={() => {
                            if (!obsUrl) {
                                return;
                            }

                            navigator.clipboard.writeText(
                                obsUrl
                            );
                        }}
                        className="h-8 shrink-0 bg-white px-4 text-xs font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        Copiar URL
                    </button>
                </footer>
            </div>
        </main>
    );
}