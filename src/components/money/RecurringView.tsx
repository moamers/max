"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Accordion, Caret } from "@/components/ui/Accordion";
import { JustChanged } from "@/components/ui/JustChanged";
import { Pill } from "@/components/ui/Chip";
import { StatusPill } from "@/components/ui/StatusPill";
import { Row } from "@/components/ui/Row";
import type { RecurringBreakdown } from "@/lib/queries";
import type { RecurringCategory } from "@/lib/transactions";
import { formatMoney } from "./format";
import { sheetParent } from "@/lib/routes";
import { MoneySheet } from "./MoneySheet";
import { ShareBar } from "./ShareBar";
import { Button } from "@/components/ui/Button";
import { copyRecurringAction } from "@/app/recurring/actions";

const SHARE_COLORS: Record<RecurringCategory, string> = {
  housing: "#3A4152",
  childcare: "#4A5164",
  bills: "#5B637A",
  subscriptions: "#6E7789",
};

interface RecurringViewProps {
  periodId: number;
  monthLabel: string;
  recurring: RecurringBreakdown;
  /** The row just added or edited, to mark it wherever its amount sorts it. */
  highlightId?: number | null;
  /**
   * The month a copy would come from, or null when there is no earlier month
   * holding any. Null hides the button rather than offering one that would
   * quietly do nothing.
   */
  carrySourceLabel?: string | null;
}

/** The group a just-changed row is filed under, so it isn't marked inside a closed accordion. */
function groupHolding(recurring: RecurringBreakdown, id: number | null): RecurringCategory | null {
  if (id === null) return null;
  return recurring.groups.find((g) => g.items.some((i) => i.id === id))?.category ?? null;
}

export function RecurringView({
  periodId,
  monthLabel,
  recurring,
  highlightId = null,
  carrySourceLabel = null,
}: RecurringViewProps) {
  // Opening on the highlighted row's group beats the default: a marked row
  // inside a collapsed group is no more findable than an unmarked one.
  const [openGroup, setOpenGroup] = useState<RecurringCategory | null>(
    () => groupHolding(recurring, highlightId) ?? "bills"
  );

  return (
    <MoneySheet addHref={`/add?period=${periodId}&kind=recurring`} backHref={sheetParent(periodId)}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 20px 96px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: "var(--type-caption)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {monthLabel} · recurring
          </span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-figure), Georgia, serif", fontSize: "var(--type-figure)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {formatMoney(recurring.total)}
          </h1>
        </div>

        {recurring.groups.every((group) => group.items.length === 0) ? (
          <EmptyRecurring periodId={periodId} sourceLabel={carrySourceLabel} />
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recurring.groups.map((group) => {
            const open = openGroup === group.category;
            return (
              <Accordion
                key={group.category}
                open={open}
                onToggle={() => setOpenGroup(open ? null : group.category)}
                header={
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: "var(--type-body)", fontWeight: 600, letterSpacing: "-0.015em" }}>{group.title}</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                        <span style={{ fontSize: "var(--type-body)", fontWeight: 700, letterSpacing: "-0.025em" }}>
                          {formatMoney(group.total)}
                        </span>
                        <Caret open={open} />
                      </div>
                    </div>
                    <ShareBar
                      title={group.title}
                      amount={group.total}
                      total={recurring.total}
                      color={SHARE_COLORS[group.category]}
                    />
                  </>
                }
              >
                {group.items.length === 0 ? (
                  <span
                    style={{
                      padding: "13px 0",
                      borderTop: "1px solid var(--hairline-2)",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "var(--type-caption)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Nothing here yet.
                  </span>
                ) : (
                  group.items.map((item) => (
                    <JustChanged key={item.id} active={item.id === highlightId}>
                    <Link
                      href={`/transaction/${item.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <Row interactive divider padding="13px 0">
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span style={{ fontSize: "var(--type-label)", fontWeight: 500 }}>{item.merchant ?? "—"}</span>
                            {item.pending && <Pill tone="amber" uppercase>pending</Pill>}
                            {item.needsAttention && <StatusPill status="review">needs a look</StatusPill>}
                          </div>
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: "var(--type-label)",
                              fontWeight: 600,
                              letterSpacing: "-0.02em",
                              color: item.needsAttention ? "var(--status-review-ink)" : item.pending ? "var(--status-pending-ink)" : "var(--text-primary)",
                            }}
                          >
                            {formatMoney(item.amount)}
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
          })}
        </div>
        )}
      </div>
    </MoneySheet>
  );
}

/**
 * A month with no recurring in it yet.
 *
 * The offer is the founder's: "when recurring is empty in an existing month the
 * empty state has a button that says 'copy from previous month'". One press,
 * one write — opening this screen copies nothing.
 */
function EmptyRecurring({ periodId, sourceLabel }: { periodId: number; sourceLabel: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 18,
        borderRadius: "var(--radius-card-sm)",
        border: "1px solid var(--hairline-3)",
        background: "var(--surface)",
      }}
    >
      <p style={{ margin: 0, fontSize: "var(--type-body)", fontWeight: 700, letterSpacing: "-0.02em" }}>
        Nothing recurring in this month yet
      </p>
      <p style={{ margin: 0, fontSize: "var(--type-caption)", lineHeight: 1.45, color: "var(--text-secondary)" }}>
        {sourceLabel
          ? `Bring last month's across and amend what has changed. They arrive marked pending, so you confirm each one when it goes out.`
          : `Add the first one with the + button, and next month can start from a copy of this one.`}
      </p>
      {sourceLabel && (
        <>
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
            from {sourceLabel}
          </span>
          <Button
            height={54}
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await copyRecurringAction(periodId);
                if (!result.ok) {
                  setError(`I couldn't copy those across. (${result.message})`);
                  return;
                }
                router.refresh();
              });
            }}
          >
            {pending ? "Copying…" : "Copy from last month"}
          </Button>
        </>
      )}
      {error && (
        <span role="alert" style={{ fontSize: "var(--type-caption)", color: "var(--bar-over)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
