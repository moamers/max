import {
  listPeriodSummaries,
  weeklyTotalsForPeriod,
  sectionTotalsForPeriod,
  lineItemsForPeriod,
  type LineItemRow,
} from "@/lib/store";
import { computeInsights } from "@/lib/insights";
import { buildNarrative, type NarrativeSentence, type SectionTotals } from "@/lib/narrative";
import { describePeriod } from "@/lib/period-dates";
import { WhereItWent, type Bucket } from "./WhereItWent";
import { DeletePeriodButton } from "./DeletePeriodButton";
import type { PeriodSummary } from "@max/shared";

export const dynamic = "force-dynamic";

function fmtGBP(n: number): string {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
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

function Legend() {
  const items = [
    { label: "Bills", color: "var(--series-bills)" },
    { label: "One-off things", color: "var(--series-extras)" },
    { label: "Day-to-day", color: "var(--series-weekly)" },
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
  const [weeks, sectionRows, items] = await Promise.all([
    weeklyTotalsForPeriod(latest.periodId),
    sectionTotalsForPeriod(latest.periodId),
    lineItemsForPeriod(latest.periodId),
  ]);

  const sections = sectionRows.reduce<SectionTotals>(
    (acc, r) => (r.section in acc ? { ...acc, [r.section]: r.total } : acc),
    { ...EMPTY_SECTIONS }
  );

  const tagTotals = new Map<string, { total: number; count: number; section: string }>();
  for (const i of items) {
    if (!i.tag) continue;
    const cur = tagTotals.get(i.tag) ?? { total: 0, count: 0, section: i.section };
    tagTotals.set(i.tag, { total: cur.total + i.amount, count: cur.count + 1, section: cur.section });
  }
  const tags = [...tagTotals.entries()].map(([tag, v]) => ({ tag, ...v }));

  const narrative = buildNarrative({
    periodLabel: latest.label,
    income: latest.income,
    sections,
    weeks,
    tags,
    insights,
  });

  // The label carries no year ("Jun 30th - Aug 3rd"), so the year is inferred from
  // when the row was recorded — which lives on the summary row, not the metrics.
  const latestRow = rows.find((r) => r.periodId === latest.periodId);
  const created = latestRow ? new Date(latestRow.createdAt) : new Date();
  const described = describePeriod(latest.label, created, weeks.length);

  const dayToDay = sections.grocery + sections.weekend + sections.transport;
  const totalOut = dayToDay + sections.extras + sections.bills;
  // When outgoings dwarf recorded income, income is probably partial — so any
  // percentage-of-income figure would be confidently wrong. Show amounts instead.
  const incomeQuestionable = latest.income > 0 && totalOut > latest.income * 1.5;

  const bySection = (s: string) => items.filter((i) => i.section === s);
  const weeklyItems: LineItemRow[] = items.filter((i) =>
    ["grocery", "weekend", "transport"].includes(i.section)
  );

  const buckets: Bucket[] = [
    {
      key: "day-to-day",
      label: "Day-to-day living",
      amount: dayToDay,
      meaning:
        "Your ordinary running costs — the weekly shop, getting around, and weekends. This is the part that repeats.",
      origin: `Added up from the ${weeks.length} weekly ${weeks.length === 1 ? "tab" : "tabs"} in your spreadsheet.`,
      breakdown: weeks.map((w) => ({ label: `Week ${w.weekNumber}`, amount: w.total })),
      items: weeklyItems,
    },
    {
      key: "one-off",
      label: "One-off things",
      amount: sections.extras,
      meaning:
        "Things that aren't part of your normal week and aren't regular bills — trips, gifts, shopping, home stuff.",
      origin: `${bySection("extras").length} rows from the summary tab of your spreadsheet.`,
      items: bySection("extras"),
    },
    {
      key: "bills",
      label: "Bills",
      amount: sections.bills,
      meaning: "The regular, mostly-fixed costs that arrive whether you think about them or not.",
      origin: `${bySection("bills").length} rows from the summary tab of your spreadsheet.`,
      items: bySection("bills"),
    },
  ];

  const incomeParts = latestRow?.incomeComponents ?? [];
  const incomeBucket: Bucket = {
    key: "income",
    label: "Money in",
    amount: latest.income,
    meaning: "What your spreadsheet records as coming in during this period.",
    origin:
      incomeParts.length > 0
        ? `Added up from ${incomeParts.length} labelled ${incomeParts.length === 1 ? "row" : "rows"} on the summary panel of your spreadsheet.`
        : "Read from the summary panel of your spreadsheet.",
    breakdown: incomeParts.map((c) => ({ label: c.label, amount: c.amount })),
    caveat: incomeQuestionable
      ? "This is noticeably less than what went out, which usually means it's only part of the picture — a second income, savings, or a transfer that isn't in the sheet. Until that's settled, Max is showing you amounts rather than percentages, because a percentage of the wrong number is worse than no percentage."
      : undefined,
    items: [],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* B-24: opens with what you're looking at, never a total or a verdict. */}
      <header className="mb-8">
        <h1 className="text-lg font-semibold">{described ? described.range : latest.label}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {described ? `${described.length}` : "One pay period"}
          {" · from your “"}
          {latest.label}
          {"” sheet"}
        </p>
      </header>

      <Narrative sentences={narrative} />

      <p className="text-sm mt-8 mb-10" style={{ color: "var(--text-muted)" }}>
        {insights.historyCount > 0
          ? `Compared against your average across ${insights.historyCount} earlier period${insights.historyCount === 1 ? "" : "s"}.`
          : "Add another period and Max can start comparing this one to your usual."}
      </p>

      <WhereItWent buckets={buckets} title="Where it went" />
      <WhereItWent buckets={[incomeBucket]} title="What came in" />

      {rows.length > 1 && (
        <div
          className="rounded-lg border p-4 sm:p-6 mb-10 overflow-x-auto"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
            Across your periods
          </h2>
          <Legend />
          <div className="min-w-[560px]">
            <StackedBarChart rows={rows} />
          </div>
        </div>
      )}

      <div className="mt-8">
        <DeletePeriodButton periodId={latest.periodId} label={latest.label} />
      </div>
    </div>
  );
}
