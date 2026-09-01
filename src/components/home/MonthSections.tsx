"use client";

import { useState } from "react";
import Link from "next/link";
import { Bar } from "@/components/ui/Bar";
import { Row } from "@/components/ui/Row";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatGBP } from "@/lib/money";
import { moneyToneColor, NO_WEEKLY_TARGETS_PROMPT } from "./format";
import type { OneOffs, RecurringBreakdown, TransactionRow } from "@/lib/queries";
import type { WeekView } from "./types";

/**
 * The month, one section at a time.
 *
 * Home used to hold three sections in three different interaction models:
 * weeks expanded in place and listed every week's figures at once, while
 * recurring and one-offs were links that navigated away. That is the "too many
 * numbers, no progressive information download" complaint in structural form —
 * the screen answered questions nobody had asked yet.
 *
 * Now: three cards, one selected, and the region beneath shows that selection
 * and nothing else. One-offs is selected on open, because it is the part of a
 * month that changes and therefore the part worth looking at.
 *
 * The selected card is JOINED to the region below it — square bottom corners,
 * no gap, one continuous surface — rather than merely highlighted. That join is
 * the whole control: a highlight that is not connected to what it reveals is
 * how a screen ends up showing "one-offs" selected with weeks listed beneath.
 *
 * Selection is view state. It is not written anywhere and it is not a route
 * change: switching section is not navigating to a new page.
 */
export type Section = "one-offs" | "recurring" | "weeks";

const ORDER: readonly Section[] = ["one-offs", "recurring", "weeks"];
const TITLE: Record<Section, string> = {
  "one-offs": "One-offs",
  recurring: "Recurring",
  weeks: "Weeks",
};

export interface MonthSectionsProps {
  periodId: number;
  oneOffs: OneOffs;
  recurring: RecurringBreakdown;
  weeks: readonly WeekView[];
  weeksSpent: number;
  /** null when the month has no weekly targets at all — see the prompt below. */
  weeksBudget: number | null;
}

export function MonthSections({ periodId, oneOffs, recurring, weeks, weeksSpent, weeksBudget }: MonthSectionsProps) {
  const [section, setSection] = useState<Section>("one-offs");
  const total: Record<Section, number> = {
    "one-offs": oneOffs.total,
    recurring: recurring.total,
    weeks: weeksSpent,
  };

  return (
    <section
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-card-lg)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/*
        One card, not a row of tabs above a separate panel. The first attempt
        drew three cards and joined the selected one to a full-width region
        below; because the tab was a third of the width and the region was all
        of it, the join read as a mis-drawn shape rather than a connection.
        Putting the control and its detail inside one surface ties them by
        construction, which is what the join was trying to fake.
      */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {ORDER.map((key) => {
          const selected = key === section;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              aria-pressed={selected}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 3,
                padding: "14px 14px 12px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: "transparent",
                color: selected ? "var(--text-primary)" : "var(--text-tertiary)",
                // The selected section is marked by a rule along the edge it
                // shares with its rows, so the mark points at what it opens.
                boxShadow: selected
                  ? "inset 0 -2px 0 0 var(--lime-fill)"
                  : "inset 0 -1px 0 0 var(--hairline-2)",
                transition: "color var(--motion-quick) var(--ease-standard)",
              }}
            >
              <span style={{ fontSize: "var(--type-caption)", fontWeight: 600 }}>{TITLE[key]}</span>
              <span
                style={{
                  fontSize: "var(--type-body)",
                  fontWeight: selected ? 700 : 500,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatGBP(total[key])}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "2px 16px 6px" }}>
        {section === "one-offs" && <Rows items={oneOffs.items} periodId={periodId} empty="Nothing one-off this month." />}
        {section === "recurring" && (
          <Rows items={recurring.groups.flatMap((g) => g.items)} periodId={periodId} empty="Nothing recurring in this month yet." />
        )}
        {section === "weeks" && <Weeks weeks={weeks} periodId={periodId} budget={weeksBudget} />}
      </div>
    </section>
  );
}

/**
 * A badge marks an exception. When every row in a section carries the same
 * status — which is the normal case for a month whose bills were just copied
 * forward, where all of them are pending — repeating the badge on every line
 * is not information, it is six identical pills down the page. So it is said
 * once, above the rows, and the rows stay quiet.
 */
function sharedStatus(items: readonly TransactionRow[]): "pending" | "review" | null {
  if (items.length < 2) return null;
  if (items.every((i) => i.pending)) return "pending";
  if (items.every((i) => i.needsAttention)) return "review";
  return null;
}

function Rows({ items, periodId, empty }: { items: readonly TransactionRow[]; periodId: number; empty: string }) {
  const shared = sharedStatus(items);
  if (items.length === 0) {
    return (
      <Row padding="18px 4px">
        <span style={{ fontSize: "var(--type-label)", color: "var(--text-tertiary)" }}>{empty}</span>
      </Row>
    );
  }
  return (
    <>
      {shared && (
        <Row padding="12px 4px 10px">
          <StatusPill status={shared}>
            {shared === "pending"
              ? `All ${items.length} pending — confirm each when it goes out`
              : `All ${items.length} need a look`}
          </StatusPill>
        </Row>
      )}
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={`/transaction/${item.id}?period=${periodId}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <Row interactive divider={i > 0 || shared !== null} padding="14px 4px">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "var(--type-label)",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.merchant ?? item.note ?? item.label ?? "—"}
                </span>
                {shared ? null : item.needsAttention ? (
                  <StatusPill status="review">needs a look</StatusPill>
                ) : item.pending ? (
                  <StatusPill status="pending">pending</StatusPill>
                ) : null}
              </span>
              <span
                style={{
                  fontSize: "var(--type-label)",
                  fontWeight: 700,
                  letterSpacing: "-0.015em",
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}
              >
                {formatGBP(item.amount)}
              </span>
            </div>
          </Row>
        </Link>
      ))}
    </>
  );
}

/**
 * Every week is its own card and every one of them opens. The old card gave
 * the live week a link and left the rest as read-only rows, so the only week
 * you could examine was the one you were already in.
 */
function Weeks({
  weeks,
  periodId,
  budget,
}: {
  weeks: readonly WeekView[];
  periodId: number;
  budget: number | null;
}) {
  return (
    <>
      {/*
        A month with no weekly targets renders as muted figures over empty bars,
        which is indistinguishable from a screen that failed to load. This tells
        the two apart (#47). It is a sibling of the week rows, not nested inside
        one: a link inside a link is an accessibility error and fires two things.
      */}
      {budget === null && (
        <Link href="/goals" style={{ color: "inherit", textDecoration: "none" }}>
          <Row interactive padding="14px 4px 15px">
            <span style={{ fontSize: "var(--type-label)", color: "var(--text-secondary)" }}>
              {NO_WEEKLY_TARGETS_PROMPT}
            </span>
          </Row>
        </Link>
      )}
      {weeks.map((week, i) => (
        <Link
          key={week.weekNumber}
          href={`/week/${week.weekNumber}?period=${periodId}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <Row interactive divider={i > 0} padding="16px 4px 18px" style={{ gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: "var(--type-label)", fontWeight: 500, color: "var(--text-secondary)" }}>
                {week.range}
              </span>
              <span
                style={{
                  fontSize: "var(--type-title)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  color: moneyToneColor(week.state.tone),
                }}
              >
                {formatGBP(week.state.amount)}
              </span>
            </div>
            <Bar spend={week.spent} budget={week.goal ?? 0} size="week" />
          </Row>
        </Link>
      ))}
    </>
  );
}
