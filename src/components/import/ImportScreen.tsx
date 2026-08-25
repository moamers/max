"use client";

import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Chip, Pill } from "@/components/ui/Chip";
import { MaxMark } from "@/components/home/MaxMark";
import { formatGBP } from "@/components/home/format";
import { AttentionCard } from "./AttentionCard";
import type { ImportDateProposal, ImportPreview, UploadResult } from "./types";

type Phase = "invite" | "reading" | "dates" | "saving" | "result";

interface UploadResponse {
  preview?: ImportPreview;
  attention?: UploadResult["attention"];
  error?: string;
}

function postFile(
  file: File,
  mode: "preview" | "save",
  dates: ImportDateProposal[],
  onProgress: (value: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.max(4, Math.round((event.loaded / event.total) * 88)));
    };
    xhr.onload = () => {
      const response = (xhr.response ?? {}) as UploadResponse;
      if (xhr.status >= 200 && xhr.status < 300) resolve(response);
      else reject(new Error(response.error ?? "Couldn't read this file. Try another one."));
    };
    xhr.onerror = () => reject(new Error("Couldn't reach Max. Try again."));
    const body = new FormData();
    body.set("file", file);
    body.set("mode", mode);
    if (mode === "save") body.set("periodDates", JSON.stringify(dates));
    xhr.send(body);
  });
}

function UploadGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function ReadingRows({ preview }: { preview: ImportPreview | null }) {
  const rows = preview
    ? [
        `${preview.sheetCount} sheets found`,
        `${preview.lineItemCount.toLocaleString("en-GB")} spending lines read`,
        `${preview.periodCount} ${preview.periodCount === 1 ? "period" : "periods"} found`,
        `${preview.labels.length} labels kept`,
        "Income kept with its source",
        preview.attentionCount === 0 ? "Everything placed" : `${preview.attentionCount} I placed by guessing`,
      ]
    : ["Opening the workbook", "Reading the sheets", "Keeping your labels", "Checking the totals"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {rows.map((row, index) => (
        <div key={row} style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeUp var(--duration-fade) ease both" }}>
          <span style={{ color: preview && index === rows.length - 1 && preview.attentionCount > 0 ? "var(--attention-ink)" : "var(--lime-ink)" }}>
            {preview && index === rows.length - 1 && preview.attentionCount > 0 ? "?" : "✓"}
          </span>
          <span style={{ fontSize: 14 }}>{row}</span>
        </div>
      ))}
    </div>
  );
}

