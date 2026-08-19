import { NextResponse } from "next/server";
import {
  listPeriodSummaries,
  weeklyTotalsForPeriod,
  sectionTotalsForPeriod,
  tagBreakdownForPeriod,
} from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { computeInsights } from "@/lib/insights";
import { buildNarrative, type SectionTotals } from "@/lib/narrative";

export const runtime = "nodejs";

const EMPTY_SECTIONS: SectionTotals = {
  bills: 0,
  extras: 0,
  grocery: 0,
  weekend: 0,
  transport: 0,
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const periods = await listPeriodSummaries(user.id);
  const insights = computeInsights(periods);

  if (!insights.latest) {
    return NextResponse.json({ ...insights, narrative: [], weeks: [] });
  }

  const periodId = insights.latest.periodId;
  const [weeks, sectionRows, tags] = await Promise.all([
    weeklyTotalsForPeriod(user.id, periodId),
    sectionTotalsForPeriod(user.id, periodId),
    tagBreakdownForPeriod(user.id, periodId),
  ]);

  const sections = sectionRows.reduce<SectionTotals>(
    (acc, r) => (r.section in acc ? { ...acc, [r.section]: r.total } : acc),
    { ...EMPTY_SECTIONS }
  );

  const narrative = buildNarrative({
    periodLabel: insights.latest.label,
    income: insights.latest.income,
    sections,
    weeks,
    tags,
    insights,
  });

  return NextResponse.json({ ...insights, narrative, weeks, sections });
}
