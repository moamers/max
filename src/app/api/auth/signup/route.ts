import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, normalizeEmail, toUserId, validateCredentials } from "@/lib/auth";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

interface Body {
  email?: unknown;
  password?: unknown;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = body.password;

  const problems = validateCredentials(email, password);
  if (problems.length > 0) {
    return NextResponse.json({ error: problems[0].message, problems }, { status: 400 });
  }

  const db = getDb();
  const passwordHash = await hashPassword(password);

  let created: { id: string; email: string } | undefined;
  try {
    [created] = await db
      .insert(users)
      .values({ email, passwordHash })
      // Race-safe: two simultaneous signups for the same address can't both
      // win, and the loser gets the same message as a plain duplicate.
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id, email: users.email });
  } catch {
    return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
  }

  if (!created) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    // R-20: no surprises. Telling someone the address is taken is the honest
    // answer to a question they're about to be blocked on anyway; the
    // enumeration risk this leaks is one a signup form can't avoid.
    return NextResponse.json(
      { error: existing ? "That email is already registered. Try signing in." : "Could not create the account." },
      { status: existing ? 409 : 500 }
    );
  }

  await createSession(toUserId(created.id));

  return NextResponse.json({ user: { id: created.id, email: created.email } }, { status: 201 });
}
