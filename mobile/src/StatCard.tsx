import { StyleSheet, Text, View } from "react-native";
import type { ThemeTokens } from "@max/shared";

interface Props {
  label: string;
  value: string;
  deltaText?: string;
  isGood?: boolean | null;
  theme: ThemeTokens;
}

export function StatCard({ label, value, deltaText, isGood, theme }: Props) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
      {deltaText ? (
        <Text
          style={[
            styles.delta,
            { color: isGood ? theme.goodText : theme.critical },
          ]}
        >
          {isGood ? "▲" : "▼"} {deltaText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 4,
  },
  delta: {
    fontSize: 12,
    marginTop: 4,
  },
});
