"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "./TextField";

export interface LabelFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * "a label chip that opens a picker" (README screen 08). D-10: labels are
 * the user's own words — never normalised, never a fixed vocabulary — so
 * the "picker" this opens is free text, not a list of internal categories.
 * There is no query yet for a user's previously-used labels across periods
 * (`tagBreakdownForPeriod` is period-scoped), so this doesn't suggest past
 * labels; it just lets the user type or clear their own word.
 */
export function LabelField({ value, onChange }: LabelFieldProps) {
  const [open, setOpen] = useState(false);

  if (!open && !value) {
    return (
      <Chip tone="quiet" onClick={() => setOpen(true)}>
        + label
      </Chip>
    );
  }

  if (!open) {
    return (
      <Chip tone="cyan" onClick={() => setOpen(true)}>
        {value}
      </Chip>
    );
  }

  return (
    <TextField
      value={value}
      onChange={onChange}
      onBlur={() => setOpen(false)}
      autoFocus
      label="Label"
      placeholder="a word that's yours — dxb-26, a person's name…"
    />
  );
}
