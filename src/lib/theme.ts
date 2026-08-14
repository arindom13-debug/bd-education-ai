export type Theme = "dark" | "light";
export type ThemePreference = "dark" | "light" | "system";

const STORAGE_KEY = "arindoms-ai-theme";
const PREFERENCE_STORAGE_KEY = "arindoms-ai-theme-preference";
export const defaultTheme: Theme = "dark";
export const defaultThemePreference: ThemePreference = "dark";

export function loadTheme(): Theme {
  if (typeof window === "undefined") return defaultTheme;
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return defaultTheme;
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable — preference just won't persist across reloads
  }
}

export function loadThemePreference(): ThemePreference {
  if (typeof window === "undefined") return defaultThemePreference;
  try {
    const raw = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (raw === "dark" || raw === "light" || raw === "system") return raw;
  } catch {
    // storage unavailable — fall back to the default below
  }
  return defaultThemePreference;
}

export function saveThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // storage unavailable — preference just won't persist across reloads
  }
}

/** Resolves "system" against the OS-level color-scheme query; explicit
 * dark/light preferences pass straight through unchanged. */
export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined" || !window.matchMedia) return defaultTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Flips the [data-theme] attribute the CSS light-mode override in
 * globals.css is keyed on. Dark has no attribute at all, so it's always the
 * safe fallback if this never runs. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}
