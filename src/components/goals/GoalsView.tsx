"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, NumericField, Sheet } from "@/components/ui";
import { WEEKLY_CATEGORIES, WEEKLY_CATEGORY_TITLES, type WeeklyCategory } from "@/lib/transactions";
import { setDefaultIncomeAction, setGoalAction } from "@/app/goals/actions";
import { formatGBP, weeklyGoalTotal } from "./logic";

export interface GoalsViewProps {
  /** `null` for a category with no goal set — see NumericField on why that is not zero. */
  initialGoals: Record<WeeklyCategory, number | null>;
  initialDefaultIncome: number | null;
}

export function GoalsView({ initialGoals, initialDefaultIncome }: GoalsViewProps) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [income, setIncome] = useState(initialDefaultIncome);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A target nobody has set contributes nothing to the weekly total. That is
  // arithmetic on what is known, not a claim that the target is zero.
  const total = weeklyGoalTotal(WEEKLY_CATEGORIES.map((category) => goals[category] ?? 0));

  // Typing changes nothing but what is on screen. The screen has a Done
  // button, so that is where the writing happens — a field that saves itself
  // while you are still deciding is both surprising and, when every keystroke
  // reached the database, the thing that took this page down.
  function changeGoal(category: WeeklyCategory, amount: number | null) {
    setGoals((current) => ({ ...current, [category]: amount }));
  }

  function changeIncome(amount: number | null) {
    setIncome(amount);
  }

  async function saveAndClose() {
    setSaving(true);
    setError(null);
    try {
      // Sequential on purpose: four parallel writes from a phone is the burst
      // this screen is recovering from.
      for (const category of WEEKLY_CATEGORIES) {
        const amount = goals[category];
        // An emptied field is silence, not a figure — there is no way to
        // withdraw a target here, so nothing is written and what is stored
        // stands. Typing 0 is how you say zero, and that does get written.
        if (amount === null || amount === initialGoals[category]) continue;
        const result = await setGoalAction(category, amount);
        if (!result.ok) throw new Error(result.message);
      }
      if (income !== null && income !== initialDefaultIncome) {
        const result = await setDefaultIncomeAction(income);
        if (!result.ok) throw new Error(result.message);
      }
      router.back();
      router.refresh();
    } catch (cause) {
      // A failed save must not take the page with it. The numbers stay on
      // screen so nothing typed is lost, and the reason is shown rather than
      // swallowed — an unexplained failure is impossible to act on.
      const reason = cause instanceof Error ? cause.message : String(cause);
      setError(`I couldn't save that — your numbers are still here. (${reason})`);
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100dvh", maxWidth: 480, margin: "0 auto", background: "var(--bg)" }}>
      <Sheet variant="full" onBack={() => router.back()}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px", display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
              What are you aiming for?
            </h1>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, lineHeight: 1.6, color: "var(--text-secondary-2)" }}>
              three weekly numbers, and what you expect to earn
            </span>
          </div>

          <section style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-labelledby="weekly-goals-heading">
            <span id="weekly-goals-heading" style={eyebrowStyle}>Per week</span>
            {WEEKLY_CATEGORIES.map((category) => (
              <div key={category} style={fieldRowStyle}>
                <span style={rowLabelStyle}>{WEEKLY_CATEGORY_TITLES[category]}</span>
                <NumericField
                  aria-label={`${WEEKLY_CATEGORY_TITLES[category]} weekly goal`}
                  value={goals[category]}
                  onChange={(amount) => changeGoal(category, amount)}
                />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "12px 16px 0" }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>that is</span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em" }}>{formatGBP(total)}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                  a week · {formatGBP(total * 5)} a month
                </span>
              </div>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-labelledby="expected-income-heading">
            <span id="expected-income-heading" style={eyebrowStyle}>Expected income</span>
            <div style={fieldRowStyle}>
              <span style={rowLabelStyle}>A month</span>
              <NumericField aria-label="Expected monthly income" value={income} onChange={changeIncome} />
            </div>
            <Link href="/income" style={{ color: "inherit", textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>Some months differ — set them one by one</span>
                <span style={{ fontSize: 17, color: "var(--text-disabled)" }} aria-hidden>›</span>
              </div>
            </Link>
          </section>
        </div>
        <div style={{ padding: "0 20px 22px", flexShrink: 0 }}>
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 14, color: "var(--bar-over)" }}>
              {error}
            </p>
          )}
          <Button height={54} disabled={saving} onClick={saveAndClose}>
            {saving ? "Saving…" : "Done"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

const eyebrowStyle = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "var(--text-tertiary)",
};

const fieldRowStyle = {
  background: "var(--surface)",
  borderRadius: "var(--radius-row)",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const rowLabelStyle = { fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" };
