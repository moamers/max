"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { ChevronDownIcon, HamburgerIcon } from "@/components/ui/icons";
import { Menu } from "@/components/menu/Menu";
import { ChangeMonthSheet } from "./ChangeMonthSheet";
import { formatGBP } from "./format";
import { HeroCard, type HeroMode } from "./HeroCard";
import { MaxMark } from "./MaxMark";
import type { HomeData } from "./types";
import { WeeksCard } from "./WeeksCard";
import { YearStrip } from "./YearStrip";
import { RolloverPrompt } from "./RolloverPrompt";

/**
 * README screen 02, assembled. Everything below the month bar is a card in
 * a 22px-gap column (README: "Vertical scroll, 20px gutter, 22px gaps").
 *
 * Rendered as a fixed, viewport-filling frame rather than inline page
 * content: `Sheet` (used by the month picker) and this screen's own menu
 * drawer both position themselves `absolute` against "the nearest
 * positioned ancestor, 46px down, full height" — the phone-frame
 * assumption baked into `src/components/ui/Sheet.tsx`. A `position:
 * relative` block sized by its own scrolling content can't satisfy that
 * (its height is exactly the content's height, so "anchor to the bottom"
 * would mean "the bottom of everything", not "the bottom of what's on
 * screen"), so this screen supplies the same kind of fixed, full-height
 * frame the styleguide's Sheet demos wrap around it by hand.
 */
export function HomeScreen({ data }: { data: HomeData }) {
  const [heroMode, setHeroMode] = useState<HeroMode>("forecast");
  // Collapsed by default: the home screen answers "where do I stand" first,
  // and a five-week list pushes everything else below the fold.
  const [weeksOpen, setWeeksOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <button
              type="button"
              onClick={() => setMonthPickerOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit" }}
            >
              <MaxMark size={24} />
              <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.03em" }}>{data.monthLabel}</span>
              <span style={{ color: "var(--text-tertiary)", display: "flex" }}>
                <ChevronDownIcon />
              </span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                {data.todayLabel} · {data.weekCounter}
              </span>
              <IconButton size="sm" icon={<HamburgerIcon />} aria-label="Open menu" onClick={() => setMenuOpen(true)} />
            </div>
          </div>

          <HeroCard hero={data.hero} mode={heroMode} onModeChange={setHeroMode} />

          {data.rollover && <RolloverPrompt proposal={data.rollover} />}

          <WeeksCard weeks={data.weeks} summary={data.weeksSummary} open={weeksOpen} onToggle={() => setWeeksOpen((v) => !v)} />

          <Link href="/recurring" style={{ color: "inherit", textDecoration: "none" }}>
            <Card interactive>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>Recurring</span>
                <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.025em" }}>{formatGBP(data.recurringTotal)}</span>
              </div>
            </Card>
          </Link>

          <Link href="/one-offs" style={{ color: "inherit", textDecoration: "none" }}>
            <Card interactive>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>One-offs</span>
                <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.025em" }}>{formatGBP(data.oneOffsTotal)}</span>
              </div>
            </Card>
          </Link>

          <YearStrip year={data.year} />
        </div>
      </div>

      {monthPickerOpen && (
        <ChangeMonthSheet
          yearsByValue={data.yearsByValue}
          bounds={data.yearBounds}
          initialYear={data.year.year}
          onDismiss={() => setMonthPickerOpen(false)}
        />
      )}

      {menuOpen && <Menu periodCount={data.periodOptions.length} onDismiss={() => setMenuOpen(false)} />}
    </div>
  );
}
