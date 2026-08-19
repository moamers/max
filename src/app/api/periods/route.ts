import { NextResponse } from "next/server";
import { listPeriodSummaries } from "@/lib/store";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  // Authoritative check. The proxy only saw that *a* cookie existed.
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const periods = await listPeriodSummaries(user.id);
  return NextResponse.json({ periods });
}
