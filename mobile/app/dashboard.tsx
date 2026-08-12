import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchInsights, fetchPeriods, fetchTagBreakdown } from "../src/api";
import { useAppTheme } from "../src/theme";
import { StatCard } from "../src/StatCard";
import { StackedBarChart } from "../src/StackedBarChart";
import type { InsightsResponse, PeriodSummary, TagBreakdown } from "@max/shared";

function fmtGBP(n: number): string {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** Only worth showing a "vs average" line when the delta is more than noise. */
function formatDelta(delta: number | null, format: (n: number) => string): string | undefined {
  if (delta === null || Math.abs(delta) <= 0.005) return undefined;
  return `${format(Math.abs(delta))} vs average`;
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [tags, setTags] = useState<TagBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [periodsRes, insightsRes] = await Promise.all([fetchPeriods(), fetchInsights()]);
      setPeriods(periodsRes.periods);
      setInsights(insightsRes);
      if (insightsRes.latest) {
        const tagsRes = await fetchTagBreakdown(insightsRes.latest.periodId);
        setTags(tagsRes.tags);
      } else {
        setTags([]);
      }
      setError(null);
    } catch {
      setError("Couldn't reach the API — check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.page }]}>
        <ActivityIndicator color={theme.seriesBills} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.page }]}>
        <Text style={{ color: theme.critical, textAlign: "center", paddingHorizontal: 24 }}>{error}</Text>
      </View>
    );
  }

  if (!insights?.latest) {
    return (
      <View style={[styles.center, { backgroundColor: theme.page }]}>
        <Text style={{ color: theme.textSecondary, textAlign: "center", paddingHorizontal: 24 }}>
          No data yet — upload a workbook from the Upload tab.
        </Text>
      </View>
    );
  }

  const { latest } = insights;

  return (
    <ScrollView
      style={{ backgroundColor: theme.page }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={theme.seriesBills}
        />
      }
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>{latest.label}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {insights.historyCount > 0
          ? `Compared against your average across ${insights.historyCount} prior period${insights.historyCount === 1 ? "" : "s"}.`
          : "Upload more periods to unlock the self-benchmark comparison."}
      </Text>

      <View style={styles.statGrid}>
        <StatCard
          label="Income"
          value={fmtGBP(insights.income.value)}
          deltaText={formatDelta(insights.income.delta, fmtGBP)}
          isGood={insights.income.delta !== null ? insights.income.delta >= 0 : null}
          theme={theme}
        />
        {insights.metrics.map((m) => (
          <StatCard
            key={m.key}
            label={m.label}
            value={pct(m.value)}
            deltaText={formatDelta(m.delta, pct)}
            isGood={m.isGood}
            theme={theme}
          />
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Spend by category, per pay period</Text>
        <View style={styles.legendRow}>
          <LegendDot color={theme.seriesBills} label="Fixed" theme={theme} />
          <LegendDot color={theme.seriesExtras} label="Variable" theme={theme} />
          <LegendDot color={theme.seriesWeekly} label="Weekly" theme={theme} />
        </View>
        <StackedBarChart periods={periods} theme={theme} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Where this period's spend went, by tag</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 10 }}>
          Pulled straight from the free-text tags on each transaction — no fixed category list.
        </Text>
        {tags.map((t) => (
          <View key={`${t.tag}-${t.section}`} style={[styles.tagRow, { borderColor: theme.gridline }]}>
            <View>
              <Text style={{ color: theme.textPrimary }}>{t.tag}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                {t.section} · {t.count} transaction{t.count === 1 ? "" : "s"}
              </Text>
            </View>
            <Text style={{ color: theme.textPrimary, fontWeight: "600" }}>{fmtGBP(t.total)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function LegendDot({ color, label, theme }: { color: string; label: string; theme: { textSecondary: string } }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  section: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  legendRow: { flexDirection: "row", gap: 12, marginBottom: 8, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 2 },
  tagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
