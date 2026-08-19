import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { fakeVerifyPassword, normalizeEmail, toUserId, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

/** One message for every failure mode — wrong address, wrong password, locked row. */
const GENERIC_FAILURE = "Email or password is incorrect.";

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  const email = normalizeEmail(body.email);
  const password = body.password;

  // Bound the scrypt work an anonymous caller can buy with one request.
  if (password.length > 1024) {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // No early return on "no such user": the dummy hash keeps the response time
  // roughly constant so the endpoint doesn't become an account-existence oracle.
  const ok = user ? await verifyPassword(password, user.passwordHash) : await fakeVerifyPassword(password);

  if (!ok || !user) {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  await createSession(toUserId(user.id));

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
