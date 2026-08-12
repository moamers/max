import { listPeriodSummaries, tagBreakdownForPeriod, PeriodSummaryRow } from "@/lib/store";

export const dynamic = "force-dynamic";

function fmtGBP(n: number): string {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

interface Metric {
  key: "fixedPct" | "variablePct" | "weeklyPct" | "netPct";
  label: string;
  color: string;
  goodDirection: "up" | "down";
}

const METRICS: Metric[] = [
  { key: "fixedPct", label: "Fixed spend", color: "var(--series-bills)", goodDirection: "down" },
  { key: "variablePct", label: "Variable/extras spend", color: "var(--series-extras)", goodDirection: "down" },
  { key: "weeklyPct", label: "Weekly spend", color: "var(--series-weekly)", goodDirection: "down" },
  { key: "netPct", label: "Net position", color: "var(--good)", goodDirection: "up" },
];

function withPercentages(rows: PeriodSummaryRow[]) {
  return rows.map((r) => ({
    ...r,
    fixedPct: r.income ? r.total_fixed / r.income : 0,
    variablePct: r.income ? r.total_variable / r.income : 0,
    weeklyPct: r.income ? r.total_weekly / r.income : 0,
    netPct: r.income ? r.final_position / r.income : 0,
  }));
}

function StackedBarChart({ rows }: { rows: PeriodSummaryRow[] }) {
  const width = 760;
  const height = 320;
  const padding = { top: 24, right: 16, bottom: 56, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const totals = rows.map((r) => r.total_fixed + r.total_variable + r.total_weekly);
  const maxTotal = Math.max(...totals, 1);
  const niceMax = Math.ceil(maxTotal / 1000) * 1000;

  const barSlot = plotW / rows.length;
  const barWidth = Math.min(64, barSlot * 0.55);

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => (niceMax / gridSteps) * i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Spend by category per pay period">
      {gridValues.map((gv) => {
        const y = padding.top + plotH - (gv / niceMax) * plotH;
        return (
          <g key={gv}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--gridline)" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
              {gv >= 1000 ? `£${(gv / 1000).toFixed(0)}k` : `£${gv}`}
            </text>
          </g>
        );
      })}
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={padding.top + plotH}
        y2={padding.top + plotH}
        stroke="var(--baseline)"
        strokeWidth={1}
      />

      {rows.map((r, i) => {
        const x = padding.left + i * barSlot + (barSlot - barWidth) / 2;
        const segments: { value: number; color: string; label: string }[] = [
          { value: r.total_fixed, color: "var(--series-bills)", label: "Fixed" },
          { value: r.total_variable, color: "var(--series-extras)", label: "Variable" },
          { value: r.total_weekly, color: "var(--series-weekly)", label: "Weekly" },
        ];
        let cumulative = 0;
        const total = totals[i];

        return (
          <g key={r.period_id}>
            {segments.map((seg) => {
              const segH = (seg.value / niceMax) * plotH;
              const y = padding.top + plotH - (cumulative / niceMax) * plotH - segH;
              cumulative += seg.value;
              if (seg.value <= 0) return null;
              return (
                <rect
                  key={seg.label}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(segH - 2, 0)}
                  rx={3}
                  fill={seg.color}
                >
                  <title>{`${r.label} — ${seg.label}: ${fmtGBP(seg.value)}`}</title>
                </rect>
              );
            })}
            <text
              x={x + barWidth / 2}
              y={padding.top + plotH - (total / niceMax) * plotH - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-secondary)"
            >
              {fmtGBP(total)}
            </text>
            <text
              x={x + barWidth / 2}
              y={padding.top + plotH + 18}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-muted)"
            >
              {r.label.length > 14 ? r.label.slice(0, 13) + "…" : r.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Legend() {
  const items = [
    { label: "Fixed (bills)", color: "var(--series-bills)" },
    { label: "Variable (extras)", color: "var(--series-extras)" },
    { label: "Weekly (grocery/weekend/transport)", color: "var(--series-weekly)" },
  ];
  return (
    <div className="flex flex-wrap gap-4 text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function StatTile({
  label,
  value,
  avg,
  hasHistory,
  goodDirection,
  format,
}: {
  label: string;
  value: number;
  avg: number;
  hasHistory: boolean;
  goodDirection: "up" | "down";
  format: (n: number) => string;
}) {
  const delta = value - avg;
  const isUp = delta > 0;
  const isGood = goodDirection === "up" ? isUp : !isUp;
  const showDelta = hasHistory && Math.abs(delta) > 0.005;

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1">{format(value)}</p>
      {showDelta && (
        <p
          className="text-sm mt-1 flex items-center gap-1"
          style={{ color: isGood ? "var(--good-text)" : "var(--critical)" }}
        >
          <span aria-hidden>{isUp ? "▲" : "▼"}</span>
          {format(Math.abs(delta))} vs your average
        </p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const rows = listPeriodSummaries();

  if (rows.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No data yet</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Upload a workbook from the home page to see your dashboard.
        </p>
      </div>
    );
  }

  const withPct = withPercentages(rows);
  const latest = withPct[withPct.length - 1];
  const history = withPct.slice(0, -1);
  const tagBreakdown = tagBreakdownForPeriod(latest.period_id).slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-1">Your budget dashboard</h1>
      <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
        Latest period: <strong>{latest.label}</strong>
        {history.length > 0
          ? ` — compared against your average across ${history.length} prior period${history.length === 1 ? "" : "s"}.`
          : " — upload more periods to unlock the self-benchmark comparison."}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatTile
          label="Income"
          value={latest.income}
          avg={average(history.map((h) => h.income))}
          hasHistory={history.length > 0}
          goodDirection="up"
          format={fmtGBP}
        />
        {METRICS.map((m) => (
          <StatTile
            key={m.key}
            label={m.label}
            value={latest[m.key]}
            avg={average(history.map((h) => h[m.key]))}
            hasHistory={history.length > 0}
            goodDirection={m.goodDirection}
            format={pct}
          />
        ))}
      </div>

      <div className="rounded-lg border p-6 mb-10" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="font-medium mb-4">Spend by category, per pay period</h2>
        <Legend />
        <StackedBarChart rows={rows} />
      </div>

      <div className="rounded-lg border p-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="font-medium mb-4">Where {latest.label}&rsquo;s spend went, by tag</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Pulled straight from the free-text tags on each transaction — no fixed category list.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--text-muted)" }}>
              <th className="pb-2 font-normal">Tag</th>
              <th className="pb-2 font-normal">Section</th>
              <th className="pb-2 font-normal text-right">Transactions</th>
              <th className="pb-2 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {tagBreakdown.map((t) => (
              <tr key={`${t.tag}-${t.section}`} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                <td className="py-2">{t.tag}</td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                  {t.section}
                </td>
                <td className="py-2 text-right">{t.count}</td>
                <td className="py-2 text-right font-medium">{fmtGBP(t.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
