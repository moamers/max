"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  CAPTURE_ACCEPT,
  CAPTURE_IMAGE_LIMITS,
  validateClientCaptureFile,
  type ClientFileProblem,
} from "@/lib/llm/image-types";
import type { TransactionExtractionDraft } from "@/lib/llm/capabilities/extract-transaction";

const REQUEST_TIMEOUT_MS = 30_000;
const FILE_ERROR = "Max can read PNG, JPEG, WebP, HEIC or HEIF images up to 10 MB.";
const NETWORK_ERROR = "The image didn't reach Max. Check your connection and try again — your form is still here.";
const RESPONSE_ERROR = "Max couldn't read that image just now. Try again, or type it by hand.";

type CaptureStage = "idle" | "uploading" | "reading" | "done" | "error";

export interface CaptureButtonProps {
  onDraft: (draft: TransactionExtractionDraft) => void;
}

export function captureErrorForClientProblem(problem: ClientFileProblem): string | null {
  return problem ? FILE_ERROR : null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isConfidence(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const shaped = value as Record<string, unknown>;
  return ["merchant", "amount", "date", "kind", "category"].every(
    (key) => typeof shaped[key] === "number" && Number.isFinite(shaped[key]) && shaped[key] >= 0 && shaped[key] <= 1
  );
}

export function isTransactionExtractionDraft(value: unknown): value is TransactionExtractionDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<TransactionExtractionDraft>;
  const validCategory =
    draft.category === null ||
    draft.category === "everyday" ||
    draft.category === "weekend" ||
    draft.category === "transport" ||
    draft.category === "housing" ||
    draft.category === "childcare" ||
    draft.category === "bills" ||
    draft.category === "subscriptions";
  return (
    isNullableString(draft.merchant) &&
    (draft.amount === null || (typeof draft.amount === "number" && Number.isFinite(draft.amount))) &&
    isNullableString(draft.occurredOn) &&
    (draft.kind === null || draft.kind === "weekly" || draft.kind === "recurring" || draft.kind === "one_off") &&
    validCategory &&
    isConfidence(draft.confidence) &&
    typeof draft.needsAttention === "boolean" &&
    isNullableString(draft.attentionReason) &&
    isNullableString(draft.rawImport)
  );
}

function responsePayload(xhr: XMLHttpRequest): { draft?: unknown; error?: unknown } {
  try {
    const parsed: unknown = JSON.parse(xhr.responseText);
    return parsed && typeof parsed === "object" ? (parsed as { draft?: unknown; error?: unknown }) : {};
  } catch {
    return {};
  }
}

export function CaptureButton({ onDraft }: CaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<XMLHttpRequest | null>(null);
  const [stage, setStage] = useState<CaptureStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const busy = stage === "uploading" || stage === "reading";

  useEffect(() => () => activeRequest.current?.abort(), []);

  function send(file: File) {
    const clientProblem = validateClientCaptureFile(file);
    if (clientProblem) {
      setStage("error");
      setMessage(captureErrorForClientProblem(clientProblem));
      setLastFile(null);
      return;
    }

    setLastFile(file);
    setMessage(null);
    setUploadProgress(0);
    setStage("uploading");

    const xhr = new XMLHttpRequest();
    activeRequest.current = xhr;
    xhr.open("POST", "/api/llm/extract-transaction");
    xhr.timeout = REQUEST_TIMEOUT_MS;
    xhr.responseType = "text";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.upload.onload = () => {
      setUploadProgress(100);
      setStage("reading");
    };
    xhr.onerror = () => {
      activeRequest.current = null;
      setStage("error");
      setMessage(NETWORK_ERROR);
    };
    xhr.ontimeout = () => {
      activeRequest.current = null;
      setStage("error");
      setMessage("Reading that image took longer than expected. Try again, or type it by hand.");
    };
    xhr.onload = () => {
      activeRequest.current = null;
      const payload = responsePayload(xhr);
      if (xhr.status >= 200 && xhr.status < 300 && isTransactionExtractionDraft(payload.draft)) {
        onDraft(payload.draft);
        setStage("done");
        setMessage("Read. Check the fields before saving.");
        return;
      }
      setStage("error");
      setMessage(typeof payload.error === "string" ? payload.error : RESPONSE_ERROR);
    };

    const body = new FormData();
    body.set("file", file);
    xhr.send(body);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy={busy}>
      <input
        ref={inputRef}
        type="file"
        accept={CAPTURE_ACCEPT}
        className="sr-only"
        aria-label="Choose a transaction image"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) send(file);
        }}
      />

      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        style={{ minHeight: 54 }}
      >
        {stage === "uploading"
          ? `Sending image${uploadProgress > 0 ? ` · ${uploadProgress}%` : "…"}`
          : stage === "reading"
            ? "Reading transaction…"
            : "Choose a transaction image"}
      </Button>

      {busy && (
        <div
          role="progressbar"
          aria-label={stage === "uploading" ? "Image upload" : "Reading transaction"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stage === "uploading" ? uploadProgress : undefined}
          style={{ height: 3, borderRadius: 99, overflow: "hidden", background: "var(--surface-inset)" }}
        >
          <div
            style={{
              height: "100%",
              width: stage === "uploading" ? `${uploadProgress}%` : "100%",
              background: "var(--lime-ink)",
              transition: "width 160ms ease",
            }}
          />
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)", textWrap: "pretty" }}>
        Max sends this image to OpenAI to read it. Nothing is saved until you check the form and tap Add it or Save.
      </p>
      <p style={{ margin: 0, fontSize: 11, color: "var(--text-tertiary)" }}>
        PNG, JPEG, WebP, HEIC or HEIF · up to {CAPTURE_IMAGE_LIMITS.maxBytes / 1024 / 1024} MB
      </p>

      {message && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p
            role={stage === "error" ? "alert" : "status"}
            style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: stage === "error" ? "var(--bar-over)" : "var(--text-secondary)" }}
          >
            {message}
          </p>
          {stage === "error" && lastFile && (
            <Button variant="secondary" height={54} onClick={() => send(lastFile)}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
