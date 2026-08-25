import type { YearMonth } from "@/lib/queries/year";

export interface ChartPoint {
  monthIndex: number;
  value: number;
  x: number;
  y: number;
}

export interface CumulativeChart {
  width: number;
  height: number;
  zeroY: number;
  points: ChartPoint[];
  polyline: string;
}

/** A proportional line-chart scale with a visible zero and padded extremes. */
export function buildCumulativeChart(
  months: YearMonth[],
  width = 320,
  height = 90
): CumulativeChart {
  const known = months.filter(
    (month): month is YearMonth & { cumulativePosition: number } =>
      month.cumulativePosition !== null
  );
  if (known.length === 0) {
    return { width, height, zeroY: height / 2, points: [], polyline: "" };
  }

  const values = known.map((month) => month.cumulativePosition);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = Math.max(1, max - min);
  const top = 6;
  const bottom = height - 6;
  const plotHeight = bottom - top;
  const toY = (value: number) => top + ((max - value) / range) * plotHeight;
  const points = known.map((month, index) => ({
    monthIndex: month.monthIndex,
    value: month.cumulativePosition,
    x: known.length === 1 ? width / 2 : (index / (known.length - 1)) * width,
    y: toY(month.cumulativePosition),
  }));

  return {
    width,
    height,
    zeroY: toY(0),
    points,
    polyline: points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "),
  };
}
