"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatGBP, formatSignedGBP, moneyColor, monthAbbr } from "@/components/home/format";
import { Caret } from "@/components/ui/Accordion";
import { BackArrowIcon } from "@/components/ui/icons";
import type { YearMonth, YearOverview } from "@/lib/queries/year";
import { buildCumulativeChart } from "./chart";
import { YEAR_EMPTY_COPY, YEAR_UNKNOWN_INCOME_COPY, YEAR_UNKNOWN_RUNNING_COPY, yearNetSentence } from "./copy";

const SHARE_COLORS: Record<YearOverview["shares"][number]["key"], string> = {
  // Were dark-theme-only hex literals, which is why they went muddy on a light
  // page. Three weights of the same neutral ink, so the three spend slices read
  // as one family and only "kept" carries the accent.
  recurring: "var(--text-secondary)",
  weekly: "var(--text-tertiary)",
  oneOff: "var(--text-disabled-2)",
  kept: "var(--lime-ink)",
};

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "var(--hairline-1)" }} />
    </div>
  );
}

function ShareBar({ data }: { data: YearOverview }) {
  if (data.income === null || data.income <= 0) return null;
  return (
    <div
      role="img"
      aria-label={data.shares.map((share) => `${share.label} ${formatPercent(share.incomePercent)}`).join(", ")}
      style={{ display: "flex", width: "100%", height: 10, overflow: "hidden", borderRadius: "var(--radius-pill)", background: "var(--surface-inset)" }}
    >
      {data.shares.map((share) => share.barPercent > 0 && (
        <span key={share.key} style={{ width: `${share.barPercent}%`, background: SHARE_COLORS[share.key] }} />
      ))}
    </div>
  );
}

