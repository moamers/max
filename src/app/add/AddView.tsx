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
import { CaptureButton } from "@/components/capture/CaptureButton";
import { validateAddDraft, categoryStillValidForKind } from "@/components/capture/validation";
import { KIND_TITLES, type TransactionCategory, type TransactionKind } from "@/lib/transactions";
import { transactionHome } from "@/lib/routes";
import { createTransaction } from "./actions";
import { shouldFocusAmount } from "./prefill";
import type { TransactionExtractionDraft } from "@/lib/llm/capabilities/extract-transaction";

export interface AddViewProps {
  periodId: number;
  initialKind: TransactionKind;
  initialCategory: TransactionCategory | null;
  initialWeekNumber: number | null;
  /** False when no provider key is set — the control is hidden rather than offered and failing. */
  captureEnabled?: boolean;
  initialWhere: string;
  initialLabel: string;
  initialAmount: number;
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
        fontVariantNumeric: "tabular-nums",
        fontSize: "var(--type-micro)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
      }}
    >
      {text}
    </span>
  );
}

export function AddView({ periodId, captureEnabled = false, initialKind, initialCategory, initialWeekNumber, initialWhere, initialLabel, initialAmount }: AddViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"type" | "upload">("type");

  const [amount, setAmount] = useState(initialAmount);
  const [pending, setPending] = useState(false);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [where, setWhere] = useState(initialWhere);
  const [occurredOn, setOccurredOn] = useState("");
  const [kind, setKind] = useState<TransactionKind>(initialKind);
  const [category, setCategory] = useState<TransactionCategory | null>(initialCategory);
  const [weekNumber] = useState<number | null>(initialWeekNumber);
  const [label, setLabel] = useState(initialLabel);
  const [note, setNote] = useState("");
  const [attentionReason, setAttentionReason] = useState<string | null>(null);
  const [rawImport, setRawImport] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  // The rule itself is `shouldFocusAmount`, kept pure so it can be read and
  // tested without a DOM.
  const [focusAmountOnMount, setFocusAmountOnMount] = useState(() =>
    shouldFocusAmount({ amount: initialAmount, where: initialWhere, label: initialLabel })
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  function handleKindChange(next: TransactionKind) {
    setKind(next);
    if (!categoryStillValidForKind(next, category)) setCategory(null);
  }

  function handleCapturedDraft(draft: TransactionExtractionDraft) {
    if (draft.merchant !== null) setWhere(draft.merchant);
    if (draft.amount !== null) setAmount(draft.amount);
    if (draft.occurredOn !== null) setOccurredOn(draft.occurredOn);
    if (draft.kind !== null) {
      setKind(draft.kind);
      setCategory(draft.category);
    }
    setNeedsAttention(draft.needsAttention);
    if (draft.needsAttention) setPending(false);
    setAttentionReason(draft.attentionReason);
    setRawImport(draft.rawImport);
    // Coming back from the Upload tab remounts the amount field. The draft it
    // carries is already filled in, so leave the cursor where the user put it.
    setFocusAmountOnMount(false);
    setTab("type");
  }

  const validation = validateAddDraft({ amount, where, kind, category });

  function handleAddIt() {
    setTouched(true);
    setError(null);
    if (!validation.valid) return;

    startSave(async () => {
      try {
        const { id } = await createTransaction({
          periodId,
          kind,
          category,
          weekNumber,
          merchant: where,
          label,
          note,
          amount,
          occurredOn: occurredOn || null,
          pending,
          needsAttention,
          attentionReason,
          rawImport,
        });
        router.replace(transactionHome(kind, periodId, weekNumber, id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      }
    });
  }

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
      <Sheet variant="full" onBack={() => router.replace(transactionHome(initialKind, periodId, initialWeekNumber))}>
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
                autoFocus={focusAmountOnMount}
              />
              {touched && validation.errors.amount && (
                <span style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)" }}>{validation.errors.amount}</span>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <TextField
                  value={where}
                  onChange={setWhere}
                  label="Where"
                  suggestionKind="merchant"
                  placeholder="shop, café, name…"
                />
                {touched && validation.errors.where && (
                  <span style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)" }}>{validation.errors.where}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fieldLabel("When")}
                <TextField type="date" value={occurredOn} onChange={setOccurredOn} label="When" />
              </div>

              <SegmentedControl value={kind} onChange={handleKindChange} options={KIND_OPTIONS} />

              {kind !== "one_off" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <CategoryChips kind={kind} value={category} onChange={setCategory} />
                  {touched && validation.errors.category && (
                    <span style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)" }}>{validation.errors.category}</span>
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

              {needsAttention && attentionReason && (
                <div style={{ padding: 14, borderRadius: 12, background: "var(--attention-tint-bg)", color: "var(--attention-ink)", fontSize: "var(--type-caption)", lineHeight: 1.45 }}>
                  {attentionReason}
                </div>
              )}

              {rawImport && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {fieldLabel("As read from the image")}
                  <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)", wordBreak: "break-word" }}>
                    {rawImport}
                  </span>
                </div>
              )}

              {error && (
                <p style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)", margin: 0 }} role="alert">
                  {error}
                </p>
              )}

              <Button variant="primary" onClick={handleAddIt} disabled={isSaving} style={{ marginTop: 8 }}>
                {isSaving ? "Adding…" : "Add it"}
              </Button>
            </>
          ) : (
            <UploadTab onDraft={handleCapturedDraft} captureEnabled={captureEnabled} />
          )}
        </div>
      </Sheet>
    </div>
  );
}

/** Screen 08's Upload tab: one image becomes an editable draft, never a write. */
function UploadTab({
  onDraft,
  captureEnabled,
}: {
  onDraft: (draft: TransactionExtractionDraft) => void;
  captureEnabled: boolean;
}) {
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
      <span style={{ fontSize: "var(--type-label)", fontWeight: 600 }}>Read a transaction image</span>
      <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)", maxWidth: 260, textWrap: "pretty" }}>
        {captureEnabled
          ? "Choose a screenshot or photo. You will check every field before anything is saved."
          : "Reading images isn't switched on yet. Add this one by hand on the Type it tab."}
      </span>
      {captureEnabled && (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <CaptureButton onDraft={onDraft} />
        </div>
      )}
    </div>
  );
}
