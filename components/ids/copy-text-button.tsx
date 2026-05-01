"use client";

import { useRef, useState } from "react";

type CopyTextButtonProps = {
  text: string;
  label?: string;
  onCopied?: () => void;
};

export function CopyTextButton({
  text,
  label = "Copy",
  onCopied,
}: CopyTextButtonProps) {
  const resetTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      onCopied?.();
    } catch {
      setStatus("error");
    }

    resetTimerRef.current = window.setTimeout(() => {
      setStatus("idle");
      resetTimerRef.current = null;
    }, 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
    >
      {status === "copied" ? "Copied" : status === "error" ? "Retry" : label}
    </button>
  );
}
