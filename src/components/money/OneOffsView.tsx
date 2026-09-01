"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Chip";
import { StatusPill } from "@/components/ui/StatusPill";
import type { OneOffs } from "@/lib/queries";
import { instalmentsStillDue } from "./derive";
import { formatMoney } from "./format";
import { JustChanged } from "@/components/ui/JustChanged";
import { sheetParent } from "@/lib/routes";
import { MoneySheet } from "./MoneySheet";

interface SpareForecast {
  amount: number | null;
  spend: number | null;
  income: number | null;
  endLabel: string | null;
}

interface OneOffsViewProps {
  periodId: number;
  monthLabel: string;
  oneOffs: OneOffs;
  spare: SpareForecast;
  /** The row just added or edited, to mark it wherever its amount sorts it. */
  highlightId?: number | null;
}

export function OneOffsView({ periodId, monthLabel, oneOffs, spare, highlightId = null }: OneOffsViewProps) {
  return (
    <MoneySheet addHref={`/add?period=${periodId}&kind=one_off`} backHref={sheetParent(periodId)}>
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
            {monthLabel} · one-offs
          </span>
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: "var(--type-micro)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            Genuinely spare{spare.endLabel ? ` on ${spare.endLabel}` : ""}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-figure), Georgia, serif", fontSize: "var(--type-figure)",
              fontWeight: 400,
              letterSpacing: "-0.015em",
              lineHeight: 1,
              color: spare.amount === null || spare.amount >= 0 ? "var(--lime-ink)" : "var(--bar-over)",
            }}
          >
            {spare.amount === null ? "£—" : formatMoney(spare.amount)}
          </h1>
          {spare.spend !== null && spare.income !== null ? (
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
              {formatMoney(spare.spend)} forecast spend of {formatMoney(spare.income)} income
            </span>
          ) : spare.income === null ? (
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
              Add an income figure and this fills in.
            </span>
          ) : (
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
              This period has no dates for a forecast.
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: "var(--type-micro)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {formatMoney(oneOffs.total)} one-offs
          </span>
          <span style={{ height: 1, flex: 1, background: "var(--hairline-2)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {oneOffs.items.length === 0 ? (
            <Card size="sm" padding="16px">
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                No one-offs in this period.
              </span>
            </Card>
          ) : (
            oneOffs.items.map((item) => {
              const due = item.pending ? instalmentsStillDue(item.note) : null;
              return (
                <JustChanged key={item.id} active={item.id === highlightId}>
                <Link
                  href={`/transaction/${item.id}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  <Card interactive size="sm" padding="15px 16px" style={{ gap: 9 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: "var(--type-label)", fontWeight: 600, letterSpacing: "-0.01em" }}>
                          {item.merchant ?? "—"}
                        </span>
                        {item.pending && <Pill tone="amber" uppercase>pending</Pill>}
                        {item.needsAttention && <StatusPill status="review">needs a look</StatusPill>}
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "var(--type-body)",
                          fontWeight: 700,
                          letterSpacing: "-0.025em",
                          color: item.needsAttention ? "var(--status-review-ink)" : item.pending ? "var(--status-pending-ink)" : "var(--text-primary)",
                        }}
                      >
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                    {(item.label || item.note || due) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                        {item.label && <Pill tone="cyan">{item.label}</Pill>}
                        {item.note && (
                          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                            {item.note}
                          </span>
                        )}
                        {due && (
                          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--status-pending-ink)" }}>
                            {due}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
                </JustChanged>
              );
            })
          )}
        </div>
      </div>
    </MoneySheet>
  );
}
