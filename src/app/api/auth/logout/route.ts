import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * R-10: leaving must never be harder than arriving. One POST, no confirmation
 * step, no retention offer. The session row is deleted server-side, so the
 * token is dead even if the cookie survives somewhere.
 */
export async function POST() {
  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
