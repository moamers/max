"use client";

import {
  startTransition,
  useEffect,
  useId,
  useMemo,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { loadSuggestionHistoryAction, type SuggestionEntry } from "@/lib/queries/suggestions";
import {
  coalesceSuggestionLoad,
  filterAndRankSuggestions,
  suggestionsOfKind,
  MAX_VISIBLE_SUGGESTIONS,
  SUGGESTION_LIST_PADDING,
  SUGGESTION_ROW_HEIGHT,
  type SuggestionKind,
} from "./suggestions";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Always required — every field needs a real accessible name even when the visible label is just a placeholder. */
  label: string;
  /**
   * Which history to offer, if any. Omitting it falls back to sniffing `name`
   * and the visible label — a fallback, not the mechanism. Copy is owned by the
   * design handoff and can change; a feature that switches itself off when a
   * word is reworded fails silently and in a way no test would catch. Every
   * call site that wants suggestions says so.
   */
  suggestionKind?: SuggestionKind;
  /** Used only by LabelField, which fetches while its collapsed chip is mounted. */
  suggestionEntries?: readonly SuggestionEntry[];
  onSuggestionSelect?: (value: string) => void;
}

/**
 * The inset text field used for "where", "note" and "when" on the add sheet
 * and the transaction editor. Not one of `src/components/ui`'s primitives
 * (there is no generic text field there — `NumericField` is digits-only),
 * so this stays local to the capture flow and mirrors NumericField's own
 * surface/radius/height so it reads as the same family.
 */
export function TextField({
  value,
  onChange,
  label,
  suggestionKind,
  suggestionEntries,
  onSuggestionSelect,
  id,
  style,
  onFocus,
  onBlur,
  onKeyDown,
  name,
  autoComplete,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-suggestions`;
  const inferredKind =
    suggestionKind ??
    (name === "merchant" || /^where\b/iu.test(label) ? "merchant" : null);
  const [loadedEntries, setLoadedEntries] = useState<SuggestionEntry[]>([]);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!inferredKind || suggestionEntries !== undefined) return;

    let cancelled = false;
    startTransition(() => {
      void coalesceSuggestionLoad(loadSuggestionHistoryAction)
        .then((history) => {
          if (!cancelled) setLoadedEntries(suggestionsOfKind(history, inferredKind));
        })
        .catch(() => {
          // A missing convenience is silent; the free-text field still works.
        });
    });
    return () => {
      cancelled = true;
    };
  }, [inferredKind, suggestionEntries]);

  const entries = suggestionEntries ?? loadedEntries;
  const ranked = useMemo(
    () => filterAndRankSuggestions(entries, value),
    [entries, value]
  );
  const open = Boolean(inferredKind && focused && !dismissed && ranked.length > 0);
  const activeOption = activeIndex >= 0 && activeIndex < ranked.length ? ranked[activeIndex] : null;

  function chooseSuggestion(suggestion: string) {
    // D-10: insert the exact stored string. Matching alone is case-insensitive.
    onChange(suggestion);
    onSuggestionSelect?.(suggestion);
    setDismissed(true);
    setActiveIndex(-1);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    setDismissed(false);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setFocused(false);
    setActiveIndex(-1);
    onBlur?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (inferredKind && ranked.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setDismissed(false);
        setActiveIndex((current) => (current + 1) % ranked.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setDismissed(false);
        setActiveIndex((current) =>
          current <= 0 ? ranked.length - 1 : current - 1
        );
      } else if (event.key === "Enter" && open && activeOption) {
        event.preventDefault();
        chooseSuggestion(activeOption.value);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setDismissed(true);
        setActiveIndex(-1);
      }
    }
    onKeyDown?.(event);
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface-inset-deep)",
        borderRadius: "var(--radius-field)",
        padding: "0 14px",
        height: 48,
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        name={name}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setDismissed(false);
          setActiveIndex(-1);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete={autoComplete ?? (inferredKind ? "off" : undefined)}
        role={inferredKind ? "combobox" : undefined}
        aria-autocomplete={inferredKind ? "list" : undefined}
        aria-expanded={inferredKind ? open : undefined}
        aria-controls={inferredKind && open ? listId : undefined}
        aria-activedescendant={activeOption ? `${listId}-${activeIndex}` : undefined}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontFamily: "var(--font-grotesk)",
          fontSize: "var(--type-body)",
          fontWeight: 500,
          padding: 0,
          ...style,
        }}
      />
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={inferredKind === "merchant" ? "Previous places" : "Previous labels"}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "calc(100% + 6px)",
            zIndex: 20,
            // Exactly the height of a full list, so it is bounded and never
            // scrolls — the cap is on the number of suggestions, not on how
            // much of them you can see.
            maxHeight:
              MAX_VISIBLE_SUGGESTIONS * SUGGESTION_ROW_HEIGHT + SUGGESTION_LIST_PADDING * 2,
            padding: SUGGESTION_LIST_PADDING,
            border: "1px solid var(--hairline-4)",
            borderRadius: "var(--radius-field)",
            background: "var(--surface-raised)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {ranked.map((entry, index) => (
            <button
              key={entry.value}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onPointerDown={(event) => {
                if (event.pointerType !== "mouse") {
                  event.preventDefault();
                  chooseSuggestion(entry.value);
                }
              }}
              onClick={() => chooseSuggestion(entry.value)}
              style={{
                width: "100%",
                minHeight: SUGGESTION_ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                padding: "9px 11px",
                border: 0,
                borderRadius: 10,
                background: activeIndex === index ? "var(--surface-hover)" : "transparent",
                color: "var(--text-primary)",
                fontFamily: "var(--font-grotesk)",
                fontSize: "var(--type-label)",
                fontWeight: 500,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {entry.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
