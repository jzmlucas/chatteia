"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type { BillingState } from "@/types/billing";
import type { ActiveMode, Profile } from "@/types/user";

/**
 * Resultado de tentar entrar no modo streamer:
 * - "ok": deu certo;
 * - "subscription_required": falta assinatura (a UI deve levar a /billing);
 * - "error": falha genérica (rede, sem permissão...).
 */
export type ModeChangeResult =
    | "ok"
    | "subscription_required"
    | "error";

type AuthContextValue = {
    user: { id: string; email: string } | null;
    profile: Profile | null;
    billing: BillingState | null;
    loading: boolean;
    isStreamer: boolean;
    isStreamerMode: boolean;
    /** Pode usar o modo streamer agora (assinatura em dia ou cobrança desligada). */
    hasStreamerAccess: boolean;
    activeMode: ActiveMode;
    refreshProfile: () => Promise<void>;
    setActiveMode: (mode: ActiveMode) => Promise<ModeChangeResult>;
    enableStreamerMode: () => Promise<ModeChangeResult>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type SessionSnapshot = {
    profile: Profile | null;
    billing: BillingState | null;
};

async function fetchSession(): Promise<SessionSnapshot> {
    try {
        const response = await fetch("/api/auth/session", {
            credentials: "include",
        });

        if (!response.ok) {
            return { profile: null, billing: null };
        }

        const data = (await response.json()) as {
            profile: Profile | null;
            billing?: BillingState;
        };

        return {
            profile: data.profile,
            billing: data.billing ?? null,
        };
    } catch {
        return { profile: null, billing: null };
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [billing, setBilling] = useState<BillingState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        fetchSession().then((snapshot) => {
            if (active) {
                setProfile(snapshot.profile);
                setBilling(snapshot.billing);
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    async function refreshProfile() {
        const snapshot = await fetchSession();

        setProfile(snapshot.profile);
        setBilling(snapshot.billing);
    }

    async function setActiveModeInternal(
        mode: ActiveMode
    ): Promise<ModeChangeResult> {
        if (!profile) {
            return "error";
        }

        if (mode === "streamer" && profile.account_type !== "streamer") {
            return "error";
        }

        const response = await fetch("/api/auth/profile", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active_mode: mode }),
        });

        if (response.status === 402) {
            return "subscription_required";
        }

        if (!response.ok) {
            return "error";
        }

        const data = (await response.json()) as { profile: Profile };

        setProfile(data.profile);

        return "ok";
    }

    async function enableStreamerModeInternal(): Promise<ModeChangeResult> {
        if (!profile) {
            return "error";
        }

        const response = await fetch("/api/auth/profile", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enable_streamer_mode: true }),
        });

        if (!response.ok) {
            return "error";
        }

        const data = (await response.json()) as {
            profile: Profile;
            subscription_required?: boolean;
        };

        // A conta já foi marcada como streamer; o modo só ativa com assinatura.
        setProfile(data.profile);

        return data.subscription_required ? "subscription_required" : "ok";
    }

    async function signOut() {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });

        setProfile(null);
        setBilling(null);
    }

    // Sem dados de billing (ex.: resposta antiga em cache) não bloqueamos.
    const hasStreamerAccess = billing ? billing.entitled : true;

    const isStreamer = profile?.account_type === "streamer";
    const isStreamerMode =
        isStreamer &&
        hasStreamerAccess &&
        profile?.active_mode === "streamer";
    const activeMode = profile?.active_mode ?? "user";

    const user = profile ? { id: profile.id, email: profile.email } : null;

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                billing,
                loading,
                isStreamer,
                isStreamerMode,
                hasStreamerAccess,
                activeMode,
                refreshProfile,
                setActiveMode: setActiveModeInternal,
                enableStreamerMode: enableStreamerModeInternal,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth precisa ser usado dentro de <AuthProvider>.");
    }

    return context;
}
