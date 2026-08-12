import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { ApiError, uploadWorkbook } from "../src/api";
import { useAppTheme } from "../src/theme";
import type { UploadResponse } from "@max/shared";

type Status = "idle" | "picking" | "uploading" | "done" | "error";

export default function UploadScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePick() {
    setStatus("picking");
    setErrorMessage(null);
    setResult(null);

    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
      ],
      copyToCacheDirectory: true,
    });

    if (picked.canceled || picked.assets.length === 0) {
      setStatus("idle");
      return;
    }

    const asset = picked.assets[0];
    setStatus("uploading");

    try {
      const data = await uploadWorkbook({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
      setResult(data);
      setStatus("done");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Upload failed — check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <ScrollView style={{ backgroundColor: theme.page }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Upload your budget workbook</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Export your pay-period sheets as a single .xlsx workbook and pick it below.
      </Text>

      <Pressable
        onPress={handlePick}
        disabled={status === "uploading"}
        style={[styles.pickButton, { borderColor: theme.baseline }]}
      >
        <Text style={{ color: theme.textPrimary, fontWeight: "600" }}>Choose a .xlsx file</Text>
      </Pressable>

      {status === "uploading" && (
        <View style={styles.centerRow}>
          <ActivityIndicator color={theme.seriesBills} />
          <Text style={{ color: theme.textSecondary, marginLeft: 8 }}>Parsing workbook…</Text>
        </View>
      )}

      {status === "error" && errorMessage && (
        <View style={[styles.banner, { borderColor: theme.critical }]}>
          <Text style={{ color: theme.critical, fontWeight: "600" }}>{errorMessage}</Text>
        </View>
      )}

      {status === "done" && result && (
        <View style={[styles.banner, { borderColor: theme.good }]}>
          <Text style={{ color: theme.goodText, fontWeight: "600", marginBottom: 8 }}>
            Parsed {result.saved.length} pay period{result.saved.length === 1 ? "" : "s"}
          </Text>
          {result.saved.map((p) => (
            <Text key={p.label} style={{ color: theme.textSecondary, fontSize: 13 }}>
              {p.label} — {p.lineItemCount} line items, {p.budgetCount} budgets
              {p.income ? `, income £${p.income.toFixed(2)}` : ""}
            </Text>
          ))}
          <Pressable
            onPress={() => router.push("/dashboard")}
            style={[styles.pickButton, { borderColor: theme.seriesBills, marginTop: 12 }]}
          >
            <Text style={{ color: theme.seriesBills, fontWeight: "600" }}>View dashboard →</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  pickButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  banner: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
});
