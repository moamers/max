"use client";

import { useState } from "react";
import { SegmentedControl } from "../ui/SegmentedControl";
import {
  MODES,
  MODE_LABEL,
  MODE_COOKIE,
  PREFERENCE_MAX_AGE,
  THEMES,
  THEME_COOKIE,
  THEME_LABEL,
  modeAttribute,
  type ModeChoice,
  type ThemeId,
} from "@/lib/brand";

/**
 * The brand switch in the settings drawer: which theme, and which mode.
 *
 * How the flash is avoided
 * ------------------------
 * The choice lives in a cookie, and the server stamps `data-theme` (and
 * `data-mode`, when it is not "system") onto <html> in `layout.tsx`. The very
 * first bytes the browser receives already carry the right attributes, so
 * there is no window in which the wrong theme can be painted — not a narrower
 * window, none. A `localStorage` read in an effect repaints after first paint;
 * even the usual blocking inline script is a script the browser has to fetch,
 * parse and run before it can paint. A server-rendered attribute is neither.
 *
 * That leaves the "system" state, which the server genuinely cannot know. It is
 * handled in CSS: with no `data-mode` attribute, `brand-tokens.css` resolves
 * light or dark from `prefers-color-scheme`. So all three states are correct
 * before any JavaScript runs, and the app still honours the OS with JavaScript
 * disabled entirely.
 *
 * The write is a click, not a keystroke (AGENTS.md non-negotiable 8): one
 * `document.cookie` assignment per press — no server action, no route
 * revalidation, no database round trip, no query re-run.
 */
export function ThemeControls({
  theme: initialTheme,
  mode: initialMode,
}: {
  theme: ThemeId;
  mode: ModeChoice;
}) {
  // Seeded from the server-rendered value, so the first client render agrees
  // with the HTML and there is nothing to reconcile.
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  const [mode, setModeState] = useState<ModeChoice>(initialMode);

  function persist(name: string, value: string) {
    document.cookie = `${name}=${value}; path=/; max-age=${PREFERENCE_MAX_AGE}; samesite=lax`;
  }

  function chooseTheme(next: ThemeId) {
    setThemeState(next);
    persist(THEME_COOKIE, next);
    document.documentElement.setAttribute("data-theme", next);
  }

  function chooseMode(next: ModeChoice) {
    setModeState(next);
    persist(MODE_COOKIE, next);
    const attribute = modeAttribute(next);
    if (attribute === null) document.documentElement.removeAttribute("data-mode");
    else document.documentElement.setAttribute("data-mode", attribute);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Theme">
        <SegmentedControl
          value={theme}
          onChange={chooseTheme}
          options={THEMES.map((id) => ({
            value: id,
            label: THEME_LABEL[id],
            activeColor: "var(--lime-ink-on-fill)",
            activeBackground: "var(--lime-fill)",
          }))}
        />
      </Field>

      <Field label="Appearance">
        <SegmentedControl
          value={mode}
          onChange={chooseMode}
          options={MODES.map((id) => ({
            value: id,
            label: MODE_LABEL[id],
            activeColor: "var(--lime-ink-on-fill)",
            activeBackground: "var(--lime-fill)",
          }))}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={{ fontSize: "var(--type-body)", fontWeight: 600, letterSpacing: "-0.015em" }}>{label}</span>
      {children}
    </div>
  );
}
