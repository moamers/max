"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Chip";
import { AmountEditor } from "@/components/capture/AmountEditor";
import { CategoryChips } from "@/components/capture/CategoryChips";
import { TextField } from "@/components/capture/TextField";
import { LabelField } from "@/components/capture/LabelField";
import { CaptureButton } from "@/components/capture/CaptureButton";
import { KIND_TITLES, type TransactionCategory } from "@/lib/transactions";
import type { TransactionDetail } from "./data";
import { reasoningFor } from "./reasoning";
import { transactionHome } from "@/lib/routes";
import { saveTransaction, removeTransaction } from "./actions";
import type { TransactionExtractionDraft } from "@/lib/llm/capabilities/extract-transaction";

export interface TransactionViewProps {
  detail: TransactionDetail;
  /** False when no provider key is set — the control is hidden rather than offered and failing. */
  captureEnabled?: boolean;
}

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

export function TransactionView({ detail, captureEnabled = false }: TransactionViewProps) {
  const router = useRouter();
  const [merchant, setMerchant] = useState(detail.merchant ?? "");
  const [occurredOn, setOccurredOn] = useState(detail.occurredOn ?? "");
  const [category, setCategory] = useState<TransactionCategory | null>(detail.category);
  const [label, setLabel] = useState(detail.label ?? "");
  const [note, setNote] = useState(detail.note ?? "");
  const [amount, setAmount] = useState(detail.amount);
  const [pending, setPending] = useState(detail.pending);
  const [needsAttention, setNeedsAttention] = useState(detail.needsAttention);
  const [attentionReason, setAttentionReason] = useState(detail.attentionReason);
  const [rawImport, setRawImport] = useState(detail.rawImport);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const reasoning = reasoningFor(detail.kind, category, occurredOn || null);

  function handleCapturedDraft(draft: TransactionExtractionDraft) {
    if (draft.merchant !== null) setMerchant(draft.merchant);
    if (draft.amount !== null) setAmount(draft.amount);
    if (draft.occurredOn !== null) setOccurredOn(draft.occurredOn);

    let nextReason = draft.attentionReason;
    let nextNeedsAttention = draft.needsAttention;
    if (draft.kind !== null && draft.kind !== detail.kind) {
      nextNeedsAttention = true;
      nextReason = [nextReason, "The image suggests a different transaction kind."].filter(Boolean).join(" ");
    } else if (draft.kind === detail.kind && detail.kind !== "one_off") {
      setCategory(draft.category);
    }

    if (nextNeedsAttention) {
      setPending(false);
      setNeedsAttention(true);
      setAttentionReason(nextReason);
    }
    setRawImport(draft.rawImport);
  }

  function handleSave() {
    setError(null);
    startSave(async () => {
      try {
        const { next } = await saveTransaction(detail.id, detail.kind, detail.periodId, detail.weekNumber, {
          merchant,
          occurredOn: occurredOn || null,
          category,
          label,
          note,
          amount,
          pending,
          needsAttention,
          attentionReason: needsAttention ? attentionReason : null,
          rawImport,
        });
        // `replace`, not push: the editor is finished with, and after a delete
        // it is a row that no longer exists — Back onto it renders a bare 404.
        router.replace(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this transaction? This can't be undone.")) return;
    setError(null);
    startDelete(async () => {
      try {
        const { next } = await removeTransaction(detail.id);
        router.replace(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't delete. Try again.");
      }
    });
  }

  const busy = isSaving || isDeleting;

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
      <Sheet variant="full" onBack={() => router.replace(transactionHome(detail.kind, detail.periodId, detail.weekNumber))}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill tone="neutral">{KIND_TITLES[detail.kind]}</Pill>
            {detail.weekNumber !== null && <Pill tone="neutral">week {detail.weekNumber}</Pill>}
          </div>

          {captureEnabled && <CaptureButton onDraft={handleCapturedDraft} />}

          <AmountEditor
            amount={amount}
            onAmountChange={setAmount}
            pending={pending}
            onPendingChange={setPending}
            needsAttention={needsAttention}
            onNeedsAttentionChange={setNeedsAttention}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fieldLabel("Where")}
            <TextField
              value={merchant}
              onChange={setMerchant}
              label="Where"
              suggestionKind="merchant"
              placeholder="shop, café, name…"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fieldLabel("When")}
            <TextField type="date" value={occurredOn} onChange={setOccurredOn} label="When" />
          </div>

          {detail.kind !== "one_off" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fieldLabel("Category")}
              <CategoryChips kind={detail.kind} value={category} onChange={setCategory} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fieldLabel("Label")}
            <LabelField value={label} onChange={setLabel} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fieldLabel("Note")}
            <TextField value={note} onChange={setNote} label="Note" placeholder="a note, optional" />
          </div>

          {reasoning && (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, textWrap: "pretty" }}>{reasoning}</p>
          )}

          {needsAttention && attentionReason && (
            <div style={{ padding: 14, borderRadius: 12, background: "var(--attention-tint-bg)", color: "var(--attention-ink)", fontSize: 13, lineHeight: 1.45 }}>
              {attentionReason}
            </div>
          )}

          {rawImport && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fieldLabel("As imported")}
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  wordBreak: "break-word",
                }}
              >
                {rawImport}
              </span>
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13, color: "var(--bar-over)", margin: 0 }} role="alert">
              {error}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <Button variant="primary" onClick={handleSave} disabled={busy}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
