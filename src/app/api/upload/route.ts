import { NextRequest, NextResponse } from "next/server";
import { parseWorkbook } from "@/lib/parser";
import { savePeriod } from "@/lib/store";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
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

  const saved = await Promise.all(
    periods.map(async (p) => ({
      label: p.label,
      periodId: await savePeriod(p, file.name),
      lineItemCount: p.lineItems.length,
      budgetCount: p.budgets.length,
      income: p.income,
    }))
  );

  const debug = req.nextUrl.searchParams.get("debug") === "1";

  return NextResponse.json({
    saved,
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
