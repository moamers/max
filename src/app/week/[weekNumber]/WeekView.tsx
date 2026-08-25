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
import type { WeekTotals, WeeklyCategoryTotal } from "@/lib/queries";
import { WEEKLY_CATEGORIES, type WeeklyCategory } from "@/lib/transactions";
import { formatGBP as gbp } from "@/lib/money";
import { JustChanged } from "@/components/ui/JustChanged";

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
      <Sheet variant="full" onBack={() => router.back()}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 20px 108px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
              }}
            >
              {monthName} · Week {weekNumber}
            </span>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.035em", margin: 0, textWrap: "balance" }}>
              {rangeLabel ?? `Week ${weekNumber}`}
            </h1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.035em", color: headline.color }}>
                {headline.text}
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>
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

        <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 7 }}>
          <FAB
            aria-label="Add a transaction to this week"
            onClick={() => router.push(`/add?week=${weekNumber}&period=${periodId}&kind=weekly`)}
          />
        </div>
      </Sheet>
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
            <span style={{ fontSize: 16, fontWeight: 600 }}>{category.title}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: headline.color }}>{headline.text}</span>
              {category.goal !== null && (
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
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
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Nothing filed here yet.</span>
        </Row>
      ) : (
        transactions.map((item, i) => (
          <JustChanged key={item.id} active={item.id === highlightId}>
          <Link href={`/transaction/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider={i > 0}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{item.merchant?.trim() || "Untitled"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 15,
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
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
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
