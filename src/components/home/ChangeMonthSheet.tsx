"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import { Sheet } from "@/components/ui/Sheet";
import { formatSignedGBP } from "./format";
import type { YearView } from "./types";

interface ChangeMonthSheetProps {
  yearsByValue: Record<number, YearView>;
  bounds: { min: number; max: number };
  initialYear: number;
  onDismiss: () => void;
}

/** README screen 09: year stepper + a 3-column grid of 12 months, each a net result or a dimmed blank. */
export function ChangeMonthSheet({ yearsByValue, bounds, initialYear, onDismiss }: ChangeMonthSheetProps) {
  const [year, setYear] = useState(initialYear);
  const data = yearsByValue[year];

  return (
    <Sheet variant="bottom" onDismiss={onDismiss} style={{ padding: "12px 22px 26px" }}>
      <div style={{ width: 42, height: 4, borderRadius: "var(--radius-pill)", background: "var(--control-active)", margin: "0 auto" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <IconButton
          size="md"
          icon={<span aria-hidden>&lsaquo;</span>}
          aria-label="Previous year"
          disabled={year <= bounds.min}
          onClick={() => setYear((y) => Math.max(bounds.min, y - 1))}
          style={{ background: "var(--surface-inset)" }}
        />
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{year}</span>
        <IconButton
          size="md"
          icon={<span aria-hidden>&rsaquo;</span>}
          aria-label="Next year"
          disabled={year >= bounds.max}
          onClick={() => setYear((y) => Math.min(bounds.max, y + 1))}
          style={{ background: "var(--surface-inset)" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {data?.months.map((m) => {
          const available = m.periodId !== null;
          const tileStyle: CSSProperties = {
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "14px 10px",
            borderRadius: "var(--radius-card-sm)",
            background: "var(--surface)",
            border: m.isCurrent ? "1px solid var(--lime-ink)" : "1px solid transparent",
            opacity: available ? 1 : 0.4,
            textDecoration: "none",
            color: "inherit",
            position: "relative",
          };

          const inner = (
            <>
              {m.hasAttention && (
                <span
                  aria-label="Has rows that need a look"
                  style={{ position: "absolute", top: 10, right: 10, width: 6, height: 6, borderRadius: 99, background: "var(--attention-ink)" }}
                />
              )}
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{m.monthLabel}</span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 11,
                  color:
                    m.net === null
                      ? "var(--text-disabled)"
                      : m.net >= 0
                        ? "var(--lime-ink)"
                        : "var(--bar-over)",
                }}
              >
                {m.net === null ? "—" : formatSignedGBP(m.net)}
              </span>
            </>
          );

          if (!available) {
            return (
              <div key={m.monthIndex} style={tileStyle}>
                {inner}
              </div>
            );
          }

          return (
            <Link key={m.monthIndex} href={`/?period=${m.periodId}`} style={tileStyle} onClick={onDismiss}>
              {inner}
            </Link>
          );
        })}
      </div>
    </Sheet>
  );
}
