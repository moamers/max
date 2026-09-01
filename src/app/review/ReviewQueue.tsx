"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { AttentionTransactionRow } from "@/lib/store";
import { formatGBP } from "@/components/home/format";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Chip";
import { Chip } from "@/components/ui/Chip";
import { confirmPlacement, changePlacement } from "./actions";
import type { ImportPlacement } from "@/app/import/actions";
import { withoutCurrent } from "./queue";

export function ReviewQueue({ initialRows }: { initialRows: AttentionTransactionRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [leftMarked, setLeftMarked] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const row = rows[0] ?? null;

  function advance() {
    setRows(withoutCurrent);
    setLeftMarked(true);
    setChanging(false);
    setError(null);
  }

  function confirm() {
    if (!row) return;
    startTransition(async () => {
      try {
        await confirmPlacement(row.id);
        setRows(withoutCurrent);
        setChanging(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't confirm this row. Try again.");
      }
    });
  }

  function change(placement: ImportPlacement) {
    if (!row) return;
    startTransition(async () => {
      try {
        await changePlacement(row.id, placement);
        setRows(withoutCurrent);
        setChanging(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't change this row. Try again.");
      }
    });
  }

  if (!row) {
    return (
      <main style={{ minHeight: "100dvh", maxWidth: 480, margin: "0 auto", padding: 26, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "var(--type-heading)", letterSpacing: "-0.035em" }}>{leftMarked ? "That's the sweep done." : "Nothing waiting here."}</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>{leftMarked ? "Anything you skipped stays marked where it appears." : "There are no rows marked for a look."}</p>
        <Link href="/" style={{ marginTop: 8 }}>Back home</Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", maxWidth: 480, margin: "0 auto", padding: "24px 20px 30px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "var(--type-label)" }}>Back</Link>
        <button type="button" onClick={() => { setRows([]); setLeftMarked(true); }} style={{ border: 0, background: "none", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", cursor: "pointer" }}>Skip all</button>
      </div>
      <div style={{ marginTop: 30 }}>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--attention-ink)" }}>Needs a look · {initialRows.length - rows.length + 1} of {initialRows.length}</span>
        <h1 style={{ margin: "10px 0 0", fontSize: "var(--type-display)", lineHeight: 1.08, letterSpacing: "-0.035em" }}>{row.merchant ?? "Imported row"}</h1>
      </div>
      <div style={{ marginTop: 24, padding: 20, background: "var(--surface)", border: "1px solid var(--hairline-3)", borderRadius: "var(--radius-card-sm)", display: "flex", flexDirection: "column", gap: 18 }}>
        <strong style={{ fontSize: "var(--type-display)", letterSpacing: "-0.035em", color: "var(--attention-ink)" }}>{formatGBP(row.amount)}</strong>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><Pill>{row.periodLabel}</Pill>{row.weekNumber !== null && <Pill>week {row.weekNumber}</Pill>}</div>
        {[['Date', row.occurredOn], ['Note', row.note], ['Label', row.label]].map(([label, value]) => value ? <div key={label} style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-tertiary)", textTransform: "uppercase" }}>{label}</span><span style={{ fontSize: "var(--type-label)" }}>{value}</span></div> : null)}
        <div style={{ padding: 14, borderRadius: 12, background: "var(--attention-tint-bg)", display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--attention-ink)", textTransform: "uppercase" }}>Why I placed it here</span><span style={{ fontSize: "var(--type-label)", lineHeight: 1.45 }}>{row.attentionReason}</span></div>
        {row.rawImport && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-tertiary)", textTransform: "uppercase" }}>As imported</span><code style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{row.rawImport}</code></div>}
      </div>
      {error && <p role="alert" style={{ color: "var(--bar-over)", fontSize: "var(--type-caption)" }}>{error}</p>}
      <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <Button onClick={confirm} disabled={pending}>{pending ? "Confirming…" : "Confirm"}</Button>
        {changing ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
            <Chip disabled={pending} onClick={() => change("everyday")}>everyday</Chip>
            <Chip disabled={pending} onClick={() => change("weekend")}>weekend</Chip>
            <Chip disabled={pending} onClick={() => change("one_off")}>one-off</Chip>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setChanging(true)}>Change</Button>
        )}
        <Button variant="secondary" onClick={advance}>Skip</Button>
      </div>
    </main>
  );
}
