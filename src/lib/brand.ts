/**
 * Ravel brand constants, and the theme/mode preference contract.
 *
 * Pure data and pure functions — no `next/*`, no React, no request context — so
 * both the server layout and the client control can import it, and so it is
 * unit-testable without a server (T-11).
 */

/** The product name, in one place, so a rename is one edit rather than forty. */
export const APP_NAME = "Ravel";

/** The mark's name, used where the logo itself is described. */
export const MARK_NAME = "Counterbalance";

export const APP_DESCRIPTION =
  "A personal wealth agent that reads your budget and tells you where you stand.";

// ------------------------------------------------------------------- themes

export const THEMES = ["quiet-voltage", "butter-static"] as const;
export type ThemeId = (typeof THEMES)[number];

/** Matches the bare-attribute default in `brand-tokens.css`. */
export const DEFAULT_THEME: ThemeId = "quiet-voltage";

export const THEME_LABEL: Record<ThemeId, string> = {
  "quiet-voltage": "Quiet Voltage",
  "butter-static": "Butter Static",
};

/**
 * Three states, not two. "system" is a real, storable choice — it is what
 * someone who has never touched the switch has, and it is what they can go
 * back to. It is stored rather than represented by an absent cookie so the
 * server always knows which segment to render as selected, which is what keeps
 * the control from hydrating into a different answer than it was rendered with.
 */
export const MODES = ["system", "light", "dark"] as const;
export type ModeChoice = (typeof MODES)[number];

export const DEFAULT_MODE: ModeChoice = "system";

export const MODE_LABEL: Record<ModeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

// ------------------------------------------------------------------ cookies

/**
 * Cookies, not the database.
 *
 * A theme preference is per-browser presentation, not user data: it needs no
 * schema, no migration, and no user-scoped query. It also has to be readable
 * *before the page renders*, which a database read in a client effect cannot
 * be. Both cookies are deliberately not HttpOnly — the switch writes them from
 * the click handler so the change is instant — and they carry no identity.
 */
export const THEME_COOKIE = "ravel-theme";
export const MODE_COOKIE = "ravel-mode";

/** One year. Long enough that a preference outlives the session it was set in. */
export const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseTheme(raw: string | undefined | null): ThemeId {
  return THEMES.includes(raw as ThemeId) ? (raw as ThemeId) : DEFAULT_THEME;
}

export function parseMode(raw: string | undefined | null): ModeChoice {
  return MODES.includes(raw as ModeChoice) ? (raw as ModeChoice) : DEFAULT_MODE;
}

/**
 * The `data-mode` attribute value for a stored choice.
 *
 * "system" maps to `null` — the attribute is left OFF, and `brand-tokens.css`
 * resolves the mode from `prefers-color-scheme` in CSS alone. That is the whole
 * anti-flash story: nothing is read from storage in an effect, nothing repaints
 * after first paint, and the OS is honoured even with JavaScript disabled.
 */
export function modeAttribute(mode: ModeChoice): "light" | "dark" | null {
  return mode === "system" ? null : mode;
}
