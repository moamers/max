import React from "react";
import { View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import type { PeriodSummary, ThemeTokens } from "@max/shared";

function fmtGBP(n: number): string {
  return n >= 1000 ? `£${(n / 1000).toFixed(1)}k` : `£${Math.round(n)}`;
}

interface Props {
  periods: PeriodSummary[];
  theme: ThemeTokens;
}

/** Ported from the web dashboard's inline SVG chart (see git history), swapping
 * DOM <svg>/<title> for react-native-svg primitives — touch devices have no
 * hover, so per-segment tooltips are dropped in favor of the existing direct
 * total labels above each bar. */
export function StackedBarChart({ periods, theme }: Props) {
  const width = 340;
  const height = 260;
  const padding = { top: 20, right: 8, bottom: 44, left: 44 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const totals = periods.map((p) => p.totalFixed + p.totalVariable + p.totalWeekly);
  const maxTotal = Math.max(...totals, 1);
  const niceMax = Math.ceil(maxTotal / 1000) * 1000 || 1000;

  const barSlot = plotW / periods.length;
  const barWidth = Math.min(48, barSlot * 0.55);

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => (niceMax / gridSteps) * i);

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {gridValues.map((gv) => {
          const y = padding.top + plotH - (gv / niceMax) * plotH;
          return (
            <React.Fragment key={gv}>
              <Line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke={theme.gridline}
                strokeWidth={1}
              />
              <SvgText x={padding.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill={theme.textMuted}>
                {gv >= 1000 ? `£${(gv / 1000).toFixed(0)}k` : `£${gv}`}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + plotH}
          y2={padding.top + plotH}
          stroke={theme.baseline}
          strokeWidth={1}
        />

        {periods.map((p, i) => {
          const x = padding.left + i * barSlot + (barSlot - barWidth) / 2;
          const segments: { value: number; color: string }[] = [
            { value: p.totalFixed, color: theme.seriesBills },
            { value: p.totalVariable, color: theme.seriesExtras },
            { value: p.totalWeekly, color: theme.seriesWeekly },
          ];
          let cumulative = 0;
          const total = totals[i];

          return (
            <React.Fragment key={p.periodId}>
              {segments.map((seg, segIdx) => {
                const segH = (seg.value / niceMax) * plotH;
                const y = padding.top + plotH - (cumulative / niceMax) * plotH - segH;
                cumulative += seg.value;
                if (seg.value <= 0) return null;
                return (
                  <Rect
                    key={segIdx}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(segH - 1, 0)}
                    rx={2}
                    fill={seg.color}
                  />
                );
              })}
              <SvgText
                x={x + barWidth / 2}
                y={padding.top + plotH - (total / niceMax) * plotH - 6}
                textAnchor="middle"
                fontSize={9}
                fill={theme.textSecondary}
              >
                {fmtGBP(total)}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={padding.top + plotH + 14}
                textAnchor="middle"
                fontSize={8}
                fill={theme.textMuted}
              >
                {p.label.length > 10 ? p.label.slice(0, 9) + "…" : p.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
