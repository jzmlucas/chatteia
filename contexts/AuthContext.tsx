"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type { ActiveMode, Profile } from "@/types/user";

type AuthContextValue = {
    user: { id: string; email: string } | null;
    profile: Profile | null;
    loading: boolean;
    isStreamer: boolean;
    isStreamerMode: boolean;
    activeMode: ActiveMode;
    refreshProfile: () => Promise<void>;
    setActiveMode: (mode: ActiveMode) => Promise<boolean>;
    enableStreamerMode: () => Promise<boolean>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchSessionProfile(): Promise<Profile | null> {
    try {
        const response = await fetch("/api/auth/session", {
            credentials: "include",
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as { profile: Profile | null };

        return data.profile;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        fetchSessionProfile().then((nextProfile) => {
            if (active) {
                setProfile(nextProfile);
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    async function refreshProfile() {
        const nextProfile =
            await fetchSessionProfile();

        console.log(
            "[AUTH] Perfil após refresh:",
            nextProfile
        );

        setProfile(nextProfile);
    }

    async function setActiveModeInternal(mode: ActiveMode): Promise<boolean> {
        if (!profile) {
            return false;
        }

        if (mode === "streamer" && profile.account_type !== "streamer") {
            return false;
        }

        const response = await fetch("/api/auth/profile", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active_mode: mode }),
        });

        if (!response.ok) {
            return false;
        }

        const data = (await response.json()) as { profile: Profile };

        setProfile(data.profile);

        return true;
    }

    async function enableStreamerModeInternal(): Promise<boolean> {
        if (!profile) {
            return false;
        }

        const response = await fetch("/api/auth/profile", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enable_streamer_mode: true }),
        });

        if (!response.ok) {
            return false;
        }

        const data = (await response.json()) as { profile: Profile };

        setProfile(data.profile);

        return true;
    }

    async function signOut() {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });

        setProfile(null);
    }

    const isStreamer = profile?.account_type === "streamer";
    const isStreamerMode = isStreamer && profile?.active_mode === "streamer";
    const activeMode = profile?.active_mode ?? "user";

    const user = profile ? { id: profile.id, email: profile.email } : null;

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                isStreamer,
                isStreamerMode,
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
