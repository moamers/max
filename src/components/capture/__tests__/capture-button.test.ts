import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  captureErrorForClientProblem,
  isTransactionExtractionDraft,
} from "../CaptureButton";

describe("capture client boundary", () => {
  it("uses plain copy for client-side file rejection", () => {
    expect(captureErrorForClientProblem("type")).toContain("PNG, JPEG, WebP, HEIC or HEIF");
    expect(captureErrorForClientProblem("size")).toContain("10 MB");
    expect(captureErrorForClientProblem(null)).toBeNull();
  });

  it("accepts only a complete validated draft from the route", () => {
    expect(
      isTransactionExtractionDraft({
        merchant: "TESCO",
        amount: 12.65,
        occurredOn: null,
        kind: "one_off",
        category: null,
        confidence: { merchant: 1, amount: 0.9, date: 0, kind: 0.8, category: 0 },
        needsAttention: false,
        attentionReason: null,
        rawImport: "TESCO £12.65",
      })
    ).toBe(true);
    expect(isTransactionExtractionDraft({ merchant: "TESCO", amount: "12.65" })).toBe(false);
  });

  it("leaves capture off the file input so iOS keeps the native source chooser", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../CaptureButton.tsx", import.meta.url)),
      "utf8"
    );
    expect(source).toContain('type="file"');
    expect(source).toContain("accept={CAPTURE_ACCEPT}");
    expect(source).not.toMatch(/\bcapture\s*=/);
  });
});
