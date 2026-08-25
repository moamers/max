/**
 * View models the server (src/app/page.tsx) builds from the query layer and
 * hands to the client components below. Kept separate from the query
 * types (`@/lib/queries`) because these add only *presentation* shape —
 * which word, which colour, which date string — never new arithmetic.
 */
import type { MoneyState } from "./format";

export interface CategoryView {
  category: string;
  title: string;
  spent: number;
  goal: number | null;
  state: MoneyState;
  footer: string;
}

export interface WeekView {
  weekNumber: number;
  range: string;
  isLive: boolean;
  spent: number;
  goal: number | null;
  state: MoneyState;
  categories: CategoryView[];
}

export interface HeroView {
  monthName: string;
  endOfMonthLabel: string;
  daysRemaining: number;
  today: {
    spare: number | null;
    spend: number;
  };
  forecast: {
    spare: number | null;
    spend: number | null;
  };
  income: number | null;
}

export interface WeeksSummaryView {
  left: number | null;
  spent: number;
  budget: number | null;
}

export interface MonthTileView {
  monthIndex: number; // 0-11
  monthLabel: string; // "Jan".."Dec"
  periodId: number | null;
  net: number | null;
  isCurrent: boolean;
  hasAttention: boolean;
}

export interface YearView {
  year: number;
  months: MonthTileView[];
  netPosition: number | null;
  sparkline: number[];
}

export interface PeriodOptionView {
  id: number;
  monthLabel: string;
}

export interface HomeData {
  monthLabel: string;
  todayLabel: string;
  weekCounter: string;
  hero: HeroView;
  weeks: WeekView[];
  weeksSummary: WeeksSummaryView;
  recurringTotal: number;
  oneOffsTotal: number;
  year: YearView;
  yearsByValue: Record<number, YearView>;
  yearBounds: { min: number; max: number };
  currentPeriodId: number;
  selectedPeriodId: number;
  periodOptions: PeriodOptionView[];
  rollover: import("./RolloverPrompt").RolloverView | null;
}
