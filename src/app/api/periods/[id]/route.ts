import { NextRequest, NextResponse } from "next/server";
import { deletePeriod } from "@/lib/store";

export const runtime = "nodejs";

/**
 * R-19: the user can delete their own records. Deleting a period cascades to
 * its line items, budgets and summary, so nothing is orphaned.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const periodId = Number(id);

  if (!Number.isInteger(periodId)) {
    return NextResponse.json({ error: "Invalid period id" }, { status: 400 });
  }

  const deleted = await deletePeriod(periodId);
  if (!deleted) {
    return NextResponse.json({ error: "No such period" }, { status: 404 });
  }

  return NextResponse.json({ deleted: periodId });
}
