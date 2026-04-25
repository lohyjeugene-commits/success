"use client";

import { useRef, useState } from "react";

type CopyTextButtonProps = {
  text: string;
};

export function CopyTextButton({ text }: CopyTextButtonProps) {
  const resetTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
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
      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
    >
      {status === "copied" ? "Copied" : status === "error" ? "Try again" : "Copy ID"}
    </button>
  );
}
