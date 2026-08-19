import { NextRequest, NextResponse } from "next/server";
import { deletePeriod } from "@/lib/store";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

/**
 * R-19: the user can delete their own records. Deleting a period cascades to
 * its line items, budgets and summary, so nothing is orphaned.
 *
 * The delete is scoped to the signed-in user, so another user's period id
 * returns the same 404 as an id that doesn't exist — no existence oracle.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const periodId = Number(id);

  if (!Number.isInteger(periodId)) {
    return NextResponse.json({ error: "Invalid period id" }, { status: 400 });
  }

  const deleted = await deletePeriod(user.id, periodId);
  if (!deleted) {
    return NextResponse.json({ error: "No such period" }, { status: 404 });
  }

  return NextResponse.json({ deleted: periodId });
}
