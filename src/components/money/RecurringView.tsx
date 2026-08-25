"use client";

import { useState } from "react";
import Link from "next/link";
import { Accordion, Caret } from "@/components/ui/Accordion";
import { Pill } from "@/components/ui/Chip";
import { Row } from "@/components/ui/Row";
import type { RecurringBreakdown } from "@/lib/queries";
import type { RecurringCategory } from "@/lib/transactions";
import { formatMoney } from "./format";
import { MoneySheet } from "./MoneySheet";
import { ShareBar } from "./ShareBar";

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
}
export function RecurringView({ periodId, monthLabel, recurring }: RecurringViewProps) {
  const [openGroup, setOpenGroup] = useState<RecurringCategory | null>("bills");

  return (
    <MoneySheet addHref={`/add?period=${periodId}&kind=recurring&category=housing`}>
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
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {monthLabel} · recurring
          </span>
          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {formatMoney(recurring.total)}
          </h1>
        </div>

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
                      <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" }}>{group.title}</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.025em" }}>
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
                      fontFamily: "var(--font-jetbrains-mono)",
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Nothing here yet.
                  </span>
                ) : (
                  group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/transaction/${item.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      <Row interactive divider padding="13px 0">
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 500 }}>{item.merchant ?? "—"}</span>
                            {item.pending && <Pill tone="amber" uppercase>pending</Pill>}
                          </div>
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 15,
                              fontWeight: 600,
                              letterSpacing: "-0.02em",
                              color: item.pending ? "var(--amber-ink)" : "var(--text-primary)",
                            }}
                          >
                            {formatMoney(item.amount)}
                          </span>
                        </div>
                        {item.note && (
                          <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                            {item.note}
                          </span>
                        )}
                      </Row>
                    </Link>
                  ))
                )}
              </Accordion>
            );
          })}
        </div>
      </div>
    </MoneySheet>
  );
}
