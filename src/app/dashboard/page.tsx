import {
  listPeriodSummaries,
  tagBreakdownForPeriod,
  weeklyTotalsForPeriod,
  sectionTotalsForPeriod,
} from "@/lib/store";
import { computeInsights, type MetricInsight } from "@/lib/insights";
import { buildNarrative, type NarrativeSentence, type SectionTotals } from "@/lib/narrative";
import { DeletePeriodButton } from "./DeletePeriodButton";
import type { PeriodSummary } from "@max/shared";

export const dynamic = "force-dynamic";

function fmtGBP(n: number): string {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Only worth showing a "vs average" line when the delta is more than noise — a
 * zero delta (e.g. income unchanged) shouldn't render a misleading up/down arrow. */
function formatDelta(delta: number | null, format: (n: number) => string): string | undefined {
  if (delta === null || Math.abs(delta) <= 0.005) return undefined;
  return `${format(Math.abs(delta))} vs your average`;
}

function StackedBarChart({ rows }: { rows: PeriodSummary[] }) {
  const width = 760;
  const height = 320;
  const padding = { top: 24, right: 16, bottom: 56, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const totals = rows.map((r) => r.totalFixed + r.totalVariable + r.totalWeekly);
  const maxTotal = Math.max(...totals, 1);
  const niceMax = Math.ceil(maxTotal / 1000) * 1000 || 1000;

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
          { value: r.totalFixed, color: "var(--series-bills)", label: "Fixed" },
          { value: r.totalVariable, color: "var(--series-extras)", label: "Variable" },
          { value: r.totalWeekly, color: "var(--series-weekly)", label: "Weekly" },
        ];
        let cumulative = 0;
        const total = totals[i];

        return (
          <g key={r.periodId}>
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
  deltaText,
  isGood,
}: {
  label: string;
  value: string;
  deltaText?: string;
  isGood: boolean | null;
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {deltaText && (
        <p
          className="text-sm mt-1 flex items-center gap-1"
          style={{ color: isGood ? "var(--good-text)" : "var(--critical)" }}
        >
          <span aria-hidden>{isGood ? "▲" : "▼"}</span>
          {deltaText}
        </p>
      )}
    </div>
  );
}

const EMPTY_SECTIONS: SectionTotals = { bills: 0, extras: 0, grocery: 0, weekend: 0, transport: 0 };

/** B-8: an inference is visually distinguished, never rendered as flat fact. */
function Narrative({ sentences }: { sentences: NarrativeSentence[] }) {
  if (sentences.length === 0) {
    return (
      <p className="text-xl sm:text-2xl leading-relaxed" style={{ color: "var(--text-primary)" }}>
        Nothing much stands out this period.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {sentences.map((s) => (
        <p
          key={s.id}
          className="text-xl sm:text-2xl leading-relaxed"
          style={{ color: s.provenance === "inference" ? "var(--text-secondary)" : "var(--text-primary)" }}
        >
          {s.text}
        </p>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const rows = await listPeriodSummaries();

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

  const insights = computeInsights(rows);
  const latest = insights.latest!;
  const [tagRows, weeks, sectionRows] = await Promise.all([
    tagBreakdownForPeriod(latest.periodId),
    weeklyTotalsForPeriod(latest.periodId),
    sectionTotalsForPeriod(latest.periodId),
  ]);
  const tagBreakdown = tagRows.slice(0, 10);
  const sections = sectionRows.reduce<SectionTotals>(
    (acc, r) => (r.section in acc ? { ...acc, [r.section]: r.total } : acc),
    { ...EMPTY_SECTIONS }
  );

  const narrative = buildNarrative({
    periodLabel: latest.label,
    income: latest.income,
    sections,
    weeks,
    tags: tagRows,
    insights,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* B-24: the first thing on screen is a plain sentence, never a total or a verdict. */}
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
        {latest.label}
      </p>
      <Narrative sentences={narrative} />

      <p className="text-sm mt-8 mb-10" style={{ color: "var(--text-muted)" }}>
        {insights.historyCount > 0
          ? `Compared against your average across ${insights.historyCount} earlier period${insights.historyCount === 1 ? "" : "s"}.`
          : "Add another period and Max can start comparing this one to your usual."}
      </p>

      <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
        The detail
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <StatTile
          label="Income"
          value={fmtGBP(insights.income.value)}
          deltaText={formatDelta(insights.income.delta, fmtGBP)}
          isGood={insights.income.delta !== null ? insights.income.delta >= 0 : null}
        />
        {insights.metrics.map((m: MetricInsight) => (
          <StatTile
            key={m.key}
            label={m.label}
            value={pct(m.value)}
            deltaText={formatDelta(m.delta, pct)}
            isGood={m.isGood}
          />
        ))}
      </div>

      <div className="rounded-lg border p-4 sm:p-6 mb-10 overflow-x-auto" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="font-medium mb-4">Spend by category, per pay period</h2>
        <Legend />
        <div className="min-w-[560px]">
          <StackedBarChart rows={rows} />
        </div>
      </div>

      <div className="rounded-lg border p-4 sm:p-6 overflow-x-auto" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="font-medium mb-4">Where {latest.label}&rsquo;s spend went, by tag</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Pulled straight from the free-text tags on each transaction — no fixed category list.
        </p>
        <table className="w-full text-sm min-w-[420px]">
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

      <div className="mt-8">
        <DeletePeriodButton periodId={latest.periodId} label={latest.label} />
      </div>
    </div>
  );
}
