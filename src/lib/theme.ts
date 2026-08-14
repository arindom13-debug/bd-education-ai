export type Theme = "dark" | "light";

const STORAGE_KEY = "arindoms-ai-theme";
export const defaultTheme: Theme = "dark";

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

/** Flips the [data-theme] attribute the CSS light-mode override in
 * globals.css is keyed on. Dark has no attribute at all, so it's always the
 * safe fallback if this never runs. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}
