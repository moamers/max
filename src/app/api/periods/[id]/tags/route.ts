import { NextRequest, NextResponse } from "next/server";
import { tagBreakdownForPeriod } from "@/lib/store";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const periodId = Number(id);

  if (!Number.isInteger(periodId)) {
    return NextResponse.json({ error: "Invalid period id" }, { status: 400 });
  }

  // Another user's period id yields an empty breakdown, never their rows.
  const tags = await tagBreakdownForPeriod(user.id, periodId);
  return NextResponse.json({ tags });
}
