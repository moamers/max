"use client";

import { startTransition, useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { loadSuggestionHistoryAction, type SuggestionEntry } from "@/lib/queries/suggestions";
import { TextField } from "./TextField";
import { coalesceSuggestionLoad } from "./suggestions";

export interface LabelFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * "a label chip that opens a picker" (README screen 08). D-10: labels are
 * the user's own words — never normalised, never a fixed vocabulary — so
 * the "picker" this opens is free text, not a list of internal categories.
 * The history lookup is an offer, never a vocabulary: typing a new label stays
 * free text and a selected label is inserted exactly as the user stored it.
 */
export function LabelField({ value, onChange }: LabelFieldProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      void coalesceSuggestionLoad(loadSuggestionHistoryAction)
        .then((history) => {
          if (!cancelled) setSuggestions(history.labels);
        })
        .catch(() => {
          // The chip and free-text field are unchanged when history is unavailable.
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      suggestionKind="label"
      suggestionEntries={suggestions}
      onSuggestionSelect={() => setOpen(false)}
    />
  );
}
