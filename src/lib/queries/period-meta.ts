import { asc, eq, sql } from "drizzle-orm";
import type { UserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { periods, transactions } from "@/lib/schema";
import { periodWindow, type PeriodWindow } from "./period-window";

export interface PeriodMeta {
  id: number;
  label: string;
  /** Null when the period's dates can't be established — see `periodWindow`. */
  window: PeriodWindow | null;
  /**
   * Start date read from persisted data only. Unlike `window.start`, its year
   * is safe for Year to display because it was not inferred from a label.
   */
  recordedStart: Date | null;
  /** Pending is deliberately excluded; only unresolved placement/state marks a period. */
  hasAttention?: boolean;
}

export type PeriodSearchParams = { [key: string]: string | string[] | undefined };

interface PeriodMetaRow {
  id: number;
  label: string;
  startDate: string | null;
  endDate: string | null;
  hasAttention?: boolean;
}

function recordedDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

/** Pure row mapping kept inspectable so persisted-date provenance is testable. */
export function periodMetaFromRow(row: PeriodMetaRow, today: Date = new Date()): PeriodMeta {
  return {
    id: row.id,
    label: row.label,
    window: periodWindow(
      { label: row.label, startDate: row.startDate, endDate: row.endDate },
      today
    ),
    recordedStart: recordedDate(row.startDate),
    hasAttention: row.hasAttention ?? false,
  };
}

export async function listPeriodsMeta(userId: UserId, today: Date = new Date()): Promise<PeriodMeta[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: periods.id,
      label: periods.label,
      startDate: periods.startDate,
      endDate: periods.endDate,
      hasAttention: sql<boolean>`exists (
        select 1 from ${transactions}
        where ${transactions.periodId} = ${periods.id}
          and ${transactions.needsAttention} = true
      )`,
    })
    .from(periods)
    .where(eq(periods.userId, userId))
    .orderBy(asc(periods.sheetOrder), asc(periods.id));

  return rows.map((row) => periodMetaFromRow(row, today));
}

/**
 * Which period is "now": the one currently running, else the latest to have
 * ended. Every screen goes through `resolvePeriodId` to get here — this is not
 * Home's private rule any more.
 */
export function pickCurrentPeriodId(list: PeriodMeta[]): number | null {
  if (list.length === 0) return null;

  const live = list.find(
    (period) => period.window && !period.window.complete && period.window.daysElapsed > 0
  );
  if (live) return live.id;

  const dated = list.filter(
    (period): period is PeriodMeta & { window: PeriodWindow } => period.window !== null
  );
  if (dated.length > 0) {
    return dated.reduce((latest, period) =>
      period.window.end.getTime() > latest.window.end.getTime() ? period : latest
    ).id;
  }

  return list[list.length - 1].id;
}

/** Finds a period this user owns by id, for validating a `?period=` search param. */
export function findPeriod(list: PeriodMeta[], id: number | null): PeriodMeta | null {
  if (id === null) return null;
  return list.find((period) => period.id === id) ?? null;
}

/** The first value Next exposes for `?period=`, matching the existing callers. */
export function periodParamValue(searchParams: PeriodSearchParams): string | undefined {
  const raw = searchParams.period;
  return Array.isArray(raw) ? raw[0] : raw;
}

function explicitPeriodId(searchParams: PeriodSearchParams): number | null {
  const value = periodParamValue(searchParams);
  if (!value) return null;
  const periodId = Number(value);
  return Number.isInteger(periodId) && periodId > 0 ? periodId : null;
}

/**
 * Which period a screen is showing. One policy, for every screen.
 *
 * There used to be two. Home picked by date (the live period, else the latest
 * to end); Week, Add, Recurring and One-offs picked the last row of the
 * imported workbook by sheet order. Those two answers are the same only while
 * the newest sheet is also the current month — so the dashboard would show
 * August, you would tap a week inside it, and land on the same week *number*
 * of some other month. The screens weren't disagreeing about the data; they
 * were each choosing their own month and not saying so.
 *
 * An explicit `?period=` still wins, but only if the user actually owns it: a
 * stale id (a bookmark from before a re-import, say) falls back to the current
 * period rather than rendering an empty screen for a period that is gone. Every
 * screen names its month in the header, so the fallback is visible, not silent.
 */
export async function resolvePeriodId(
  userId: UserId,
  searchParams: PeriodSearchParams,
  today: Date = new Date()
): Promise<number | null> {
  const list = await listPeriodsMeta(userId, today);
  if (list.length === 0) return null;
  return findPeriod(list, explicitPeriodId(searchParams))?.id ?? pickCurrentPeriodId(list);
}
