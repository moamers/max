import "server-only";

import { createHash } from "node:crypto";
import type { UserId } from "@/lib/auth";
import {
  isRecurringCategory,
  isTransactionKind,
  isWeeklyCategory,
  type TransactionCategory,
  type TransactionKind,
} from "@/lib/transactions";
import { LLM_LIMITS } from "../config";
import { LlmCapabilityError } from "../errors";
import { createLlmProvider } from "../index";
import type { LlmProvider, LlmUsage } from "../provider";

const CAPABILITY = "extract_transaction";
const CONFIDENCE_THRESHOLD = 0.75;
const MAX_AMOUNT = 99_999;

/** T-2: read visible text only; never ask the model to calculate a total. */
export const EXTRACT_TRANSACTION_PROMPT = `You read one transaction from an image for Max.
Return only the requested JSON shape.

Rules:
- Decide whether the image contains one identifiable financial transaction. If it does not, set foundTransaction to false and every field value to null.
- Transcribe the merchant exactly as it appears. Do not title-case, correct, expand, shorten, or normalise it.
- amountText is one amount printed as the transaction amount or total. Copy that amount text exactly. Never add line items, calculate a total, convert currency, apply a tip, or infer a missing amount.
- dateText is the complete visible date copied exactly. Do not invent a year or a missing part.
- kind and category are suggestions about structure, not facts. Use only the enum values in the schema. If uncertain, return null.
- sourceText is a short verbatim transcription of the transaction evidence visible in the image. Do not add explanation or prompt text.
- Missing is null. A plausible guess is not a substitute for visible evidence.
- Confidence is from 0 to 1 for each field.`;

export const EXTRACT_TRANSACTION_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    foundTransaction: { type: "boolean" },
    sourceText: { type: ["string", "null"] },
    merchant: { $ref: "#/$defs/textField" },
    amount: { $ref: "#/$defs/textField" },
    date: { $ref: "#/$defs/textField" },
    kind: { $ref: "#/$defs/kindField" },
    category: { $ref: "#/$defs/categoryField" },
  },
  required: ["foundTransaction", "sourceText", "merchant", "amount", "date", "kind", "category"],
  $defs: {
    textField: {
      type: "object",
      additionalProperties: false,
      properties: {
        value: { type: ["string", "null"] },
        confidence: { type: "number" },
      },
      required: ["value", "confidence"],
    },
    kindField: {
      type: "object",
      additionalProperties: false,
      properties: {
        value: { type: ["string", "null"], enum: ["weekly", "recurring", "one_off", null] },
        confidence: { type: "number" },
      },
      required: ["value", "confidence"],
    },
    categoryField: {
      type: "object",
      additionalProperties: false,
      properties: {
        value: {
          type: ["string", "null"],
          enum: ["everyday", "weekend", "transport", "housing", "childcare", "bills", "subscriptions", null],
        },
        confidence: { type: "number" },
      },
      required: ["value", "confidence"],
    },
  },
};

export interface FieldConfidence {
  merchant: number;
  amount: number;
  date: number;
  kind: number;
  category: number;
}

export interface TransactionExtractionDraft {
  merchant: string | null;
  amount: number | null;
  occurredOn: string | null;
  kind: TransactionKind | null;
  category: TransactionCategory | null;
  confidence: FieldConfidence;
  needsAttention: boolean;
  attentionReason: string | null;
  rawImport: string | null;
}

export type TransactionExtractionResult =
  | { status: "draft"; draft: TransactionExtractionDraft; usage: LlmUsage }
  | { status: "no_transaction"; usage: LlmUsage };

type ValidatedExtraction =
  | { status: "draft"; draft: TransactionExtractionDraft }
  | { status: "no_transaction" };

interface RawField {
  value: string | null;
  confidence: number;
}

