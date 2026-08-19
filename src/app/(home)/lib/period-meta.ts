/**
 * Home (02), Change month (09) and the year strip all need to enumerate a
 * user's periods and place them on a calendar — which one is "this month",
 * which calendar month each one falls in. Nothing in `src/lib/queries`
 * lists periods at all (every exported query takes a `periodId` you
 * already have); this is the minimal read that gets one — id, label and
 * dates only, no aggregation. See the implementation report for why this
 * lives here (under the routes/components this agent owns) instead of
 * `src/lib/queries`, which this agent was told not to add to.
 */
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { periods } from "@/lib/schema";
import type { UserId } from "@/lib/auth";
import { periodWindow, type PeriodWindow } from "@/lib/queries";

export interface PeriodMeta {
  id: number;
  label: string;
  /** Null when the period's dates can't be established — see `periodWindow`. */
  window: PeriodWindow | null;
}

export async function listPeriodsMeta(userId: UserId, today: Date = new Date()): Promise<PeriodMeta[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: periods.id,
      label: periods.label,
      startDate: periods.startDate,
      endDate: periods.endDate,
    })
    .from(periods)
    .where(eq(periods.userId, userId))
    .orderBy(asc(periods.sheetOrder), asc(periods.id));

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    window: periodWindow({ label: r.label, startDate: r.startDate, endDate: r.endDate }, today),
  }));
}

/**
 * The period "today" falls inside, per its window (windows are already
 * resolved relative to today by `listPeriodsMeta`). Falls back to the most
 * recently ended dated period, then to the last row of all, so the home
 * screen always has something to show rather than nothing at all.
 */
export function pickCurrentPeriodId(list: PeriodMeta[]): number | null {
  if (list.length === 0) return null;

  const live = list.find((p) => p.window && !p.window.complete && p.window.daysElapsed > 0);
  if (live) return live.id;

  const dated = list.filter((p): p is PeriodMeta & { window: PeriodWindow } => p.window !== null);
  if (dated.length > 0) {
    return dated.reduce((latest, p) => (p.window.end.getTime() > latest.window.end.getTime() ? p : latest)).id;
  }

  return list[list.length - 1].id;
}

/** Finds a period this user owns by id, for validating a `?period=` search param. */
export function findPeriod(list: PeriodMeta[], id: number | null): PeriodMeta | null {
  if (id === null) return null;
  return list.find((p) => p.id === id) ?? null;
}
