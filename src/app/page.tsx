"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadResult {
  saved: { label: string; lineItemCount: number; budgetCount: number; income: number | null }[];
  sheetNames: string[];
}

interface UploadError {
  error: string;
  sheetNames?: string[];
}

export default function UploadPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<UploadError | null>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data as UploadError);
        setStatus("error");
        return;
      }
      setResult(data as UploadResult);
      setStatus("done");
    } catch {
      setError({ error: "Upload failed — check the app is running and try again." });
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Upload your budget workbook</h1>
      <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
        Export your pay-period sheets (one tab per period, following your usual template) as a
        single .xlsx workbook and drop it here. Max will parse each period and build your
        dashboard.
      </p>

      <label
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-16 cursor-pointer transition-colors"
        style={{ borderColor: "var(--baseline)" }}
      >
        <span className="font-medium">Choose a .xlsx file</span>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          or drag it in
        </span>
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>

      {status === "uploading" && (
        <p className="mt-6" style={{ color: "var(--text-secondary)" }}>
          Parsing workbook…
        </p>
      )}

      {status === "error" && error && (
        <div
          className="mt-6 rounded-lg p-4 border"
          style={{ borderColor: "var(--critical)", color: "var(--critical)" }}
        >
          <p className="font-medium">{error.error}</p>
          {error.sheetNames && (
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Sheets found in file: {error.sheetNames.join(", ")}
            </p>
          )}
        </div>
      )}

      {status === "done" && result && (
        <div
          className="mt-6 rounded-lg p-4 border"
          style={{ borderColor: "var(--good)" }}
        >
          <p className="font-medium mb-3" style={{ color: "var(--good-text)" }}>
            Parsed {result.saved.length} pay period{result.saved.length === 1 ? "" : "s"}
          </p>
          <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            {result.saved.map((p) => (
              <li key={p.label}>
                {p.label} — {p.lineItemCount} line items, {p.budgetCount} budgets
                {p.income ? `, income £${p.income.toFixed(2)}` : ""}
              </li>
            ))}
          </ul>
          <button
            className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--series-bills)" }}
            onClick={() => router.push("/dashboard")}
          >
            View dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
