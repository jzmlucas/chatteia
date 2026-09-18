import { FormEvent, useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { useAuth } from "@/contexts/AuthContext";
import { supabaseBrowser } from "@/lib/supabase/client";

import type { Database } from "@/types/supabase";

export function useAccountForm() {
    const t = useTranslations("auth");

    const { user, profile, refreshProfile } = useAuth();

    const [displayName, setDisplayName] =
        useState("");

    const [bio, setBio] =
        useState("");

    const [avatarUrl, setAvatarUrl] =
        useState("");

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        if (profile) {
            setDisplayName(
                profile.display_name ?? ""
            );

            setBio(
                profile.bio ?? ""
            );

            setAvatarUrl(
                profile.avatar_url ?? ""
            );
        }
    }, [profile]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!user) {
            return;
        }

        setError(null);
        setSuccess(false);
        setSaving(true);

        const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {
            display_name:
                displayName.trim() || null,

            bio:
                bio.trim() || null,

            avatar_url:
                avatarUrl.trim() || null,
        };

        const { error: updateError } =
            await supabaseBrowser
                .from("profiles")
                .update(updateData)
                .eq("id", user.id);

        setSaving(false);

        if (updateError) {
            setError(updateError.message);

            return;
        }

        await refreshProfile();

        setSuccess(true);
    }

    return {
        displayName,
        setDisplayName,
        bio,
        setBio,
        avatarUrl,
        setAvatarUrl,
        error,
        success,
        saving,
        handleSubmit,
        t,
    };
}