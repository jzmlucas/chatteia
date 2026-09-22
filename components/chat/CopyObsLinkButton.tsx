"use client";

import { useState } from "react";

type CopyObsLinkButtonProps = {
  label: string;
  copiedLabel: string;
  errorLabel?: string;
} & (
  | { url: string; getUrl?: never }
  | { url?: never; getUrl: () => Promise<string> }
);

export function CopyObsLinkButton({
  url,
  getUrl,
  label,
  copiedLabel,
  errorLabel,
}: CopyObsLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    setFailed(false);

    try {
      let resolvedUrl = url;

      if (getUrl) {
        setPending(true);
        resolvedUrl = await getUrl();
      }

      if (!resolvedUrl) {
        throw new Error("empty_url");
      }

      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setFailed(true);

      window.setTimeout(() => {
        setFailed(false);
      }, 2500);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={pending}
      className="
        px-3
        py-1.5
        text-sm
        text-zinc-400
        transition-colors
        hover:text-zinc-500
        disabled:cursor-wait
        disabled:opacity-70
      "
    >
      {failed && errorLabel
        ? errorLabel
        : copied
          ? copiedLabel
          : label}
    </button>
  );
}
