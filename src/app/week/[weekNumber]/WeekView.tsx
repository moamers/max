"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Bar } from "@/components/ui/Bar";
import { Accordion, Caret } from "@/components/ui/Accordion";
import { Row } from "@/components/ui/Row";
import { Pill } from "@/components/ui/Chip";
import { FAB } from "@/components/ui/FAB";
import { BottomNav, navClearance } from "@/components/nav/BottomNav";
import type { WeekTotals, WeeklyCategoryTotal } from "@/lib/queries";
import { WEEKLY_CATEGORIES, type WeeklyCategory } from "@/lib/transactions";
import { formatGBP as gbp } from "@/lib/money";
import { JustChanged } from "@/components/ui/JustChanged";
import { sheetParent } from "@/lib/routes";

export interface WeekTransactionItem {
  id: number;
  merchant: string | null;
  note: string | null;
  amount: number;
  pending: boolean;
  needsAttention: boolean;
}

export interface WeekViewProps {
  weekNumber: number;
  periodId: number;
  monthName: string;
  rangeLabel: string | null;
  week: WeekTotals;
  transactionsByCategory: Record<string, WeekTransactionItem[]>;
  /** The row just added or edited, to mark it wherever its amount sorts it. */
  highlightId?: number | null;
}

/** The category a just-changed row is filed under, so it isn't marked inside a closed accordion. */
function categoryHolding(
  byCategory: Record<string, WeekTransactionItem[]>,
  id: number | null
): WeeklyCategory | null {
  if (id === null) return null;
  for (const category of WEEKLY_CATEGORIES) {
    if ((byCategory[category] ?? []).some((item) => item.id === id)) return category;
  }
  return null;
}


function headlineFor(spent: number, goal: number | null, remaining: number | null): { text: string; color: string } {
  if (goal === null) return { text: `${gbp(spent)} spent`, color: "var(--text-primary)" };
  if (remaining !== null && remaining < 0) return { text: `${gbp(Math.abs(remaining))} over`, color: "var(--bar-over)" };
  return { text: `${gbp(remaining ?? 0)} left`, color: "var(--lime-ink)" };
}

function metaFor(spent: number, goal: number | null): string {
  return goal === null ? `${gbp(spent)} spent` : `of ${gbp(goal)} · ${gbp(spent)} spent`;
}

