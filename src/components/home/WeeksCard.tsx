import Link from "next/link";
import { Bar } from "@/components/ui/Bar";
import { Caret } from "@/components/ui/Accordion";
import { Pill } from "@/components/ui/Chip";
import { Row } from "@/components/ui/Row";
import { NO_WEEKLY_TARGETS_PROMPT, formatGBP, moneyToneColor } from "./format";
import type { WeeksSummaryView, WeekView } from "./types";

interface WeeksCardProps {
  weeks: WeekView[];
  /**
   * The period these weeks came from. Carried into the link because "week 2"
   * means nothing on its own — without it the week screen picks its own month.
   */
  periodId: number;
  summary: WeeksSummaryView;
  open: boolean;
  onToggle: () => void;
}

/**
 * README 02.3. A simple show/hide (not the single-open accordion the week
 * *categories* use elsewhere) — the header carries the month's weekly
 * total, one roomy row per week underneath.
 */
export function WeeksCard({ weeks, periodId, summary, open, onToggle }: WeeksCardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 16px 10px", background: "var(--surface)", borderRadius: "var(--radius-card-lg)" }}>
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          padding: "16px 4px 14px",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Caret open={open} />
          <span style={{ fontSize: "var(--type-body)", fontWeight: 700, letterSpacing: "-0.02em" }}>Weeks</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          {summary.left !== null ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span
                  style={{
                    fontSize: "var(--type-heading)",
                    fontWeight: 800,
                    letterSpacing: "-0.035em",
                    color: summary.left < 0 ? "var(--bar-over)" : "var(--lime-ink)",
                  }}
                >
                  {formatGBP(summary.left < 0 ? -summary.left : summary.left)}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                  {summary.left < 0 ? "over" : "left"}
                </span>
              </div>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-disabled-2)" }}>
                {formatGBP(summary.spent)} spent of {formatGBP(summary.budget ?? 0)} this month
              </span>
            </>
          ) : (
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-disabled-2)" }}>
              {formatGBP(summary.spent)} spent this month
            </span>
          )}
        </div>
      </div>

      {/*
        Deliberately a sibling of the toggle header, not a child of it: a link
        inside a role="button" is both an a11y error and a click that fires two
        things at once. See NO_WEEKLY_TARGETS_PROMPT for why it exists.
      */}
      {summary.budget === null && (
        <Link href="/goals" style={{ color: "inherit", textDecoration: "none" }}>
          <Row interactive padding="14px 4px 15px">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>
                {NO_WEEKLY_TARGETS_PROMPT}
              </span>
              <span style={{ fontSize: "var(--type-body)", color: "var(--text-disabled)", lineHeight: 1 }} aria-hidden>
                &rsaquo;
              </span>
            </div>
          </Row>
        </Link>
      )}

      {open &&
        weeks.map((week, i) => (
          <Link key={week.weekNumber} href={`/week/${week.weekNumber}?period=${periodId}`} style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider={i > 0} padding="22px 4px 24px" style={{ gap: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: "var(--type-label)", fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-secondary)" }}>
                      {week.range}
                    </span>
                    {week.isLive && <Pill tone="lime" uppercase>now</Pill>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "var(--type-heading)", fontWeight: 800, letterSpacing: "-0.035em", color: moneyToneColor(week.state.tone) }}>
                      {formatGBP(week.state.amount)}
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                      {week.state.word}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "var(--type-body)", color: "var(--text-disabled)", lineHeight: 1 }} aria-hidden>
                  &rsaquo;
                </span>
              </div>

              <Bar spend={week.spent} budget={week.goal ?? 0} size="week" />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {week.categories.map((c) => (
                  <div key={c.category} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        fontSize: "var(--type-micro)",
                        letterSpacing: "0.06em",
                        color: "var(--text-disabled-2)",
                        textTransform: "lowercase",
                      }}
                    >
                      {c.title}
                    </span>
                    <span style={{ fontSize: "var(--type-body)", fontWeight: 700, color: moneyToneColor(c.state.tone) }}>
                      {formatGBP(c.state.amount)}
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-disabled)" }}>
                      {c.footer}
                    </span>
                  </div>
                ))}
              </div>
            </Row>
          </Link>
        ))}
    </div>
  );
}