interface RawExtraction {
  foundTransaction: boolean;
  sourceText: string | null;
  merchant: RawField;
  amount: RawField;
  date: RawField;
  kind: RawField;
  category: RawField;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function confidence(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new LlmCapabilityError("malformed");
  return Math.min(1, Math.max(0, value));
}

function rawField(value: unknown, maxLength: number): RawField {
  const field = record(value);
  if (!field || !(field.value === null || typeof field.value === "string")) {
    throw new LlmCapabilityError("malformed");
  }
  if (typeof field.value === "string" && field.value.length > maxLength) {
    throw new LlmCapabilityError("malformed");
  }
  return { value: field.value, confidence: confidence(field.confidence) };
}

function promptEcho(value: string): boolean {
  const lower = value.toLocaleLowerCase("en-GB");
  return (
    lower.includes("you read one transaction") ||
    lower.includes("return only the requested json") ||
    lower.includes("amounttext is one amount")
  );
}

export function parseRawExtraction(value: unknown): RawExtraction {
  const parsed = record(value);
  if (!parsed || typeof parsed.foundTransaction !== "boolean") throw new LlmCapabilityError("malformed");
  if (!(parsed.sourceText === null || typeof parsed.sourceText === "string")) {
    throw new LlmCapabilityError("malformed");
  }
  if (typeof parsed.sourceText === "string" && parsed.sourceText.length > 2_000) {
    throw new LlmCapabilityError("malformed");
  }
  const result: RawExtraction = {
    foundTransaction: parsed.foundTransaction,
    sourceText: parsed.sourceText,
    merchant: rawField(parsed.merchant, 240),
    amount: rawField(parsed.amount, 80),
    date: rawField(parsed.date, 80),
    kind: rawField(parsed.kind, 40),
    category: rawField(parsed.category, 40),
  };
  if (
    (result.sourceText && promptEcho(result.sourceText)) ||
    (result.merchant.value && promptEcho(result.merchant.value))
  ) {
    throw new LlmCapabilityError("malformed");
  }
  // B-8/T-3: a financial figure without source text is not a usable draft.
  if (result.foundTransaction && !result.sourceText) throw new LlmCapabilityError("malformed");
  return result;
}

/** One printed amount only. Operators or multiple figures are rejected, never summed. */
export function parseVisibleAmount(value: string | null): number | null {
  if (value === null) return null;
  const match = value.match(/^\s*[-−]?\s*(?:(?:£|GBP)\s*)?(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?\s*$/i);
  if (!match) return null;
  const pounds = match[1].replaceAll(",", "");
  const pence = (match[2] ?? "").padEnd(2, "0");
  const amount = Number(`${pounds}.${pence || "00"}`);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return null;
  return Math.round(amount * 100) / 100;
}

const MONTHS: Readonly<Record<string, number>> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function isoDate(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** A date must include a visible year; Max does not invent one from today. */
export function parseVisibleDate(value: string | null): string | null {
  if (value === null) return null;
  let match = value.match(/^\s*(\d{4})[-/]([01]?\d)[-/]([0-3]?\d)\s*$/);
  if (match) return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  match = value.match(/^\s*([0-3]?\d)[-/]([01]?\d)[-/](\d{4})\s*$/);
  if (match) return isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
  match = value.match(/^\s*([0-3]?\d)(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})\s*$/i);
  if (match) {
    const month = MONTHS[match[2].toLocaleLowerCase("en-GB")];
    return month ? isoDate(Number(match[3]), month, Number(match[1])) : null;
  }
  return null;
}

function validKind(value: string | null): TransactionKind | null {
  return isTransactionKind(value) ? value : null;
}

function validCategory(kind: TransactionKind | null, value: string | null): TransactionCategory | null {
  if (kind === "weekly" && isWeeklyCategory(value)) return value;
  if (kind === "recurring" && isRecurringCategory(value)) return value;
  return null;
}

export function validateExtraction(value: unknown): ValidatedExtraction {
  const raw = parseRawExtraction(value);
  if (!raw.foundTransaction) return { status: "no_transaction" };

  const reasons: string[] = [];
  const merchant = raw.merchant.value === "" ? null : raw.merchant.value;
  if (!merchant) reasons.push("Max could not read the merchant name.");
  else if (raw.merchant.confidence < CONFIDENCE_THRESHOLD) reasons.push("Max was not sure about the merchant name.");

  const amount = parseVisibleAmount(raw.amount.value);
  if (amount === null) reasons.push("Max could not read one transaction amount.");
  else if (raw.amount.confidence < CONFIDENCE_THRESHOLD) reasons.push("Max was not sure about the amount.");

  const occurredOn = parseVisibleDate(raw.date.value);
  if (raw.date.value !== null && occurredOn === null) reasons.push("Max could not place the visible date safely.");
  else if (occurredOn && raw.date.confidence < CONFIDENCE_THRESHOLD) reasons.push("Max was not sure about the date.");

  const suggestedKind = validKind(raw.kind.value);
  const kind = suggestedKind && raw.kind.confidence >= CONFIDENCE_THRESHOLD ? suggestedKind : null;
  if (!kind) reasons.push("Max was not sure which kind of transaction this is.");

  const suggestedCategory = validCategory(kind, raw.category.value);
  const category =
    kind === "one_off"
      ? null
      : suggestedCategory && raw.category.confidence >= CONFIDENCE_THRESHOLD
        ? suggestedCategory
        : null;
  if (kind !== null && kind !== "one_off" && category === null) {
    reasons.push("Max was not sure which category fits.");
  }

  return {
    status: "draft",
    draft: {
      merchant,
      amount,
      occurredOn,
      kind,
      category,
      confidence: {
        merchant: raw.merchant.confidence,
        amount: raw.amount.confidence,
        date: raw.date.confidence,
        kind: raw.kind.confidence,
        category: raw.category.confidence,
      },
      needsAttention: reasons.length > 0,
      attentionReason: reasons.length > 0 ? reasons.join(" ") : null,
      rawImport: raw.sourceText,
    },
  };
}

function usageLog(usage: LlmUsage, provider: string, model: string): void {
  console.info(
    JSON.stringify({
      event: "llm.usage",
      capability: CAPABILITY,
      provider,
      model,
      promptTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: usage.costUsd,
    })
  );
}

function safetyIdentifier(userId: UserId): string {
  return createHash("sha256").update(userId).digest("hex");
}

export async function extractTransaction(
  userId: UserId,
  image: { bytes: Uint8Array; mimeType: "image/png" | "image/jpeg" | "image/webp" },
  provider: LlmProvider = createLlmProvider()
): Promise<TransactionExtractionResult> {
  const response = await provider.generate({
    capability: CAPABILITY,
    systemPrompt: EXTRACT_TRANSACTION_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Read the single transaction visible in this image." },
          { type: "image", bytes: image.bytes, mimeType: image.mimeType, detail: "high" },
        ],
      },
    ],
    output: {
      type: "json",
      name: "transaction_extraction",
      schema: EXTRACT_TRANSACTION_SCHEMA,
      strict: true,
    },
    maxOutputTokens: LLM_LIMITS.extractTransaction.maxOutputTokens,
    timeoutMs: LLM_LIMITS.extractTransaction.providerTimeoutMs,
    reasoningEffort: "none",
    safetyIdentifier: safetyIdentifier(userId),
  });

  usageLog(response.usage, response.provider, response.model);

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new LlmCapabilityError("malformed");
  }
  const validated = validateExtraction(parsed);
  return { ...validated, usage: response.usage } as TransactionExtractionResult;
}