export function WeekView({
  weekNumber,
  periodId,
  monthName,
  rangeLabel,
  week,
  transactionsByCategory,
  highlightId = null,
}: WeekViewProps) {
  const router = useRouter();
  // Open on the highlighted row's category: a marked row inside a collapsed
  // accordion is no more findable than an unmarked one.
  const [openCategory, setOpenCategory] = useState<WeeklyCategory | null>(() =>
    categoryHolding(transactionsByCategory, highlightId)
  );

  const headline = headlineFor(week.spent, week.goal, week.remaining);
  const meta = metaFor(week.spent, week.goal);

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}>
      <Sheet variant="full" onBack={() => router.replace(sheetParent(periodId))}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            // Was a flat 108px: 20px inset + the 52px FAB + 36px of breathing
            // room. The FAB now sits on top of the nav pill, so the same three
            // parts are measured from the pill's footprint instead of from the
            // bottom of the screen.
            padding: `8px 20px ${navClearance(52 + 36)}`,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                fontSize: "var(--type-caption)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              {monthName} · Week {weekNumber}
            </span>
            <h1 style={{ fontSize: "var(--type-display)", fontWeight: 800, letterSpacing: "-0.035em", margin: 0, textWrap: "balance" }}>
              {rangeLabel ?? `Week ${weekNumber}`}
            </h1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--type-display)", fontWeight: 800, letterSpacing: "-0.035em", color: headline.color }}>
                {headline.text}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                {meta}
              </span>
            </div>
            <Bar spend={week.spent} budget={week.goal ?? 0} size="total" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {week.categories.map((category) => (
              <CategoryCard
                key={category.category}
                category={category}
                open={openCategory === category.category}
                onToggle={() =>
                  setOpenCategory((current) => (current === category.category ? null : category.category))
                }
                transactions={transactionsByCategory[category.category] ?? []}
                highlightId={highlightId}
              />
            ))}
          </div>
        </div>

        {/*
          The FAB is lifted above the pill rather than folded into it.

          Folding "add" into the nav was the other option and is the wrong one:
          the pill's four items are fixed by the brief, and more importantly
          this button is not a global one. It carries the week and the period
          it was pressed on — "add a transaction to *this* week" — and a nav
          item that appears identically on four screens cannot carry that
          without lying about where it takes you on three of them. The
          handoff also pins the FAB (screen 03: "lime 52px circle, bottom
          right, over a bottom fade"), so removing it would drop a specified
          control to make room for chrome.

          `bottom` is the pill's own footprint, so the two cannot overlap: the
          FAB's lower edge lands at the top of that footprint, which is 14px
          clear of the bar itself.
        */}
        <div style={{ position: "fixed", right: 20, bottom: navClearance(), zIndex: 7 }}>
          <FAB
            aria-label="Add a transaction to this week"
            onClick={() => router.push(`/add?week=${weekNumber}&period=${periodId}&kind=weekly`)}
          />
        </div>
      </Sheet>

      {/*
        Outside the Sheet on purpose. `.max-sheet--full` animates a transform
        and keeps it (`animation-fill-mode: both`), and an ancestor with a
        transform is the containing block for `position: fixed` descendants —
        so a pill rendered inside it would be positioned against the sheet
        rather than the viewport.

        The Week item points at the week on screen, not at the period's live
        week: on this screen "Week" is where you already are, and an active
        item marked aria-current="page" that navigates somewhere else is a
        lie a screen reader reads out.
      */}
      <BottomNav active="week" periodId={periodId} weekNumber={weekNumber} />
    </div>
  );
}

function CategoryCard({
  category,
  open,
  onToggle,
  transactions,
  highlightId,
}: {
  category: WeeklyCategoryTotal;
  open: boolean;
  onToggle: () => void;
  transactions: WeekTransactionItem[];
  highlightId: number | null;
}) {
  const headline = headlineFor(category.spent, category.goal, category.remaining);

  return (
    <Accordion
      open={open}
      onToggle={onToggle}
      header={
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: "var(--type-body)", fontWeight: 600 }}>{category.title}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "var(--type-label)", fontWeight: 600, color: headline.color }}>{headline.text}</span>
              {category.goal !== null && (
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                  of {gbp(category.goal)}
                </span>
              )}
              <Caret open={open} />
            </span>
          </div>
          <Bar spend={category.spent} budget={category.goal ?? 0} size="category" />
        </div>
      }
    >
      {transactions.length === 0 ? (
        <Row>
          <span style={{ fontSize: "var(--type-label)", color: "var(--text-secondary)" }}>Nothing filed here yet.</span>
        </Row>
      ) : (
        transactions.map((item, i) => (
          <JustChanged key={item.id} active={item.id === highlightId}>
          <Link href={`/transaction/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider={i > 0}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: "var(--type-label)", fontWeight: 500 }}>{item.merchant?.trim() || "Untitled"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: "var(--type-label)",
                      fontWeight: 600,
                      color: item.needsAttention ? "var(--attention-ink)" : item.pending ? "var(--amber-ink)" : "var(--text-primary)",
                    }}
                  >
                    {gbp(item.amount)}
                  </span>
                  {item.pending && (
                    <Pill tone="amber" uppercase>
                      pending
                    </Pill>
                  )}
                  {item.needsAttention && (
                    <Pill uppercase style={{ color: "var(--attention-ink)", background: "var(--attention-tint-bg)" }}>
                      needs a look
                    </Pill>
                  )}
                </span>
              </div>
              {item.note && (
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                  {item.note}
                </span>
              )}
            </Row>
          </Link>
          </JustChanged>
        ))
      )}
    </Accordion>
  );
}
