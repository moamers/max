import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { requireUser, extractTransaction, prepareCaptureImage, takeSlot } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  extractTransaction: vi.fn(),
  prepareCaptureImage: vi.fn(),
  takeSlot: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ requireUser }));
vi.mock("@/lib/llm/capabilities/extract-transaction", () => ({ extractTransaction }));
vi.mock("@/lib/llm/images", () => ({ prepareCaptureImage }));
vi.mock("@/lib/llm/rate-limit", () => ({
  createUserRateLimiter: () => ({ take: takeSlot }),
}));

import { POST } from "../route";
import { LlmCapabilityError, LlmProviderError } from "@/lib/llm/errors";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const USAGE = { inputTokens: 100, outputTokens: 20, totalTokens: 120, costUsd: 0.000044 };
const DRAFT = {
  merchant: "TESCO EXPRESS",
  amount: 12.65,
  occurredOn: "2026-08-18",
  kind: "weekly",
  category: "everyday",
  confidence: { merchant: 1, amount: 1, date: 1, kind: 1, category: 1 },
  needsAttention: false,
  attentionReason: null,
  rawImport: "TESCO EXPRESS £12.65 18/08/2026",
};

function requestWith(file: File): NextRequest {
  const form = new FormData();
  form.set("file", file);
  return new NextRequest("http://max.test/api/llm/extract-transaction", { method: "POST", body: form });
}

async function body(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

beforeEach(() => {
  requireUser.mockReset();
  requireUser.mockResolvedValue({ id: USER_ID, email: "person@example.com" });
  extractTransaction.mockReset();
  extractTransaction.mockResolvedValue({ status: "draft", draft: DRAFT, usage: USAGE });
  prepareCaptureImage.mockReset();
  prepareCaptureImage.mockResolvedValue({ bytes: PNG, mimeType: "image/jpeg", width: 1, height: 1, sourceFormat: "png" });
  takeSlot.mockReset();
  takeSlot.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
});
describe("POST /api/llm/extract-transaction", () => {
  it("requires a user before reading or processing the request", async () => {
    requireUser.mockRejectedValue(new Error("unauthenticated"));
    await expect(POST(requestWith(new File([PNG], "receipt.png", { type: "image/png" })))).rejects.toThrow(
      "unauthenticated"
    );
    expect(prepareCaptureImage).not.toHaveBeenCalled();
    expect(extractTransaction).not.toHaveBeenCalled();
  });

  it("rejects an oversized file before image processing", async () => {
    const response = await POST(
      requestWith(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "receipt.png", { type: "image/png" }))
    );
    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({ code: "invalid_file" });
    expect(prepareCaptureImage).not.toHaveBeenCalled();
  });

  it("rejects a disallowed declared MIME type", async () => {
    const response = await POST(requestWith(new File(["%PDF-1.7"], "statement.pdf", { type: "application/pdf" })));
    expect(response.status).toBe(400);
    expect(extractTransaction).not.toHaveBeenCalled();
  });

  it("rejects a PDF renamed to PNG by checking the actual bytes", async () => {
    const response = await POST(requestWith(new File(["%PDF-1.7"], "receipt.png", { type: "image/png" })));
    expect(response.status).toBe(400);
    expect(await body(response)).toMatchObject({ code: "invalid_file" });
    expect(prepareCaptureImage).not.toHaveBeenCalled();
  });

  it("rejects when declared type and real image bytes disagree", async () => {
    const response = await POST(requestWith(new File([PNG], "receipt.jpg", { type: "image/jpeg" })));
    expect(response.status).toBe(400);
    expect(extractTransaction).not.toHaveBeenCalled();
  });

  it("makes one provider call and returns only a validated draft", async () => {
    const response = await POST(requestWith(new File([PNG], "receipt.png", { type: "image/png" })));
    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ draft: DRAFT });
    expect(prepareCaptureImage).toHaveBeenCalledTimes(1);
    expect(extractTransaction).toHaveBeenCalledTimes(1);
    expect(extractTransaction).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ mimeType: "image/jpeg" }));
  });

  it("throttles before conversion and paid work", async () => {
    takeSlot.mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const response = await POST(requestWith(new File([PNG], "receipt.png", { type: "image/png" })));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(prepareCaptureImage).not.toHaveBeenCalled();
    expect(extractTransaction).not.toHaveBeenCalled();
  });

  it("turns a provider timeout into retryable plain copy", async () => {
    extractTransaction.mockRejectedValue(new LlmProviderError("timeout"));
    const response = await POST(requestWith(new File([PNG], "receipt.png", { type: "image/png" })));
    expect(response.status).toBe(504);
    expect(await body(response)).toMatchObject({ code: "timeout", error: expect.stringContaining("Try again") });
  });

  it("does not expose provider errors or rate-limit messages", async () => {
    extractTransaction.mockRejectedValue(new LlmProviderError("provider", 500));
    const response = await POST(requestWith(new File([PNG], "receipt.png", { type: "image/png" })));
    expect(response.status).toBe(503);
    expect(await body(response)).toEqual({
      code: "provider",
      error: "Ravel couldn't read that image just now. Try again, or type it by hand.",
    });
  });

  it("treats malformed output as unreadable rather than a crash", async () => {
    extractTransaction.mockRejectedValue(new LlmCapabilityError("malformed"));
    const response = await POST(requestWith(new File([PNG], "receipt.png", { type: "image/png" })));
    expect(response.status).toBe(422);
    expect(await body(response)).toMatchObject({ code: "unreadable" });
  });

  it("returns no draft when a legible image has no transaction", async () => {
    extractTransaction.mockResolvedValue({ status: "no_transaction", usage: USAGE });
    const response = await POST(requestWith(new File([PNG], "photo.png", { type: "image/png" })));
    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ code: "no_transaction", error: expect.stringContaining("couldn't find") });
  });
});
