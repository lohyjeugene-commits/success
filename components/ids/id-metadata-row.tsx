"use client";

import { useEffect, useRef, useState } from "react";
import { CopyTextButton } from "./copy-text-button";

type IdMetadataRowProps = {
  label: string;
  value: string;
  align?: "start" | "end";
  className?: string;
};

function truncateId(value: string) {
  if (value.length <= 13) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function IdMetadataRow({
  label,
  value,
  align = "start",
  className = "",
}: IdMetadataRowProps) {
  const resetTimerRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCopyRevealActive, setIsCopyRevealActive] = useState(false);
  const alignmentClassName =
    align === "end" ? " sm:items-end sm:text-right" : "";
  const rowClassName = className ? ` ${className}` : "";
  const displayValue = isHovered || isCopyRevealActive ? value : truncateId(value);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  function handleCopied() {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    setIsCopyRevealActive(true);
    resetTimerRef.current = window.setTimeout(() => {
      setIsCopyRevealActive(false);
      resetTimerRef.current = null;
    }, 2000);
  }

  return (
    <div className={`min-w-0 space-y-1${alignmentClassName}${rowClassName}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div
        className={`flex min-w-0 max-w-full flex-wrap items-center gap-2 ${
          align === "end" ? "sm:justify-end" : ""
        }`}
      >
        <code
          className="max-w-full break-all font-mono text-xs text-slate-400 transition hover:text-slate-500"
          title={value}
          tabIndex={0}
          aria-label={`${label}: ${value}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
        >
          {displayValue}
        </code>
        <CopyTextButton text={value} onCopied={handleCopied} />
      </div>
    </div>
  );
}
