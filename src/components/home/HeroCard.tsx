import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatGBP, heroForecastSentence, heroTodaySentence } from "./format";
import type { HeroView } from "./types";

export type HeroMode = "today" | "forecast";

interface HeroCardProps {
  hero: HeroView;
  mode: HeroMode;
  onModeChange: (mode: HeroMode) => void;
}

/**
 * README 02.2. Two states sharing one layout: End of month (default) on
 * the lime→cyan gradient, Today on the raised dark/light surface. Copy for
 * the eyebrow and the one explanatory sentence is the design's own
 * (docs/design/handoff/Max App v1.dc.html); only the week count, month
 * name and figures are live.
 */
export function HeroCard({ hero, mode, onModeChange }: HeroCardProps) {
  const forecast = mode === "forecast";
  const spare = forecast ? hero.forecast.spare : hero.today.spare;
  const spend = forecast ? hero.forecast.spend : hero.today.spend;
  const eyebrow = forecast ? `Forecast · spare on ${hero.endOfMonthLabel}` : "Actual · spare today";
  const sentence = forecast
    ? heroForecastSentence(hero.daysRemaining, hero.monthName)
    : heroTodaySentence(hero.daysRemaining);
  // Below zero is the one case where the hero must not look like good news.
  const isOver = spare !== null && spare < 0;
  const ink1 = forecast
    ? "var(--hero-ink-1)"
    : isOver
      ? "var(--bar-over)"
      : "var(--text-primary)";
  const ink2 = forecast ? "var(--hero-ink-2)" : "var(--text-secondary)";
  const ink3 = forecast ? "var(--hero-ink-3)" : "var(--text-tertiary)";

  return (
    <Card
      size="hero"
      raised={!forecast}
      padding="18px 22px 22px"
      style={forecast ? { background: isOver ? "var(--hero-gradient-over)" : "var(--hero-gradient)" } : undefined}
    >
      <SegmentedControl
        tone={forecast ? "onGradient" : "default"}
        value={mode}
        onChange={onModeChange}
        className="self-end"
        options={[
          { value: "today", label: "Today" },
          { value: "forecast", label: "End of month" },
        ]}
      />

      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: ink3,
        }}
      >
        {eyebrow}
      </span>

      <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.94, color: ink1 }}>
        {spare === null ? "£—" : formatGBP(spare)}
      </span>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: ink2 }}>
        {spare === null ? "Add an income figure and this fills in." : sentence}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingTop: 10,
          borderTop: `1px solid ${forecast ? "rgba(14,15,20,0.18)" : "var(--hairline-4)"}`,
          marginTop: 2,
        }}
      >
        {spend !== null && hero.income !== null ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em", color: ink1 }}>
              {formatGBP(spend)}
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: ink3 }}>of</span>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em", color: ink1 }}>
              {formatGBP(hero.income)}
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: ink3 }}>income</span>
          </div>
        ) : (
          <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: ink3 }}>income not set</span>
        )}
        <Link
          href="/income"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: ink1,
            background: forecast ? "rgba(255,255,255,0.6)" : "var(--surface)",
            borderRadius: "var(--radius-pill)",
            padding: "6px 11px",
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          edit income
        </Link>
      </div>
    </Card>
  );
}
