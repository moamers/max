"use client";

import { Chip } from "@/components/ui/Chip";
import { categoriesForKind } from "./validation";
import type { TransactionCategory, TransactionKind } from "@/lib/transactions";

export interface CategoryChipsProps {
  kind: TransactionKind;
  value: TransactionCategory | null;
  onChange: (category: TransactionCategory) => void;
}

/**
 * The conditional sub-category chip row (README screen 08): Weekly ->
 * Everyday/Weekend/Transport, Recurring -> Housing/Childcare/Bills/
 * Subscriptions, One-off -> nothing (renders null). Also used, read against
 * a fixed kind, by the transaction editor's category chip (screen 04).
 */
export function CategoryChips({ kind, value, onChange }: CategoryChipsProps) {
  const options = categoriesForKind(kind);
  if (options.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="group" aria-label="Category">
      {options.map((option) => (
        <Chip key={option.value} tone="quiet" selected={value === option.value} onClick={() => onChange(option.value)}>
          {option.title}
        </Chip>
      ))}
    </div>
  );
}
