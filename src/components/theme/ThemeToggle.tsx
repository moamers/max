"use client";

import { SegmentedControl } from "../ui/SegmentedControl";
import { useTheme } from "./useTheme";

/**
 * Screen 10's Appearance row: a Dark|Light segmented pill. The active mode
 * is a lime pill; picking the other one switches immediately and persists.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <SegmentedControl
      value={theme}
      onChange={setTheme}
      options={[
        { value: "dark", label: "Dark", activeColor: "var(--lime-ink-on-fill)", activeBackground: "var(--lime-fill)" },
        { value: "light", label: "Light", activeColor: "var(--lime-ink-on-fill)", activeBackground: "var(--lime-fill)" },
      ]}
    />
  );
}
