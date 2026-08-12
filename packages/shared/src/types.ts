/** Shapes returned by the Max API — kept in sync with src/app/api/** route handlers. */

export interface PeriodSummary {
  periodId: number;
  label: string;
  createdAt: string;
  totalFixed: number;
  totalVariable: number;
  totalWeekly: number;
  income: number;
  finalPosition: number;
}

export interface PeriodsResponse {
  periods: PeriodSummary[];
}

export interface TagBreakdown {
  tag: string;
  section: string;
  total: number;
  count: number;
}

export interface TagsResponse {
  tags: TagBreakdown[];
}

export type MetricKey = "fixedPct" | "variablePct" | "weeklyPct" | "netPct";

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

export interface UploadSavedPeriod {
  label: string;
  periodId: number;
  lineItemCount: number;
  budgetCount: number;
  income: number | null;
}

export interface UploadResponse {
  saved: UploadSavedPeriod[];
  sheetNames: string[];
}

export interface UploadErrorResponse {
  error: string;
  sheetNames?: string[];
}
