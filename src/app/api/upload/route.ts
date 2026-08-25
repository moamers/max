import { NextRequest, NextResponse } from "next/server";
import { parseWorkbook } from "@/lib/parser";
import { listAttentionTransactions, savePeriod } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import {
  isWholeMondayToSundayPeriod,
  proposeImportedPeriodDates,
  proposePeriodAroundDate,
} from "@/lib/periods";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!/\.xlsx$/i.test(file.name)) {
    return NextResponse.json({ error: "Only .xlsx files are supported" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsedResult;
  try {
    parsedResult = await parseWorkbook(buffer, file.name);
  } catch {
    return NextResponse.json({ error: "Could not read this file as a valid .xlsx workbook" }, { status: 400 });
  }

  const { periods, rawGrids, mapping } = parsedResult;

  if (periods.length === 0) {
    return NextResponse.json(
      {
        error:
          "No pay-period sheets recognized in this workbook. It may not match the expected template.",
        sheetNames: rawGrids.map((g) => g.sheetName),
      },
      { status: 422 }
    );
  }

  const mode = formData.get("mode") === "save" ? "save" : "preview";
  const dateProposals = periods.map((period) => {
    const maxWeek = Math.max(0, ...period.lineItems.map((item) => item.weekNumber ?? 0));
    const proposed = proposeImportedPeriodDates(period.label) ?? proposePeriodAroundDate(new Date(), maxWeek >= 5 ? 5 : 4);
    return {
      sheetOrder: period.sheetOrder,
      label: period.label,
      startDate: proposed.startDate,
      endDate: proposed.endDate,
      yearWasExplicit: proposed.yearWasExplicit,
    };
  });

  const lineItems = periods.flatMap((period) => period.lineItems);
  const labels = [...new Set(lineItems.map((item) => item.tag).filter((label): label is string => Boolean(label)))];
  const attentionCount = lineItems.filter((item) => item.needsAttention).length;
  const latestPeriod = periods.at(-1);
  const firstWeekNumber = Math.min(
    ...((latestPeriod?.budgets ?? [])
      .map((budget) => budget.weekNumber)
      .filter((week): week is number => week !== null))
  );
  const yourWeek = Number.isFinite(firstWeekNumber)
    ? (latestPeriod?.budgets ?? [])
        .filter((budget) => budget.weekNumber === firstWeekNumber)
        .reduce((sum, budget) => sum + budget.budgetedAmount, 0)
    : 0;
  const preview = {
    fileName: file.name,
    sheetCount: rawGrids.length,
    rowCount: rawGrids.reduce((sum, grid) => sum + grid.rows.length, 0),
    lineItemCount: lineItems.length,
    periodCount: periods.length,
    dates: dateProposals,
    attentionCount,
    labels,
    income: periods.reduce((sum, period) => sum + (period.income ?? 0), 0),
    recurring: lineItems.filter((item) => item.section === "bills").reduce((sum, item) => sum + item.amount, 0),
    weekly: yourWeek,
  };

  if (mode === "preview") {
    return NextResponse.json({
      preview,
      mapping: {
        strategy: mapping.strategy,
        confidence: mapping.confidence,
        derivedBy: mapping.derivedBy,
        notes: mapping.notes,
        sheets: mapping.sheets.map((s) => ({ sheet: s.sheetName, role: s.role })),
      },
    });
  }

  let overrides: Array<{ sheetOrder: number; startDate: string; endDate: string }>;
  try {
    const raw = formData.get("periodDates");
    const parsed: unknown = JSON.parse(typeof raw === "string" ? raw : "[]");
    if (!Array.isArray(parsed)) throw new Error("not an array");
    overrides = parsed.filter(
      (value): value is { sheetOrder: number; startDate: string; endDate: string } =>
        typeof value === "object" && value !== null &&
        typeof value.sheetOrder === "number" &&
        typeof value.startDate === "string" &&
        typeof value.endDate === "string"
    );
  } catch {
    return NextResponse.json({ error: "Check the period dates and try again." }, { status: 400 });
  }

  for (const period of periods) {
    const override = overrides.find((value) => value.sheetOrder === period.sheetOrder);
    if (!override || !isWholeMondayToSundayPeriod(override.startDate, override.endDate)) {
      return NextResponse.json(
        { error: "Each period must run from Monday to Sunday for four or five whole weeks." },
        { status: 400 }
      );
    }
    period.startDate = override.startDate;
    period.endDate = override.endDate;
  }

  const saved = await Promise.all(
    periods.map(async (p) => ({
      label: p.label,
      periodId: await savePeriod(user.id, p, file.name),
      lineItemCount: p.lineItems.length,
      budgetCount: p.budgets.length,
      income: p.income,
    }))
  );
  const attention = await listAttentionTransactions(user.id, saved.map((period) => period.periodId));

  const debug = req.nextUrl.searchParams.get("debug") === "1";

  return NextResponse.json({
    saved,
    preview,
    attention,
    sheetNames: rawGrids.map((g) => g.sheetName),
    // How the workbook was understood — surfaced so a wrong reading is visible
    // rather than silent, which is how F-1 went unnoticed.
    mapping: {
      strategy: mapping.strategy,
      confidence: mapping.confidence,
      derivedBy: mapping.derivedBy,
      notes: mapping.notes,
      sheets: mapping.sheets.map((s) => ({ sheet: s.sheetName, role: s.role })),
    },
    ...(debug ? { rawGrids, parsedPeriods: periods } : {}),
  });
}
