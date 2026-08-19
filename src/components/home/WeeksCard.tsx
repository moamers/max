import Link from "next/link";
import { Bar } from "@/components/ui/Bar";
import { Caret } from "@/components/ui/Accordion";
import { Pill } from "@/components/ui/Chip";
import { Row } from "@/components/ui/Row";
import { formatGBP, moneyToneColor } from "./format";
import type { WeeksSummaryView, WeekView } from "./types";

interface WeeksCardProps {
  weeks: WeekView[];
  summary: WeeksSummaryView;
  open: boolean;
  onToggle: () => void;
}

/**
 * README 02.3. A simple show/hide (not the single-open accordion the week
 * *categories* use elsewhere) — the header carries the month's weekly
 * total, one roomy row per week underneath.
 */
export function WeeksCard({ weeks, summary, open, onToggle }: WeeksCardProps) {
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
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>Weeks</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          {summary.left !== null ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.035em", color: "var(--lime-ink)" }}>
                  {formatGBP(summary.left)}
                </span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                  left
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: "var(--text-disabled-2)" }}>
                {formatGBP(summary.spent)} spent of {formatGBP(summary.budget ?? 0)} this month
              </span>
            </>
          ) : (
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10.5, color: "var(--text-disabled-2)" }}>
              {formatGBP(summary.spent)} spent this month
            </span>
          )}
        </div>
      </div>

      {open &&
        weeks.map((week, i) => (
          <Link key={week.weekNumber} href={`/week/${week.weekNumber}`} style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider={i > 0} padding="22px 4px 24px" style={{ gap: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-secondary)" }}>
                      {week.range}
                    </span>
                    {week.isLive && <Pill tone="lime" uppercase>now</Pill>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.035em", color: moneyToneColor(week.state.tone) }}>
                      {formatGBP(week.state.amount)}
                    </span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>
                      {week.state.word}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 16, color: "var(--text-disabled)", lineHeight: 1 }} aria-hidden>
                  &rsaquo;
                </span>
              </div>

              <Bar spend={week.spent} budget={week.goal ?? 0} size="week" />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {week.categories.map((c) => (
                  <div key={c.category} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        color: "var(--text-disabled-2)",
                        textTransform: "lowercase",
                      }}
                    >
                      {c.title}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: moneyToneColor(c.state.tone) }}>
                      {formatGBP(c.state.amount)}
                    </span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 9.5, color: "var(--text-disabled)" }}>
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
