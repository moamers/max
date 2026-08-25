"use client";

import { useState, useTransition } from "react";
import { Chip } from "@/components/ui/Chip";
import { formatGBP } from "@/components/home/format";
import { resolveImportedAttention, type ImportPlacement } from "@/app/import/actions";
import type { ImportedAttention } from "./types";

export function AttentionCard({ row }: { row: ImportedAttention }) {
  const [answer, setAnswer] = useState<ImportPlacement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(placement: ImportPlacement) {
    setError(null);
    startTransition(async () => {
      try {
        await resolveImportedAttention(row.id, placement);
        setAnswer(placement);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Couldn't update this row. Try again.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--hairline-1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{row.merchant ?? "Imported row"}</span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>{formatGBP(row.amount)}</span>
      </div>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.attentionReason}</span>
      {answer ? (
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--lime-ink)" }}>
          placed as {answer === "one_off" ? "one-off" : answer}
        </span>
      ) : (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Chip disabled={pending} onClick={() => choose("everyday")}>everyday</Chip>
          <Chip disabled={pending} onClick={() => choose("weekend")}>weekend</Chip>
          <Chip disabled={pending} onClick={() => choose("one_off")}>one-off</Chip>
        </div>
      )}
      {error && <span role="alert" style={{ fontSize: 12, color: "var(--bar-over)" }}>{error}</span>}
    </div>
  );
}
