import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { setGoal, setDefaultMonthlyIncome, listGoals, getDefaultMonthlyIncome } from "@/lib/store";
import { WEEKLY_CATEGORIES } from "@/lib/transactions";

export const dynamic = "force-dynamic";

/**
 * Diagnostic. Runs exactly the writes the goals screen runs, one at a time, and
 * reports what the database actually said.
 *
 * It exists because a Server Action failure reaches production as a digest —
 * the founder saw "an unexpected response was received from the server" and the
 * logs saw a number, so three rounds of diagnosis were guesswork. A plain route
 * handler is not redacted, is not RSC-encoded, and cannot go stale against a
 * client bundle from a previous deploy.
 *
 * Delete once the cause is known. It writes only the caller's own rows.
 */
function describe(cause: unknown) {
  const e = cause as Record<string, unknown>;
  return {
    name: e?.name ?? null,
    message: e?.message ?? String(cause),
    // postgres.js surfaces these; they are what actually name a constraint or
    // a missing column.
    code: e?.code ?? null,
    detail: e?.detail ?? null,
    constraint: e?.constraint ?? null,
    table: e?.table ?? null,
    column: e?.column ?? null,
    routine: e?.routine ?? null,
    digest: e?.digest ?? null,
  };
}

async function step<T>(name: string, run: () => Promise<T>) {
  try {
    return { step: name, ok: true as const, result: await run() };
  } catch (cause) {
    return { step: name, ok: false as const, error: describe(cause) };
  }
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const url = new URL(request.url);
  const income = Number(url.searchParams.get("income") ?? "6938");
  const amount = Number(url.searchParams.get("amount") ?? "100");

  const steps = [];
  steps.push(await step("read goals", () => listGoals(user.id)));
  steps.push(await step("read default income", () => getDefaultMonthlyIncome(user.id)));
  for (const category of WEEKLY_CATEGORIES) {
    steps.push(await step(`write goal ${category}=${amount}`, () => setGoal(user.id, category, amount)));
  }
  steps.push(await step(`write default income=${income}`, () => setDefaultMonthlyIncome(user.id, income)));
  steps.push(await step("read back goals", () => listGoals(user.id)));
  steps.push(await step("read back income", () => getDefaultMonthlyIncome(user.id)));

  return NextResponse.json(
    { user: user.email, failed: steps.filter((s) => !s.ok).length, steps },
    { status: 200 }
  );
}
