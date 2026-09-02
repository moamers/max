"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { BottomNav, navClearance } from "@/components/nav/BottomNav";
import { Arrival } from "./Arrival";
import { MonthSections } from "./MonthSections";
import { ChangeMonthSheet } from "./ChangeMonthSheet";
import { HeroCard, type HeroMode } from "./HeroCard";
import { Counterbalance } from "@/components/brand/Counterbalance";
import type { HomeData } from "./types";
import { YearStrip } from "./YearStrip";
import { RolloverPrompt } from "./RolloverPrompt";

/**
 * README screen 02, assembled. Everything below the month bar is a card in
 * a 22px-gap column (README: "Vertical scroll, 20px gutter, 22px gaps").
 *
 * Rendered as a fixed, viewport-filling frame rather than inline page
 * content: `Sheet` (used by the month picker) positions itself `absolute`
 * against "the nearest positioned ancestor, 46px down, full height" — the
 * phone-frame assumption baked into `src/components/ui/Sheet.tsx`. A
 * `position: relative` block sized by its own scrolling content can't
 * satisfy that (its height is exactly the content's height, so "anchor to
 * the bottom" would mean "the bottom of everything", not "the bottom of
 * what's on screen"), so this screen supplies the same kind of fixed,
 * full-height frame the styleguide's Sheet demos wrap around it by hand.
 *
 * The hamburger and its drawer are gone (Task F). Settings is a nav
 * destination now, which is why nothing here reads the brand preference any
 * more — the only thing that wanted it was the drawer's theme switch, and it
 * reads it on `/settings` instead.
 */
export function HomeScreen({ data }: { data: HomeData }) {
  const [heroMode, setHeroMode] = useState<HeroMode>("forecast");
  // Collapsed by default: the home screen answers "where do I stand" first,
  // and a five-week list pushes everything else below the fold.
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  // The nav's Week item points at the live week of the period on screen. When
  // none is live — a month already ended, or not yet started — that period's
  // week 1 is the honest answer; borrowing today's calendar week would name a
  // week of a different month. Same rule as `currentWeekOf` in routes.ts,
  // read off the week views this screen was already given.
  const navWeek = data.weeks.find((week) => week.isLive)?.weekNumber ?? 1;

  return (
    /* `data-fold-screen` / `data-fold-body`: what a scope change photographs on
       the way out, and what folds on the way in. The body is the scroller and
       not this frame, so the nav pill inside it never scales — fold-runtime.ts. */
    <div data-fold-screen="" style={{ position: "fixed", inset: 0, background: "var(--bg)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      <Arrival />
      <div data-fold-body="" style={{ flex: 1, overflowY: "auto" }}>
        {/* Clearance belongs on the scroller, not the page: this screen is a
            fixed frame with an inner scrolling region, so page padding would
            sit outside the thing that actually scrolls. */}
        <div style={{ maxWidth: 480, margin: "0 auto", padding: `8px 20px ${navClearance(32)}`, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <button
              type="button"
              onClick={() => setMonthPickerOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit" }}
            >
              <Counterbalance size={24} idSuffix="home" />
              <span style={{ fontSize: "var(--type-title)", fontWeight: 800, letterSpacing: "-0.03em" }}>{data.monthLabel}</span>
              <span style={{ color: "var(--text-tertiary)", display: "flex" }}>
                <ChevronDownIcon />
              </span>
            </button>
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
              {data.todayLabel} · {data.weekCounter}
            </span>
          </div>

          <HeroCard hero={data.hero} mode={heroMode} onModeChange={setHeroMode} />

          {data.rollover && <RolloverPrompt proposal={data.rollover} />}

          <MonthSections
            periodId={data.selectedPeriodId}
            oneOffs={data.oneOffs}
            recurring={data.recurring}
            weeks={data.weeks}
            weeksSpent={data.weeksSummary.spent}
            weeksBudget={data.weeksSummary.budget}
          />

          <YearStrip year={data.year} periodId={data.selectedPeriodId} />
        </div>
      </div>

      <BottomNav active="month" periodId={data.selectedPeriodId} weekNumber={navWeek} />

      {monthPickerOpen && (
        <ChangeMonthSheet
          yearsByValue={data.yearsByValue}
          bounds={data.yearBounds}
          initialYear={data.year.year}
          onDismiss={() => setMonthPickerOpen(false)}
        />
      )}
    </div>
  );
}
