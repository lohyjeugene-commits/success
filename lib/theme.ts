export const THEME_STORAGE_KEY = "touchgrass-theme";
export const DEFAULT_THEME = "dark";

export type Theme = "dark" | "light";

export function normalizeTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

export function getThemeBootScript() {
  return `
    (function () {
      var storageKey = "${THEME_STORAGE_KEY}";
      var fallbackTheme = "${DEFAULT_THEME}";

      try {
        var savedTheme = window.localStorage.getItem(storageKey);
        var theme = savedTheme === "light" ? "light" : fallbackTheme;
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = fallbackTheme;
        document.documentElement.style.colorScheme = fallbackTheme;
      }
    })();
  `;
}
