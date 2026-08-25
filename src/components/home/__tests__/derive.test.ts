import { describe, it, expect } from "vitest";
import { buildWeekViews, weekCountForWindow } from "../derive";
import { dominantMonth, formatGBP, formatSignedGBP, moneyColor } from "../format";
import type { PeriodWindow, WeekTotals } from "@/lib/queries";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

// A 5-week August period with today mid-week-4 — the README's own sample numbers.
const window: PeriodWindow = {
  start: utc(2026, 7, 1),
  end: utc(2026, 7, 31),
  totalDays: 31,
  daysElapsed: 22,
  daysRemaining: 9,
  complete: false,
};
const today = utc(2026, 7, 22);

function week(weekNumber: number, everydaySpent: number, weekendSpent: number, transportSpent: number): WeekTotals {
  const categories = [
    { category: "everyday" as const, title: "Everyday", spent: everydaySpent, goal: 190, remaining: 190 - everydaySpent, count: 1 },
    { category: "weekend" as const, title: "Weekend", spent: weekendSpent, goal: 150, remaining: 150 - weekendSpent, count: 1 },
    { category: "transport" as const, title: "Transport", spent: transportSpent, goal: 80, remaining: 80 - transportSpent, count: 1 },
  ];
  const spent = everydaySpent + weekendSpent + transportSpent;
  const goal = 420;
  return { weekNumber, spent, goal, remaining: goal - spent, categories };
}

describe("weekCountForWindow", () => {
  it("derives 5 weeks from a 31-day window", () => {
    expect(weekCountForWindow(window, [])).toBe(5);
  });

  it("falls back to the highest week number when there's no window", () => {
    expect(weekCountForWindow(null, [week(1, 0, 0, 0), week(3, 0, 0, 0)])).toBe(3);
  });
});

describe("buildWeekViews", () => {
  it("fills in weeks the query has no rows for", () => {
    // Only weeks 1-3 have transactions; the period still spans 5 weeks.
    const rows = [week(1, 176, 100, 40), week(2, 150, 90, 30), week(3, 100, 80, 20)];
    const { weeks } = buildWeekViews(rows, window, today);

    expect(weeks).toHaveLength(5);
    // Week 4 (22-28 Aug) contains "today" (22 Aug) — live, not future.
    expect(weeks[3].spent).toBe(0);
    expect(weeks[3].isLive).toBe(true);
    expect(weeks[3].state.word).toBe("left");
    // Week 5 (29-31 Aug) hasn't started yet.
    expect(weeks[4].state.word).toBe("budget");
  });

  it("marks the week containing today as live, and reports it as the current week", () => {
    const { weeks, currentWeekNumber } = buildWeekViews([week(4, 50, 0, 0)], window, today);
    const live = weeks.filter((w) => w.isLive);
    expect(live).toHaveLength(1);
    expect(live[0].weekNumber).toBe(4);
    expect(currentWeekNumber).toBe(4);
  });

  it("turns over red once a week's spend passes its goal", () => {
    const { weeks } = buildWeekViews([week(1, 300, 300, 100)], window, today);
    expect(weeks[0].state.tone).toBe("over");
    expect(weeks[0].state.word).toBe("over");
    expect(weeks[0].state.amount).toBe(700 - 420);
  });

  it("totals the per-week budget across every week the period spans", () => {
    const { totalBudget } = buildWeekViews([week(1, 0, 0, 0)], window, today);
    expect(totalBudget).toBe(420 * 5);
  });

  it("is null when no category has a goal at all", () => {
    const noGoals: WeekTotals[] = [
      {
        weekNumber: 1,
        spent: 40,
        goal: null,
        remaining: null,
        categories: [
          { category: "everyday", title: "Everyday", spent: 40, goal: null, remaining: null, count: 1 },
          { category: "weekend", title: "Weekend", spent: 0, goal: null, remaining: null, count: 0 },
          { category: "transport", title: "Transport", spent: 0, goal: null, remaining: null, count: 0 },
        ],
      },
    ];
    const { totalBudget, weeks } = buildWeekViews(noGoals, null, today);
    expect(totalBudget).toBeNull();
    expect(weeks[0].state.word).toBe("spent");
  });
});

describe("dominantMonth", () => {
  const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day));

  it("names a period by the month holding most of its days", () => {
    // "Jun 30th - Aug 3rd": 1 day in June, 31 in July, 3 in August.
    expect(dominantMonth(d(2026, 5, 30), d(2026, 7, 3)).getUTCMonth()).toBe(6);
  });

  it("names a period that sits inside one month by that month", () => {
    expect(dominantMonth(d(2026, 7, 4), d(2026, 7, 31)).getUTCMonth()).toBe(7);
  });

  it("crosses a year boundary without losing the month", () => {
    // 1 Dec - 4 Jan: 31 days in December, 4 in January.
    const m = dominantMonth(d(2025, 11, 1), d(2026, 0, 4));
    expect(m.getUTCMonth()).toBe(11);
    expect(m.getUTCFullYear()).toBe(2025);
  });

  it("gives an exact split to the month it began in", () => {
    expect(dominantMonth(d(2026, 3, 16), d(2026, 4, 15)).getUTCMonth()).toBe(3);
  });
});

describe("money on screen keeps the pence the database stores", () => {
  it("shows pence when a figure has them", () => {
    // The database stores numeric(12,2); rounding to whole pounds on screen
    // made the app disagree with the founder's own spreadsheet.
    expect(formatGBP(199.47)).toBe("£199.47");
    expect(formatGBP(-30.02)).toBe("-£30.02");
    expect(formatGBP(6938.03)).toBe("£6,938.03");
  });

  it("still shows whole pounds without a trailing .00", () => {
    expect(formatGBP(260)).toBe("£260");
    expect(formatGBP(0)).toBe("£0");
  });

  it("keeps pence in the year strip's signed figure too", () => {
    // Pence are all-or-nothing: £1,108.50 is money, "£1,108.5" is a number
    // that happens to be about money.
    expect(formatSignedGBP(1108.5)).toBe("+£1,108.50");
    expect(formatSignedGBP(-240.25)).toBe("-£240.25");
  });
});

describe("money colour follows the sign, not the label", () => {
  const LIME = "var(--lime-ink)";
  const RED = "var(--bar-over)";
  const MUTED = "var(--text-tertiary)";

  it("colours by which side of zero a figure sits", () => {
    expect(moneyColor(1200)).toBe(LIME);
    expect(moneyColor(-30.02)).toBe(RED);
  });

  it("treats break-even as not-negative", () => {
    expect(moneyColor(0)).toBe(LIME);
  });

  it("mutes an unknown rather than calling it bad news", () => {
    expect(moneyColor(null)).toBe(MUTED);
    expect(moneyColor(undefined)).toBe(MUTED);
  });

  it("does not care what the figure is called", () => {
    // The regression: "worst month" was painted red whether or not it was
    // negative, so a year where every month finished ahead still showed red.
    const worstMonthButStillPositive = 640;
    expect(moneyColor(worstMonthButStillPositive)).toBe(LIME);
  });
});
