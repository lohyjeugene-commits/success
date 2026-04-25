"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  normalizeTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeToggleProps = {
  className?: string;
};

const THEME_CHANGE_EVENT = "touchgrass-theme-change";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function readThemeFromDocument() {
  return normalizeTheme(document.documentElement.dataset.theme);
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== THEME_STORAGE_KEY) {
      return;
    }

    applyTheme(normalizeTheme(event.newValue));
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

function getThemeSnapshot() {
  if (typeof document === "undefined") {
    return DEFAULT_THEME;
  }

  return readThemeFromDocument();
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    () => DEFAULT_THEME,
  );

  const updateTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const containerClassName = className ? ` ${className}` : "";

  return (
    <div
      className={`inline-flex items-center rounded-full border border-slate-300 bg-slate-50 p-1${containerClassName}`}
      role="group"
      aria-label="Theme toggle"
    >
      {(["dark", "light"] as const).map((option) => {
        const isActive = theme === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => updateTheme(option)}
            aria-pressed={isActive}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
              isActive
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
