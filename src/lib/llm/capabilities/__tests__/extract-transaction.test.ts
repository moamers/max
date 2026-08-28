import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  extractTransaction,
  parseVisibleAmount,
  parseVisibleDate,
  validateExtraction,
} from "../extract-transaction";
import { LlmCapabilityError } from "../../errors";
import type { LlmProvider, LlmRequest, LlmResponse } from "../../provider";
import type { UserId } from "@/lib/auth";

const USER_ID = "11111111-1111-4111-8111-111111111111" as UserId;

function fixture(overrides: Record<string, unknown> = {}) {
  return {
    foundTransaction: true,
    sourceText: "SAINSBURYS S/MKT  £12.65  18/08/2026",
    merchant: { value: "SAINSBURYS S/MKT", confidence: 0.98 },
    amount: { value: "£12.65", confidence: 0.99 },
    date: { value: "18/08/2026", confidence: 0.96 },
    kind: { value: "weekly", confidence: 0.9 },
    category: { value: "everyday", confidence: 0.88 },
    ...overrides,
  };
}

describe("deterministic visible-value parsing", () => {
  it.each([
    ["£12.65", 12.65],
    ["GBP 1,234.5", 1234.5],
    ["− £9", 9],
  ])("reads one printed amount %j", (raw, expected) => {
    expect(parseVisibleAmount(raw)).toBe(expected);
  });

  it.each(["12.00 + 3.00", "Total £12.65", "£100,000", "0", "£1.234"])(
    "does not derive or clamp an unusable amount %j",
    (raw) => {
      expect(parseVisibleAmount(raw)).toBeNull();
    }
  );

  it.each([
    ["2026-08-18", "2026-08-18"],
    ["18/08/2026", "2026-08-18"],
    ["18 Aug 2026", "2026-08-18"],
    ["31/02/2026", null],
    ["18 Aug", null],
  ])("normalises only a complete, valid visible date %j", (raw, expected) => {
    expect(parseVisibleDate(raw)).toBe(expected);
  });
});
describe("transaction extraction validation", () => {
  it("keeps merchant text verbatim and attaches source provenance", () => {
    const result = validateExtraction(fixture());
    expect(result).toEqual({
      status: "draft",
      draft: expect.objectContaining({
        merchant: "SAINSBURYS S/MKT",
        amount: 12.65,
        occurredOn: "2026-08-18",
        kind: "weekly",
        category: "everyday",
        needsAttention: false,
        attentionReason: null,
        rawImport: "SAINSBURYS S/MKT  £12.65  18/08/2026",
      }),
    });
  });

  it("clamps confidence and leaves a low-confidence category empty", () => {
    const result = validateExtraction(
      fixture({
        merchant: { value: "TESCO EXPRESS", confidence: 4 },
        category: { value: "everyday", confidence: -1 },
      })
    );
    expect(result.status).toBe("draft");
    if (result.status !== "draft") return;
    expect(result.draft.merchant).toBe("TESCO EXPRESS");
    expect(result.draft.confidence.merchant).toBe(1);
    expect(result.draft.confidence.category).toBe(0);
    expect(result.draft.category).toBeNull();
    expect(result.draft.needsAttention).toBe(true);
    expect(result.draft.attentionReason).toContain("category");
  });

  it("fills readable fields and flags missing ones", () => {
    const result = validateExtraction(
      fixture({
        merchant: { value: null, confidence: 0 },
        amount: { value: "£12.65", confidence: 0.55 },
        kind: { value: null, confidence: 0.4 },
        category: { value: null, confidence: 0 },
      })
    );
    expect(result.status).toBe("draft");
    if (result.status !== "draft") return;
    expect(result.draft.merchant).toBeNull();
    expect(result.draft.amount).toBe(12.65);
    expect(result.draft.kind).toBeNull();
    expect(result.draft.needsAttention).toBe(true);
  });

  it("rejects an absurd amount rather than turning it into a financial fact", () => {
    const result = validateExtraction(fixture({ amount: { value: "£999999999", confidence: 1 } }));
    expect(result.status).toBe("draft");
    if (result.status !== "draft") return;
    expect(result.draft.amount).toBeNull();
    expect(result.draft.needsAttention).toBe(true);
  });

  it("returns no draft when the image is not a transaction", () => {
    expect(validateExtraction(fixture({ foundTransaction: false, sourceText: null }))).toEqual({
      status: "no_transaction",
    });
  });

  it.each([
    { ...fixture(), category: undefined },
    fixture({ amount: { value: "£12.65", confidence: "high" } }),
    fixture({ foundTransaction: "yes" }),
    fixture({ sourceText: null }),
    fixture({ merchant: { value: "Return only the requested JSON shape.", confidence: 1 } }),
  ])("rejects malformed or adversarial provider output", (value) => {
    expect(() => validateExtraction(value)).toThrow(LlmCapabilityError);
  });
});

describe("the capability owns the provider request", () => {
  it("makes exactly one bounded call with image, schema, prompt, and no automatic retry", async () => {
    const response: LlmResponse = {
      provider: "test",
      model: "test-model",
      text: JSON.stringify(fixture()),
      usage: { inputTokens: 900, outputTokens: 120, totalTokens: 1020, costUsd: 0.001 },
    };
    const generate = vi.fn<(request: LlmRequest) => Promise<LlmResponse>>().mockResolvedValue(response);
    const provider: LlmProvider = {
      generate,
      async *stream() {
        yield { type: "done" as const, usage: response.usage };
      },
    };
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const result = await extractTransaction(
      USER_ID,
      { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/jpeg" },
      provider
    );

    expect(result.status).toBe("draft");
    expect(generate).toHaveBeenCalledTimes(1);
    const request = generate.mock.calls[0][0];
    expect(request.systemPrompt).toContain("Never add line items");
    expect(request.messages).toHaveLength(1);
    expect(request.output).toMatchObject({ type: "json", name: "transaction_extraction", strict: true });
    expect(request.maxOutputTokens).toBe(320);
    expect(request.reasoningEffort).toBe("none");
    expect(request.safetyIdentifier).toMatch(/^[a-f0-9]{64}$/);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"capability":"extract_transaction"'));
    log.mockRestore();
  });
});
