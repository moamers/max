"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-init-script";

export type ThemeChoice = "dark" | "light";

function readStoredTheme(): ThemeChoice | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

function getMedia(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-color-scheme: dark)");
}

/** Fires on system theme changes and on our own same-tab writes (see setTheme/followSystem below). */
function subscribe(onStoreChange: () => void) {
  const media = getMedia();
  media?.addEventListener("change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    media?.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot(): ThemeChoice {
  const stored = readStoredTheme();
  if (stored) return stored;
  return getMedia()?.matches ? "dark" : "light";
}

// Matches globals.css's bare-:root (light) default so SSR and first client
// render never disagree.
function getThemeServerSnapshot(): ThemeChoice {
  return "light";
}

function getIsExplicitSnapshot(): boolean {
  return readStoredTheme() !== null;
}

function getIsExplicitServerSnapshot(): boolean {
  return false;
}

/**
 * The small client-side theme mechanism the styleguide (and eventually the
 * Appearance row on screen 10) drives: an explicit choice is persisted and
 * stamped as `data-theme` on <html>; with no explicit choice it honours
 * `prefers-color-scheme` (handled by globals.css alone — this hook just
 * needs to know which state to show as "active" in the switch).
 *
 * Reads through useSyncExternalStore rather than effect+setState so a
 * system theme change or a same-tab write is picked up via subscription,
 * not a render-triggering side effect.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getThemeServerSnapshot);
  const isExplicit = useSyncExternalStore(subscribe, getIsExplicitSnapshot, getIsExplicitServerSnapshot);

  const setTheme = useCallback((next: ThemeChoice) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
    // The native `storage` event only fires in *other* tabs; dispatch it
    // ourselves so this tab's subscribers (including this hook) re-read.
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
  }, []);

  const followSystem = useCallback(() => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute("data-theme");
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
  }, []);

  return { theme, isExplicit, setTheme, followSystem };
}
