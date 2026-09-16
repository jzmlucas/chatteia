"use client";

import { useState } from "react";

export function CopyObsLinkButton({
  url,
  label,
  copiedLabel,
}: {
  url: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="
        px-3
        py-1.5
        text-sm
        text-zinc-400
        transition-colors
        hover:text-zinc-500
      "
    >
      {copied ? copiedLabel : label}
    </button>
  );
}