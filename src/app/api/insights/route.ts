import { NextResponse } from "next/server";
import { listPeriodSummaries } from "@/lib/store";
import { computeInsights } from "@/lib/insights";

export const runtime = "nodejs";

export async function GET() {
  const periods = await listPeriodSummaries();
  return NextResponse.json(computeInsights(periods));
}