function MonthRow({ month }: { month: YearMonth }) {
  const [open, setOpen] = useState(false);
  const tone = moneyColor(month.position);
  // A month with nothing imported still gets a row — the absence is the
  // information — but it does not pretend to open onto anything.
  const expandable = month.present;
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-row)", overflow: "hidden", opacity: expandable ? 1 : 0.55 }}>
      <button
        type="button"
        disabled={!expandable}
        onClick={() => expandable && setOpen((value) => !value)}
        aria-expanded={expandable ? open : undefined}
        style={{ width: "100%", border: 0, background: "transparent", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", cursor: expandable ? "pointer" : "default", font: "inherit" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "var(--type-label)", fontWeight: 600, letterSpacing: "-0.01em", minWidth: 34 }}>{monthAbbr(month.monthIndex)}</span>
          {month.periodLabels.length > 1 && (
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-tertiary)" }}>
              {month.periodLabels.length} periods
            </span>
          )}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: "var(--type-label)", fontWeight: 700, letterSpacing: "-0.02em", color: tone }}>
            {month.position === null ? "—" : formatSignedGBP(month.position)}
          </span>
          {expandable ? <Caret open={open} /> : <span style={{ width: 16 }} />}
        </span>
      </button>
      {open && expandable && (
        <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            {month.periodIds.map((periodId, index) => (
              <Link key={periodId} href={`/?period=${periodId}`} style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", textDecoration: "none" }}>
                {month.periodIds.length === 1 ? `open ${monthAbbr(month.monthIndex)}` : `open ${month.periodLabels[index]}`} ›
              </Link>
            ))}
          </div>
          {([
            ["all weekly", month.weekly, false],
            ["recurring", month.recurring, false],
            ["one-off spend", month.oneOff, false],
            ["income", month.income, true],
          ] as const).map(([label, amount, income]) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, paddingTop: 9, borderTop: "1px solid var(--hairline-1)" }}>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-secondary-2)" }}>{label}</span>
              <span style={{ fontSize: "var(--type-label)", fontWeight: 600, color: income ? "var(--lime-ink)" : "var(--text-primary)" }}>
                {amount === null ? "—" : formatGBP(amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RunningPosition({ data }: { data: YearOverview }) {
  const chart = buildCumulativeChart(data.months);
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card-sm)", padding: "20px 18px 16px", display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Running position</span>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: moneyColor(data.kpis.lowPoint?.amount) }}>
          {data.kpis.lowPoint ? `low ${formatSignedGBP(data.kpis.lowPoint.amount)}` : "—"}
        </span>
      </div>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Cumulative net position by month">
        <line x1="0" y1={chart.zeroY} x2={chart.width} y2={chart.zeroY} stroke="var(--hairline-3)" strokeWidth="1" strokeDasharray="3 4" />
        <polyline points={chart.polyline} fill="none" stroke="var(--lime-ink)" strokeWidth="2" strokeLinejoin="round" />
        {chart.points.map((point) => (
          <circle key={point.monthIndex} cx={point.x} cy={point.y} r="3" fill={point.value < 0 ? "var(--bar-over)" : "var(--lime-ink)"} />
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${chart.points.length}, minmax(0, 1fr))` }}>
        {chart.points.map((point) => (
          <span key={point.monthIndex} style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-tertiary)" }}>
            {monthAbbr(point.monthIndex)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Kpis({ data }: { data: YearOverview }) {
  const rows = [
    // Colour comes from the sign in every row. "Worst month" is still the worst
    // month when it finished ahead — it just isn't red.
    ["best month", data.kpis.best ? monthAbbr(data.kpis.best.monthIndex) : "—", data.kpis.best?.position ?? null, moneyColor(data.kpis.best?.position)],
    ["worst month", data.kpis.worst ? monthAbbr(data.kpis.worst.monthIndex) : "—", data.kpis.worst?.position ?? null, moneyColor(data.kpis.worst?.position)],
    ["average month", "", data.kpis.averagePosition, moneyColor(data.kpis.averagePosition)],
  ] as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "0 2px" }}>
      {rows.map(([label, month, amount, color], index) => (
        <div key={label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "13px 0", borderBottom: index < rows.length - 1 ? "1px solid var(--hairline-1)" : undefined }}>
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>{label}</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            {month && <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-secondary-2)" }}>{month}</span>}
            <span style={{ fontSize: "var(--type-label)", fontWeight: 700, letterSpacing: "-0.02em", color }}>
              {amount === null ? "—" : formatSignedGBP(amount)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function YearView({ data, availableYears }: { data: YearOverview; availableYears: number[] }) {
  const router = useRouter();
  const yearIndex = availableYears.indexOf(data.year);
  const previous = yearIndex > 0 ? availableYears[yearIndex - 1] : null;
  const next = yearIndex >= 0 && yearIndex < availableYears.length - 1 ? availableYears[yearIndex + 1] : null;
  const netColor = moneyColor(data.netPosition);

  return (
    <div style={{ position: "fixed", inset: 0, maxWidth: 480, margin: "0 auto", background: "var(--bg)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "14px 20px 6px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <button type="button" onClick={() => router.back()} aria-label="Back" style={{ width: 38, height: 38, borderRadius: "var(--radius-pill)", border: 0, background: "var(--surface)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <BackArrowIcon />
        </button>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Year round-up</span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto" }}>
          {previous === null ? <span style={{ width: 34 }} /> : <Link href={`/year?year=${previous}`} aria-label={`View ${previous}`} style={{ width: 34, height: 34, display: "grid", placeItems: "center", textDecoration: "none", fontSize: "var(--type-title)" }}>‹</Link>}
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", fontWeight: 500, minWidth: 44, textAlign: "center" }}>{data.year}</span>
          {next === null ? <span style={{ width: 34 }} /> : <Link href={`/year?year=${next}`} aria-label={`View ${next}`} style={{ width: 34, height: 34, display: "grid", placeItems: "center", textDecoration: "none", fontSize: "var(--type-title)" }}>›</Link>}
        </div>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "18px 20px 40px", display: "flex", flexDirection: "column", gap: 30 }}>
        {data.periodCount === 0 ? (
          <div style={{ minHeight: "55vh", display: "grid", placeItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: "var(--type-heading)", fontWeight: 800 }}>{YEAR_EMPTY_COPY.title}</h1>
              <p style={{ margin: 0, maxWidth: 300, fontSize: "var(--type-body)", lineHeight: 1.5, color: "var(--text-secondary)" }}>{data.periodCount === 0 ? YEAR_EMPTY_COPY.none : YEAR_EMPTY_COPY.one}</p>
              <Link href="/import" style={{ marginTop: 4, textDecoration: "none", fontWeight: 700 }}>{YEAR_EMPTY_COPY.action}</Link>
            </div>
          </div>
        ) : (
          <>
            <section style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Net position</span>
              <h1 style={{ margin: 0, fontFamily: "var(--font-figure), Georgia, serif", fontSize: "var(--type-figure)", fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1, color: netColor }}>
                {data.netPosition === null ? "—" : formatSignedGBP(data.netPosition)}
              </h1>
              <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-secondary-2)" }}>
                {data.income === null || data.netPosition === null
                  ? YEAR_UNKNOWN_INCOME_COPY
                  : yearNetSentence(data.netPosition, formatPercent(data.keptPercent), formatGBP(data.income))}
              </span>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SectionTitle>Where income went</SectionTitle>
              <ShareBar data={data} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {data.shares.map((share) => {
                  const keptNegative = share.key === "kept" && share.amount !== null && share.amount < 0;
                  return (
                    <div key={share.key} style={{ minWidth: 0, border: share.key === "kept" ? `1px solid ${keptNegative ? "var(--tile-negative-border)" : "var(--tile-positive-border)"}` : "1px solid var(--hairline-1)", borderRadius: "var(--radius-row)", padding: "15px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-tertiary)" }}>{share.label}</span>
                      <span style={{ fontSize: "var(--type-title)", fontWeight: 700, letterSpacing: "-0.03em", color: keptNegative ? "var(--bar-over)" : undefined }}>{share.amount === null ? "—" : share.key === "kept" ? formatSignedGBP(share.amount) : formatGBP(share.amount)}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-secondary-2)" }}>{formatPercent(share.incomePercent)}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-secondary-2)", lineHeight: 1.45 }}>{share.monthlyAverage === null ? "—" : `~${formatGBP(Math.abs(share.monthlyAverage))} / ${formatPercent(share.incomePercent)} per month`}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SectionTitle>Month by month</SectionTitle>
              {data.income === null ? (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-card-sm)", padding: 20, fontSize: "var(--type-label)", lineHeight: 1.5, color: "var(--text-secondary)", textAlign: "center" }}>
                  {YEAR_UNKNOWN_RUNNING_COPY}
                </div>
              ) : (
                <RunningPosition data={data} />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.months.map((month) => <MonthRow key={month.monthIndex} month={month} />)}
              </div>
              {data.income !== null && <Kpis data={data} />}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
