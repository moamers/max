import { NextRequest, NextResponse } from "next/server";
import { tagBreakdownForPeriod } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const periodId = Number(id);

  if (!Number.isInteger(periodId)) {
    return NextResponse.json({ error: "Invalid period id" }, { status: 400 });
  }

  const tags = await tagBreakdownForPeriod(periodId);
  return NextResponse.json({ tags });
}
