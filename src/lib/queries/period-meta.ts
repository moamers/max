import { asc, eq } from "drizzle-orm";
import type { UserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { periods } from "@/lib/schema";
import { listPeriodSummaries } from "@/lib/store";
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
}

export type PeriodSearchParams = { [key: string]: string | string[] | undefined };

interface PeriodMetaRow {
  id: number;
  label: string;
  startDate: string | null;
  endDate: string | null;
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
    })
    .from(periods)
    .where(eq(periods.userId, userId))
    .orderBy(asc(periods.sheetOrder), asc(periods.id));

  return rows.map((row) => periodMetaFromRow(row, today));
}

/**
 * Home's date-aware selection policy. It is intentionally distinct from
 * `resolveSummaryOrderedPeriodId`, which preserves Week/Add/Money behaviour.
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

export type ExplicitPeriodPolicy = "finite" | "positive-integer";

/** The first value Next exposes for `?period=`, matching the existing callers. */
export function periodParamValue(searchParams: PeriodSearchParams): string | undefined {
  const raw = searchParams.period;
  return Array.isArray(raw) ? raw[0] : raw;
}

function explicitPeriodId(
  searchParams: PeriodSearchParams,
  policy: ExplicitPeriodPolicy
): number | null {
  const value = periodParamValue(searchParams);
  if (!value) return null;

  const periodId = Number(value);
  if (policy === "positive-integer") {
    return Number.isInteger(periodId) && periodId > 0 ? periodId : null;
  }
  return Number.isFinite(periodId) ? periodId : null;
}

/**
 * Week/Add/Money's legacy selection policy: accept an explicit id according to
 * the caller's existing validation, otherwise use the final summary row.
 *
 * This deliberately does not use `pickCurrentPeriodId`: summary rows are
 * ordered by sheet order then id, while Home selects from period dates.
 */
export async function resolveSummaryOrderedPeriodId(
  userId: UserId,
  searchParams: PeriodSearchParams,
  explicitPolicy: ExplicitPeriodPolicy
): Promise<number | null> {
  const explicit = explicitPeriodId(searchParams, explicitPolicy);
  if (explicit !== null) return explicit;

  const summaries = await listPeriodSummaries(userId);
  return summaries.at(-1)?.periodId ?? null;
}
