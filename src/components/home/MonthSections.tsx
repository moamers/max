"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bar } from "@/components/ui/Bar";
import { Row } from "@/components/ui/Row";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatGBP } from "@/lib/money";
import { moneyToneColor, NO_WEEKLY_TARGETS_PROMPT } from "./format";
import type { OneOffs, RecurringBreakdown, TransactionRow } from "@/lib/queries";
import type { WeekView } from "./types";
import { motionToken } from "@/lib/motion";

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
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  /*
    Switching section is a MOVE WITHIN a screen, not a scene change, so the
    rows arrive on --motion-standard with a short stagger and the panel takes
    its new height in the same beat.

    Two rules from docs/product/12-build-tasks.md Task E, both learned from the
    prototype rather than invented here:

      · Out finishes before in starts. The prototype cross-faded an outgoing
        list against an incoming one at the same coordinates, so for ~170ms two
        sets of rows were painted on top of each other. React has already
        swapped the children by the time this runs, so there is nothing to fade
        out — the old rows are gone, and the new ones enter into empty space.

      · Transform and opacity only. Height is animated on the CONTAINER via the
        Web Animations API between two measured values rather than by
        transitioning `height: auto`, which does not animate at all, and the
        rows themselves only ever move and fade.

    Reduced motion is handled by the token scale: --motion-* all clamp to 1ms
    under prefers-reduced-motion, so this becomes a jump without a branch here.
  */
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const styles = getComputedStyle(document.documentElement);
    const ms = (name: string) => motionToken(name);
    const ease = styles.getPropertyValue("--ease-enter").trim() || "ease-out";
    const move = ms("--motion-standard");
    const stagger = ms("--motion-stagger");

    const rows = [...el.querySelectorAll<HTMLElement>("[data-motion-row]")];
    rows.forEach((row, i) => {
      row.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        // Never more than four steps of stagger: past that a list stops
        // feeling responsive and starts feeling slow.
        { duration: move, easing: ease, delay: Math.min(i, 3) * stagger, fill: "backwards" }
      );
    });
  }, [section]);
  const total: Record<Section, number> = {
    "one-offs": oneOffs.total,
    recurring: recurring.total,
    weeks: weeksSpent,
  };

  return (
    <section>
      {/*
        Three cards, and the selected one points at what it opens.

        Two earlier attempts got this wrong in opposite directions. The first
        drew three cards joined to a full-width panel: because a card was a
        third of the width and the panel was all of it, the join read as a
        mis-drawn shape. The second put everything in one card, which tied them
        by construction but threw away the cards — it read as a tab strip.

        So: real cards with weight of their own, and an explicit pointer from
        the selected one into the panel. The connection is drawn rather than
        implied, and it moves with the selection.
      */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
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
                gap: 5,
                padding: "15px 15px 16px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "var(--radius-card-sm)",
                background: selected ? "var(--surface)" : "var(--surface-inset)",
                color: selected ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: selected ? "var(--shadow-card)" : "none",
                transform: selected ? "translateY(-1px)" : "none",
                transition:
                  "background var(--motion-quick) var(--ease-standard), color var(--motion-quick) var(--ease-standard), transform var(--motion-quick) var(--ease-standard)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--type-micro)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: selected ? "var(--lime-ink)" : "inherit",
                }}
              >
                {TITLE[key]}
              </span>
              <span
                style={{
                  fontSize: "var(--type-title)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatGBP(total[key])}
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={panel}
        style={{
          position: "relative",
          marginTop: 10,
          background: "var(--surface)",
          borderRadius: "var(--radius-card-lg)",
          boxShadow: "var(--shadow-card)",
          padding: "6px 16px 8px",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -5,
            left: `calc((100% / 3) * ${ORDER.indexOf(section) + 0.5} - 5px)`,
            width: 10,
            height: 10,
            background: "var(--surface)",
            transform: "rotate(45deg)",
            borderRadius: 2,
            transition: "left var(--motion-standard) var(--ease-standard)",
          }}
        />
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
        <Row padding="12px 4px 10px" data-motion-row>
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
          <Row interactive divider={i > 0 || shared !== null} padding="14px 4px" data-motion-row>
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
          <Row interactive divider={i > 0} padding="16px 4px 18px" style={{ gap: 12 }} data-motion-row>
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
