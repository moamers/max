import { describe, it, expect } from "vitest";
import {
  categoryFooter,
  formatDayMonth,
  formatGBP,
  formatSignedGBP,
  formatWeekRange,
  heroForecastSentence,
  heroTodaySentence,
  moneyState,
  monthAbbr,
  monthName,
  totalWeeklyBudget,
  totalWeeklySpent,
  weekCounterLabel,
  weekDates,
  weeksRemaining,
} from "../format";
import type { PeriodWindow, WeekTotals } from "@/lib/queries";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

describe("formatGBP / formatSignedGBP", () => {
  it("formats whole pounds with no decimals", () => {
    expect(formatGBP(703)).toBe("£703");
    expect(formatGBP(2975)).toBe("£2,975");
  });

  it("signs a net position with + or -", () => {
    expect(formatSignedGBP(1108)).toBe("+£1,108");
    expect(formatSignedGBP(-240)).toBe("-£240");
    expect(formatSignedGBP(0)).toBe("+£0");
  });
});

describe("date formatting", () => {
  it("formats a day-month pair", () => {
    expect(formatDayMonth(utc(2026, 7, 18))).toBe("18 Aug");
  });

  it("names the month", () => {
    expect(monthName(utc(2026, 7, 1))).toBe("August");
  });

  it("abbreviates a calendar index", () => {
    expect(monthAbbr(0)).toBe("Jan");
    expect(monthAbbr(11)).toBe("Dec");
  });

  it("formats a week range within one month", () => {
    expect(formatWeekRange(utc(2026, 7, 4), utc(2026, 7, 10))).toBe("4 – 10 Aug");
  });

  it("formats a week range spanning two months", () => {
    expect(formatWeekRange(utc(2026, 6, 28), utc(2026, 7, 3))).toBe("28 Jul – 3 Aug");
  });
});

describe("weekDates", () => {
  const window: PeriodWindow = {
    start: utc(2026, 7, 4),
    end: utc(2026, 8, 1),
    totalDays: 29,
    daysElapsed: 15,
    daysRemaining: 14,
    complete: false,
  };

  it("places week 1 at the period start", () => {
    const w1 = weekDates(1, window, utc(2026, 7, 5));
    expect(w1.start).toEqual(utc(2026, 7, 4));
    expect(w1.end).toEqual(utc(2026, 7, 10));
    expect(w1.isLive).toBe(true);
    expect(w1.isFuture).toBe(false);
  });

  it("flags a week that hasn't started yet", () => {
    const w4 = weekDates(4, window, utc(2026, 7, 5));
    expect(w4.isFuture).toBe(true);
    expect(w4.isLive).toBe(false);
  });

  it("clamps the last week to the period end", () => {
    const w5 = weekDates(5, window, utc(2026, 8, 1));
    expect(w5.end).toEqual(window.end);
  });
});

describe("moneyState — the week/category headline rule", () => {
  it("is lime 'left' while under budget", () => {
    expect(moneyState(140, 190, 50, false)).toEqual({ amount: 50, word: "left", tone: "lime" });
  });

  it("is red 'over' once spend passes the goal", () => {
    expect(moneyState(252, 190, -62, false)).toEqual({ amount: 62, word: "over", tone: "over" });
  });

  it("is grey 'budget' for a week that hasn't started", () => {
    expect(moneyState(0, 190, 190, true)).toEqual({ amount: 190, word: "budget", tone: "muted" });
  });

  it("falls back to a plain spent total when there's no goal", () => {
    expect(moneyState(75, null, null, false)).toEqual({ amount: 75, word: "spent", tone: "muted" });
  });
});

describe("categoryFooter", () => {
  it("reads 'left of £190' under budget", () => {
    expect(categoryFooter(190, { amount: 14, word: "left", tone: "lime" })).toBe("left of £190");
  });

  it("reads 'over £150' when over", () => {
    expect(categoryFooter(150, { amount: 62, word: "over", tone: "over" })).toBe("over £150");
  });

  it("reads 'budget £80' for a future week", () => {
    expect(categoryFooter(80, { amount: 80, word: "budget", tone: "muted" })).toBe("budget £80");
  });
});

describe("hero sentences", () => {
  it("counts weeks remaining, rounding up", () => {
    expect(weeksRemaining(14)).toBe(2);
    expect(weeksRemaining(8)).toBe(2);
    expect(weeksRemaining(0)).toBe(0);
  });

  it("matches the design's forecast sentence for 2 weeks to go", () => {
    expect(heroForecastSentence(14, "August")).toBe(
      "2 weeks to go. Spend the weekly budget that's left and this is where August lands."
    );
  });

  it("uses singular 'week' for exactly one week left", () => {
    expect(heroForecastSentence(3, "August")).toBe(
      "1 week to go. Spend the weekly budget that's left and this is where August lands."
    );
  });

  it("matches the design's today sentence", () => {
    expect(heroTodaySentence(14)).toBe("True, but 2 weeks of ordinary life hasn't happened yet.");
  });
});

describe("weekCounterLabel", () => {
  it("reads 'wk 4 of 5'", () => {
    expect(weekCounterLabel(4, 5)).toBe("wk 4 of 5");
  });
});

describe("totalWeeklyBudget / totalWeeklySpent", () => {
  const weeks: WeekTotals[] = [
    { weekNumber: 1, spent: 396, goal: 420, remaining: 24, categories: [] },
    { weekNumber: 2, spent: 300, goal: 420, remaining: 120, categories: [] },
  ];

  it("sums each week's goal", () => {
    expect(totalWeeklyBudget(weeks)).toBe(840);
  });

  it("sums each week's spend", () => {
    expect(totalWeeklySpent(weeks)).toBe(696);
  });

  it("is null when no week has a goal", () => {
    expect(totalWeeklyBudget([{ weekNumber: 1, spent: 10, goal: null, remaining: null, categories: [] }])).toBeNull();
  });
});
