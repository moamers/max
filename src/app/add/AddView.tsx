"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AmountEditor } from "@/components/capture/AmountEditor";
import { CategoryChips } from "@/components/capture/CategoryChips";
import { TextField } from "@/components/capture/TextField";
import { LabelField } from "@/components/capture/LabelField";
import { validateAddDraft, categoryStillValidForKind } from "@/components/capture/validation";
import { KIND_TITLES, type TransactionCategory, type TransactionKind } from "@/lib/transactions";
import { transactionHome } from "@/lib/routes";
import { createTransaction } from "./actions";

export interface AddViewProps {
  periodId: number;
  initialKind: TransactionKind;
  initialCategory: TransactionCategory | null;
  initialWeekNumber: number | null;
  initialWhere: string;
  initialLabel: string;
}

const KIND_OPTIONS: { value: TransactionKind; label: string }[] = [
  { value: "weekly", label: KIND_TITLES.weekly },
  { value: "recurring", label: KIND_TITLES.recurring },
  { value: "one_off", label: KIND_TITLES.one_off },
];

function fieldLabel(text: string) {
  return (
    <span
      style={{
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
      }}
    >
      {text}
    </span>
  );
}

export function AddView({ periodId, initialKind, initialCategory, initialWeekNumber, initialWhere, initialLabel }: AddViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"type" | "upload">("type");

  const [amount, setAmount] = useState(0);
  const [pending, setPending] = useState(false);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [where, setWhere] = useState(initialWhere);
  const [kind, setKind] = useState<TransactionKind>(initialKind);
  const [category, setCategory] = useState<TransactionCategory | null>(initialCategory);
  const [weekNumber] = useState<number | null>(initialWeekNumber);
  const [label, setLabel] = useState(initialLabel);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  function handleKindChange(next: TransactionKind) {
    setKind(next);
    if (!categoryStillValidForKind(next, category)) setCategory(null);
  }

  const validation = validateAddDraft({ amount, where, kind, category });

  function handleAddIt() {
    setTouched(true);
    setError(null);
    if (!validation.valid) return;

    startSave(async () => {
      try {
        await createTransaction({
          periodId,
          kind,
          category,
          weekNumber,
          merchant: where,
          label,
          note,
          amount,
          pending,
          needsAttention,
        });
        router.replace(transactionHome(kind, periodId, weekNumber));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      }
    });
  }

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
      <Sheet variant="full" onBack={() => router.back()}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 20px 30px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "type", label: "Type it" },
              { value: "upload", label: "Upload" },
            ]}
          />

          {tab === "type" ? (
            <>
              <AmountEditor
                amount={amount}
                onAmountChange={setAmount}
                pending={pending}
                onPendingChange={setPending}
                needsAttention={needsAttention}
                onNeedsAttentionChange={setNeedsAttention}
                showSlider
              />
              {touched && validation.errors.amount && (
                <span style={{ fontSize: 12, color: "var(--bar-over)" }}>{validation.errors.amount}</span>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <TextField value={where} onChange={setWhere} label="Where" placeholder="shop, café, name…" />
                {touched && validation.errors.where && (
                  <span style={{ fontSize: 12, color: "var(--bar-over)" }}>{validation.errors.where}</span>
                )}
              </div>

              <SegmentedControl value={kind} onChange={handleKindChange} options={KIND_OPTIONS} />

              {kind !== "one_off" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <CategoryChips kind={kind} value={category} onChange={setCategory} />
                  {touched && validation.errors.category && (
                    <span style={{ fontSize: 12, color: "var(--bar-over)" }}>{validation.errors.category}</span>
                  )}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LabelField value={label} onChange={setLabel} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fieldLabel("Note")}
                <TextField value={note} onChange={setNote} label="Note" placeholder="a note, optional" />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "var(--bar-over)", margin: 0 }} role="alert">
                  {error}
                </p>
              )}

              <Button variant="primary" onClick={handleAddIt} disabled={isSaving} style={{ marginTop: 8 }}>
                {isSaving ? "Adding…" : "Add it"}
              </Button>
            </>
          ) : (
            <UploadTab />
          )}
        </div>
      </Sheet>
    </div>
  );
}

/**
 * Screen 08's Upload tab shape (drop target, "Read it" CTA). Reading a file
 * here isn't wired up; the CTA goes to /import, which does work — it used to
 * go to Home, which answered "read this file" by showing the dashboard.
 */
function UploadTab() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        border: "1px dashed var(--hairline-4)",
        borderRadius: 22,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600 }}>Drop a file, or paste</span>
      <span style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 260, textWrap: "pretty" }}>
        Reading a file here isn&apos;t wired up yet. Import takes spreadsheets, or add this one by hand on the Type it tab.
      </span>
      <Button variant="primary" href="/import" style={{ width: "auto", padding: "0 24px" }}>
        Read it
      </Button>
    </div>
  );
}