export function ImportScreen() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("invite");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [dates, setDates] = useState<ImportDateProposal[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function inspect(selected: File) {
    setFile(selected);
    setPhase("reading");
    setProgress(2);
    setError(null);
    try {
      const response = await postFile(selected, "preview", [], setProgress);
      if (!response.preview) throw new Error("Max couldn't describe this file.");
      setPreview(response.preview);
      setDates(response.preview.dates);
      setProgress(100);
      setPhase("dates");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't read this file.");
      setPhase("invite");
    }
  }

  async function save() {
    if (!file || !preview) return;
    setPhase("saving");
    setProgress(2);
    setError(null);
    try {
      const response = await postFile(file, "save", dates, setProgress);
      if (!response.preview || !response.attention) throw new Error("Max couldn't finish this import.");
      setProgress(100);
      setResult({ preview: response.preview, attention: response.attention });
      setPhase("result");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't finish this import.");
      setPhase("dates");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const selected = event.dataTransfer.files[0];
    if (selected) void inspect(selected);
  }

  const frame = { maxWidth: 480, minHeight: "100dvh", margin: "0 auto", padding: "28px 26px 30px", display: "flex", flexDirection: "column" as const };

  if (phase === "invite") {
    return (
      <main style={frame}>
        <MaxMark size={34} />
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.06, letterSpacing: "-0.035em", fontWeight: 800 }}>Send me<br />the spreadsheet.</h1>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.55 }}>Sheets, screenshots, statements — I&apos;ll do the tidying.</p>
        </div>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          onPaste={(event) => {
            const selected = event.clipboardData.files[0];
            if (selected) void inspect(selected);
          }}
          style={{ flex: 1, minHeight: 300, margin: "28px 0", border: "1px dashed var(--hairline-4)", borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--text-secondary)" }}
        >
          <UploadGlyph />
          <span style={{ fontSize: 15, fontWeight: 600 }}>drop a file, or paste</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
            {['spreadsheet', 'screenshot', 'statement', 'pdf'].map((label) => <Chip key={label} tabIndex={-1}>{label}</Chip>)}
          </div>
        </div>
        {error && <p role="alert" style={{ color: "var(--bar-over)", fontSize: 13 }}>{error}</p>}
        <input ref={inputRef} type="file" accept=".xlsx" hidden onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void inspect(selected); }} />
        <Button onClick={() => inputRef.current?.click()}>Choose a file</Button>
        <Link href="/" style={{ marginTop: 14, textAlign: "center", fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)", textDecoration: "none" }}>skip — start from scratch</Link>
      </main>
    );
  }

  if (phase === "reading" || phase === "saving") {
    return (
      <main style={frame}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--lime-ink)" }}>{phase === "reading" ? "Reading" : "Bringing it in"}</span>
        <h1 style={{ margin: "12px 0 8px", fontSize: 28, letterSpacing: "-0.035em", fontWeight: 800, overflowWrap: "anywhere" }}>{file?.name}</h1>
        <p style={{ margin: "0 0 30px", color: "var(--text-secondary)", fontSize: 14 }}>{preview ? `${preview.sheetCount} sheets · ${preview.rowCount.toLocaleString("en-GB")} rows · ${preview.periodCount} periods` : "Reading what is actually in the file."}</p>
        <ReadingRows preview={preview} />
        <div style={{ marginTop: "auto", paddingTop: 32 }}>
          <div style={{ height: 4, borderRadius: 99, background: "var(--surface-inset)", overflow: "hidden" }}><div style={{ height: "100%", width: `${progress}%`, background: "var(--lime-fill)", transition: "width .15s linear" }} /></div>
          <span style={{ display: "block", marginTop: 8, textAlign: "right", fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>{progress}%</span>
        </div>
      </main>
    );
  }

  if (phase === "dates" && preview) {
    return (
      <main style={frame}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--lime-ink)" }}>One check</span>
        <h1 style={{ margin: "12px 0", fontSize: 28, letterSpacing: "-0.035em", fontWeight: 800 }}>I found these period dates.</h1>
        <p style={{ margin: "0 0 24px", fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)" }}>The spreadsheet doesn&apos;t carry a year I can trust, so I&apos;ve filled in my best guess. Change it here if it&apos;s not right.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dates.map((date, index) => (
            <div key={date.sheetOrder} style={{ padding: 16, border: "1px solid var(--hairline-3)", borderRadius: "var(--radius-row)", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{date.label}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 5, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>START<input aria-label={`${date.label} start`} type="date" value={date.startDate} onChange={(event) => setDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: event.target.value } : item))} style={{ minWidth: 0, padding: 10, borderRadius: 10, border: "1px solid var(--hairline-4)", background: "var(--surface-inset)", color: "var(--text-primary)" }} /></label>
                <label style={{ display: "flex", flexDirection: "column", gap: 5, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: "var(--text-tertiary)" }}>END<input aria-label={`${date.label} end`} type="date" value={date.endDate} onChange={(event) => setDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: event.target.value } : item))} style={{ minWidth: 0, padding: 10, borderRadius: 10, border: "1px solid var(--hairline-4)", background: "var(--surface-inset)", color: "var(--text-primary)" }} /></label>
              </div>
            </div>
          ))}
        </div>
        {error && <p role="alert" style={{ color: "var(--bar-over)", fontSize: 13 }}>{error}</p>}
        <div style={{ marginTop: "auto", paddingTop: 24 }}><Button onClick={() => void save()}>Use these dates</Button></div>
      </main>
    );
  }

  if (!result) return null;
  const { preview: done, attention } = result;
  const showInline = attention.length > 0 && attention.length <= 5;
  const stats = [["Income", done.income], ["Recurring", done.recurring], ["Your week", done.weekly], ["Labels kept", done.labels.length]] as const;

  return (
    <main style={frame}>
      <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--lime-ink)" }}>Done</span>
      <h1 style={{ margin: "12px 0 24px", fontSize: 32, lineHeight: 1.06, letterSpacing: "-0.035em", fontWeight: 800 }}>{done.lineItemCount.toLocaleString("en-GB")} lines. Nothing thrown away.</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stats.map(([label, value]) => <div key={label} style={{ background: "var(--surface)", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase" }}>{label}</span><strong style={{ fontSize: 20 }}>{label === "Labels kept" ? value : formatGBP(value)}</strong></div>)}
      </div>
      {done.labels.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}><span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Your words, not mine</span><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{done.labels.slice(0, 8).map((label) => <Pill key={label} tone="cyan">{label}</Pill>)}{done.labels.length > 8 && <Pill tone="cyan">+ {done.labels.length - 8} names</Pill>}</div></div>}
      {showInline && <div style={{ border: "1px solid var(--hairline-4)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}><span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--attention-ink)" }}>{attention.length} I placed by guessing</span>{attention.map((row) => <AttentionCard key={row.id} row={row} />)}<span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>everything else I filed myself — correct me later if I got one wrong</span></div>}
      {attention.length >= 6 && <p style={{ margin: "20px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>{attention.length} I placed by guessing. <Link href="/review" style={{ color: "var(--text-secondary)" }}>Review them</Link></p>}
      <Link href="/" style={{ marginTop: "auto", paddingTop: 24, textDecoration: "none" }}><span style={{ height: 56, borderRadius: 99, background: "var(--lime-fill)", color: "var(--lime-ink-on-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>Continue</span></Link>
    </main>
  );
}
