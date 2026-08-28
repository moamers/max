"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptRollover } from "@/app/rollover-actions";
import { Button } from "@/components/ui/Button";

export interface RolloverView {
  startDate: string;
  fourWeekEnd: string;
  fiveWeekEnd: string;
  proposedWeeks: 4 | 5;
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function RolloverPrompt({ proposal }: { proposal: RolloverView }) {
  const router = useRouter();
  const [weeks, setWeeks] = useState<4 | 5>(proposal.proposedWeeks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endDate = weeks === 4 ? proposal.fourWeekEnd : proposal.fiveWeekEnd;

  return (
    <div style={{ padding: 18, border: "1px solid var(--hairline-3)", borderRadius: "var(--radius-card-sm)", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lime-ink)" }}>Next period</span>
        <p style={{ margin: "7px 0 0", fontSize: 16, fontWeight: 700 }}>{displayDate(proposal.startDate)} – {displayDate(endDate)}</p>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: "var(--text-secondary)" }}>I lined this up as whole Monday-to-Sunday weeks. Change the length if the end date is different.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {([4, 5] as const).map((count) => <button key={count} type="button" onClick={() => setWeeks(count)} style={{ height: 40, borderRadius: 99, border: `1px solid ${weeks === count ? "var(--lime-fill)" : "var(--hairline-4)"}`, background: weeks === count ? "var(--control-active)" : "transparent", color: "var(--text-primary)", fontFamily: "var(--font-jetbrains-mono)", cursor: "pointer" }}>{count} weeks</button>)}
      </div>
      {error && <span role="alert" style={{ fontSize: 12, color: "var(--bar-over)" }}>{error}</span>}
      <Button disabled={pending} onClick={() => { setError(null); startTransition(async () => { try { const result = await acceptRollover(proposal.startDate, endDate); router.replace(result.next); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't start this period."); } }); }}>{pending ? "Starting…" : "Start this period"}</Button>
    </div>
  );
}
