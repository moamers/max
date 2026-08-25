import type { UserId } from "@/lib/auth";
import { listPeriodSummaries } from "@/lib/store";

export type MoneySearchParams = { [key: string]: string | string[] | undefined };

/** Accept an explicit Home/month-picker period, otherwise match the existing Week/Add fallback. */
export async function resolveMoneyPeriodId(
  userId: UserId,
  searchParams: MoneySearchParams
): Promise<number | null> {
  const raw = searchParams.period;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value) {
    const periodId = Number(value);
    if (Number.isInteger(periodId) && periodId > 0) return periodId;
  }

  const summaries = await listPeriodSummaries(userId);
  return summaries.at(-1)?.periodId ?? null;
}
