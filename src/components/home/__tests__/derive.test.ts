import { describe, it, expect } from "vitest";
import { buildWeekViews, weekCountForWindow } from "../derive";
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
