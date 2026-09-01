"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptRollover } from "@/app/rollover-actions";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
export const COPY_RECURRING_LABEL = "Copy recurring from last month";
export const COPY_RECURRING_HINT = "they arrive marked pending, so you confirm each one when it goes out";

export interface RolloverView {
  startDate: string;
  fourWeekEnd: string;
  fiveWeekEnd: string;
  proposedWeeks: 4 | 5;
  /** False when there is no earlier month holding recurring rows to copy. */
  canCopyRecurring: boolean;
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export interface RolloverPromptProps {
  proposal: RolloverView;
  /**
   * Home offers the month that comes next. The same control also stands in for
   * a month further ahead that the user tapped in the picker, where "next
   * period" would be the wrong name for it — so both words are the caller's.
   */
  eyebrow?: string;
  cta?: string;
}

export function RolloverPrompt({
  proposal,
  eyebrow = "Next period",
  cta = "Start this period",
}: RolloverPromptProps) {
  const router = useRouter();
  const [weeks, setWeeks] = useState<4 | 5>(proposal.proposedWeeks);
  // Checked by default: the user already said these happen every month when
  // they filed them as recurring, and making them say it again each month is
  // the labelling tax this product argues against. It is still a tick they can
  // clear, because it writes rows.
  const [copyRecurring, setCopyRecurring] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endDate = weeks === 4 ? proposal.fourWeekEnd : proposal.fiveWeekEnd;

  return (
    <div style={{ padding: 18, border: "1px solid var(--hairline-3)", borderRadius: "var(--radius-card-sm)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lime-ink)" }}>{eyebrow}</span>
        <p style={{ margin: "7px 0 0", fontSize: "var(--type-body)", fontWeight: 700 }}>{displayDate(proposal.startDate)} – {displayDate(endDate)}</p>
      </div>
      <p style={{ margin: 0, fontSize: "var(--type-caption)", lineHeight: 1.45, color: "var(--text-secondary)" }}>I lined this up as whole Monday-to-Sunday weeks. Change the length if the end date is different.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {([4, 5] as const).map((count) => <button key={count} type="button" onClick={() => setWeeks(count)} style={{ height: 40, borderRadius: 99, border: `1px solid ${weeks === count ? "var(--lime-ink)" : "var(--hairline-4)"}`, background: weeks === count ? "var(--control-active)" : "transparent", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", cursor: "pointer" }}>{count} weeks</button>)}
      </div>
      {proposal.canCopyRecurring && (
        <Checkbox
          checked={copyRecurring}
          onChange={setCopyRecurring}
          label={COPY_RECURRING_LABEL}
          hint={COPY_RECURRING_HINT}
        />
      )}
      {error && <span role="alert" style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)" }}>{error}</span>}
      <Button disabled={pending} onClick={() => { setError(null); startTransition(async () => { try { const result = await acceptRollover(proposal.startDate, endDate, proposal.canCopyRecurring && copyRecurring); router.replace(result.next); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't start this period."); } }); }}>{pending ? "Starting…" : cta}</Button>
    </div>
  );
}
