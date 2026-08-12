import { PeriodSummaryRow } from "./store";

export type MetricKey = "fixedPct" | "variablePct" | "weeklyPct" | "netPct";

interface MetricDef {
  key: MetricKey;
  label: string;
  goodDirection: "up" | "down";
}

const METRIC_DEFS: MetricDef[] = [
  { key: "fixedPct", label: "Fixed spend", goodDirection: "down" },
  { key: "variablePct", label: "Variable/extras spend", goodDirection: "down" },
  { key: "weeklyPct", label: "Weekly spend", goodDirection: "down" },
  { key: "netPct", label: "Net position", goodDirection: "up" },
];

export interface PeriodMetrics {
  periodId: number;
  label: string;
  income: number;
  totalFixed: number;
  totalVariable: number;
  totalWeekly: number;
  finalPosition: number;
  fixedPct: number;
  variablePct: number;
  weeklyPct: number;
  netPct: number;
}

export interface MetricInsight {
  key: MetricKey;
  label: string;
  goodDirection: "up" | "down";
  value: number;
  average: number | null;
  delta: number | null;
  isGood: boolean | null;
}

export interface InsightsResponse {
  latest: PeriodMetrics | null;
  historyCount: number;
  income: { value: number; average: number | null; delta: number | null };
  metrics: MetricInsight[];
}

function withPercentages(row: PeriodSummaryRow): PeriodMetrics {
  const income = row.income || 0;
  return {
    periodId: row.periodId,
    label: row.label,
    income,
    totalFixed: row.totalFixed,
    totalVariable: row.totalVariable,
    totalWeekly: row.totalWeekly,
    finalPosition: row.finalPosition,
    fixedPct: income ? row.totalFixed / income : 0,
    variablePct: income ? row.totalVariable / income : 0,
    weeklyPct: income ? row.totalWeekly / income : 0,
    netPct: income ? row.finalPosition / income : 0,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Self-benchmark: compares the most recent period against the average of every prior period. */
export function computeInsights(rows: PeriodSummaryRow[]): InsightsResponse {
  if (rows.length === 0) {
    return { latest: null, historyCount: 0, income: { value: 0, average: null, delta: null }, metrics: [] };
  }

  const withPct = rows.map(withPercentages);
  const latest = withPct[withPct.length - 1];
  const history = withPct.slice(0, -1);

  const incomeAvg = average(history.map((h) => h.income));

  const metrics: MetricInsight[] = METRIC_DEFS.map((def) => {
    const avg = average(history.map((h) => h[def.key]));
    const delta = avg !== null ? latest[def.key] - avg : null;
    const isGood = delta === null ? null : def.goodDirection === "up" ? delta > 0 : delta < 0;
    return { key: def.key, label: def.label, goodDirection: def.goodDirection, value: latest[def.key], average: avg, delta, isGood };
  });

  return {
    latest,
    historyCount: history.length,
    income: {
      value: latest.income,
      average: incomeAvg,
      delta: incomeAvg !== null ? latest.income - incomeAvg : null,
    },
    metrics,
  };
}
