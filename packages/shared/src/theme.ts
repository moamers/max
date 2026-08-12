/**
 * Chart/status palette, ported from the web app's former globals.css custom
 * properties. Kept as plain JS objects (rather than CSS variables) because
 * react-native-svg has no concept of CSS custom properties — the mobile app
 * selects light/dark by key from `useColorScheme()`. Web and native palettes
 * are defined once here so they can't drift apart.
 */

export interface ThemeTokens {
  page: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gridline: string;
  baseline: string;
  border: string;

  seriesBills: string;
  seriesExtras: string;
  seriesWeekly: string;

  good: string;
  warning: string;
  serious: string;
  critical: string;
  goodText: string;
}

export const lightTheme: ThemeTokens = {
  page: "#f9f9f7",
  surface: "#fcfcfb",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  textMuted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  border: "rgba(11, 11, 11, 0.1)",

  seriesBills: "#2a78d6",
  seriesExtras: "#eb6834",
  seriesWeekly: "#1baf7a",

  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  goodText: "#006300",
};

export const darkTheme: ThemeTokens = {
  page: "#0d0d0d",
  surface: "#1a1a19",
  textPrimary: "#ffffff",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  gridline: "#2c2c2a",
  baseline: "#383835",
  border: "rgba(255, 255, 255, 0.1)",

  seriesBills: "#3987e5",
  seriesExtras: "#d95926",
  seriesWeekly: "#199e70",

  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#e66767",
  goodText: "#0ca30c",
};

export function themeFor(colorScheme: "light" | "dark" | null | undefined): ThemeTokens {
  return colorScheme === "dark" ? darkTheme : lightTheme;
}
