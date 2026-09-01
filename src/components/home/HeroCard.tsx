"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tape } from "@/components/ui/Tape";
import { formatGBP, heroForecastSentence, heroTodaySentence } from "./format";
import { heroForecastTape, heroTodayTape } from "./evidence";
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
    ? heroForecastSentence(hero.daysRemaining, hero.monthName, hero.forecastDetail)
    : heroTodaySentence(hero.daysRemaining);
  // Below zero is the one case where the hero must not look like good news.
  const isOver = spare !== null && spare < 0;
  // On the gradient the colour is the card. Off it, the number carries the
  // verdict itself: lime when there is room, red when there isn't.
  const ink1 = forecast
    ? "var(--hero-ink-1)"
    : spare === null
      ? "var(--text-primary)"
      : isOver
        ? "var(--bar-over)"
        : "var(--lime-ink)";
  const ink2 = forecast ? "var(--hero-ink-2)" : "var(--text-secondary)";
  const ink3 = forecast ? "var(--hero-ink-3)" : "var(--text-tertiary)";
  const figureText = spare === null ? "£—" : formatGBP(spare);
  // Built per mode, and returned as null unless its lines reach the figure.
  const openable = forecast ? heroForecastTape(hero) : heroTodayTape(hero);

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
          fontVariantNumeric: "tabular-nums",
          fontSize: "var(--type-micro)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: ink3,
        }}
      >
        {eyebrow}
      </span>

      {/*
        THE TAPE, on the one figure on this screen that cannot be checked
        anywhere else.

        Every other number on Home is one tap from the rows it is made of. This
        one is income minus everything, and before this it was simply asserted:
        the user either believed it or they closed the app. That is exactly the
        number D-5 is about, and the two parser defects that made D-5 a rule
        were both found by opening a figure up.

        The tape opens beneath the figure and the figure does not move.
      */}
      <Tape
        // Keyed by mode: Today and End of month are two different questions
        // with two different workings, so switching hands off hard rather than
        // resizing an open panel underneath a figure that just changed.
        key={mode}
        block={openable}
        label={`Show how ${figureText} is worked out`}
        ink={
          forecast
            ? {
                // On the gradient the card supplies its own ink scale; the
                // page's text tokens are chosen for the page's background and
                // would be near-invisible here.
                strong: "var(--hero-ink-1)",
                line: "var(--hero-ink-2)",
                quiet: "var(--hero-ink-3)",
                rule: "color-mix(in oklab, var(--hero-ink-1) 22%, transparent)",
                underline: "var(--hero-ink-1)",
              }
            : undefined
        }
      >
        <span style={{ display: "block", fontFamily: "var(--font-figure), Georgia, serif", fontSize: "var(--type-figure)", fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1, color: ink1 }}>
          {figureText}
        </span>
      </Tape>

      <p style={{ margin: 0, fontSize: "var(--type-body)", lineHeight: 1.5, color: ink2 }}>
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
            <span style={{ fontSize: "var(--type-body)", fontWeight: 800, letterSpacing: "-0.03em", color: ink1 }}>
              {formatGBP(spend)}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: ink3 }}>of</span>
            <span style={{ fontSize: "var(--type-body)", fontWeight: 800, letterSpacing: "-0.03em", color: ink1 }}>
              {formatGBP(hero.income)}
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: ink3 }}>income</span>
          </div>
        ) : (
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: ink3 }}>income not set</span>
        )}
        <Link
          href="/income"
          style={{
            fontVariantNumeric: "tabular-nums",
            fontSize: "var(--type-micro)",
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
