"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, NumericField, Sheet } from "@/components/ui";
import type { IncomeSource } from "@/lib/queries";
import { setIncomeForPeriodAction } from "@/app/income/actions";
import { formatGBP, incomeSourceText } from "./logic";

export interface IncomeMonthView {
  monthIndex: number;
  name: string;
  periodId: number | null;
  amount: number | null;
  source: IncomeSource;
  setByUser: boolean;
  unavailableReason: string | null;
}

export interface IncomeViewProps {
  year: number;
  defaultIncome: number | null;
  months: IncomeMonthView[];
}

export function IncomeView({ year, defaultIncome, months }: IncomeViewProps) {
  const router = useRouter();
  const [amounts, setAmounts] = useState(() => Object.fromEntries(months.map((month) => [month.monthIndex, month.amount ?? 0])));
  const [sources, setSources] = useState(() => Object.fromEntries(months.map((month) => [month.monthIndex, { source: month.source, setByUser: month.setByUser }])));
  const [dirty, setDirty] = useState<Set<number>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMonth = new Date().getMonth();
  const isCurrentYear = year === new Date().getFullYear();

  function changeMonth(month: IncomeMonthView, amount: number) {
    if (month.periodId === null) return;
    setAmounts((current) => ({ ...current, [month.monthIndex]: amount }));
    // A value typed here is a specific period override, regardless of its previous tier.
    setSources((current) => ({ ...current, [month.monthIndex]: { source: "month", setByUser: true } }));
    setDirty((current) => new Set(current).add(month.monthIndex));
  }

  async function saveAndClose() {
    setSaving(true);
    setError(null);
    try {
      // Only the months actually edited, one at a time.
      for (const monthIndex of dirty) {
        const month = months.find((m) => m.monthIndex === monthIndex);
        if (!month || month.periodId === null) continue;
        const result = await setIncomeForPeriodAction(month.periodId, amounts[monthIndex]);
        if (!result.ok) throw new Error(result.message);
      }
      router.back();
      router.refresh();
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      setError(`I couldn't save that — your numbers are still here. (${reason})`);
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100dvh", maxWidth: 480, margin: "0 auto", background: "var(--bg)" }}>
      <Sheet variant="full" onBack={() => router.back()}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={eyebrowStyle}>Income · {year}</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08 }}>Income, month by month</h1>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, lineHeight: 1.6, color: "var(--text-secondary-2)" }}>
              months you haven&apos;t touched use {defaultIncome === null ? "no figure yet" : formatGBP(defaultIncome)}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {months.map((month) => {
              const source = sources[month.monthIndex];
              const current = isCurrentYear && month.monthIndex === currentMonth;
              return (
                <div
                  key={month.monthIndex}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius-row)",
                    padding: "11px 14px 11px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    border: current ? "1px solid var(--tile-positive-border)" : "1px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", minWidth: 0, flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", color: current ? "var(--lime-ink)" : "var(--text-primary)" }}>{month.name}</span>
                      {source.source === "month" && source.setByUser && <span style={userTagStyle}>set by you</span>}
                    </div>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>
                      {month.unavailableReason ?? incomeSourceText(source.source, source.setByUser)}
                    </span>
                  </div>
                  <NumericField
                    aria-label={`${month.name} income`}
                    value={amounts[month.monthIndex]}
                    onChange={(amount) => changeMonth(month, amount)}
                    height={44}
                    valueFontSize={18}
                    disabled={month.periodId === null}
                    style={{ opacity: month.periodId === null ? 0.55 : 1 }}
                  />
                </div>
              );
            })}
          </div>
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
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "var(--text-tertiary)",
};

const userTagStyle = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--cyan-ink)",
};
