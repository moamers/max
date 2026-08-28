import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  declaredMimeMatchesImage,
  detectCaptureImage,
  validateClientCaptureFile,
} from "../image-types";
import { prepareCaptureImage } from "../images";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
const WEBP = Buffer.from("RIFF\0\0\0\0WEBP", "binary");
const PDF = Buffer.from("%PDF-1.7\n");
// A real 48×48 HEIC produced by macOS ImageIO, not just a fabricated ftyp header.
const HEIC = Buffer.from(
  "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",
  "base64"
);

describe("image gates", () => {
  it("recognises the supported formats from leading bytes", () => {
    expect(detectCaptureImage(PNG)?.format).toBe("png");
    expect(detectCaptureImage(JPEG)?.format).toBe("jpeg");
    expect(detectCaptureImage(WEBP)?.format).toBe("webp");
    expect(detectCaptureImage(HEIC)?.format).toBe("heic");
    expect(detectCaptureImage(PDF)).toBeNull();
  });

  it("rejects a declared type that does not match the bytes", () => {
    const png = detectCaptureImage(PNG);
    expect(png).not.toBeNull();
    if (!png) return;
    expect(declaredMimeMatchesImage("image/png", png)).toBe(true);
    expect(declaredMimeMatchesImage("image/jpeg", png)).toBe(false);

    const heic = detectCaptureImage(HEIC);
    expect(heic).not.toBeNull();
    if (!heic) return;
    expect(declaredMimeMatchesImage("", heic)).toBe(true);
  });

  it("checks client size and type before an upload", () => {
    expect(validateClientCaptureFile({ name: "receipt.heic", type: "", size: 1000 })).toBeNull();
    expect(validateClientCaptureFile({ name: "statement.pdf", type: "application/pdf", size: 1000 })).toBe("type");
    expect(validateClientCaptureFile({ name: "receipt.png", type: "image/png", size: 11 * 1024 * 1024 })).toBe("size");
  });
});

describe("server image preparation", () => {
  it("decodes a real HEIC and converts it to bounded JPEG before the provider", async () => {
    const detected = detectCaptureImage(HEIC);
    expect(detected?.format).toBe("heic");
    if (!detected) return;
    const prepared = await prepareCaptureImage(HEIC, detected);
    expect(prepared.sourceFormat).toBe("heic");
    expect(prepared.mimeType).toBe("image/jpeg");
    expect(prepared.width).toBeLessThanOrEqual(1600);
    expect(prepared.height).toBeLessThanOrEqual(1600);
    expect(Array.from(prepared.bytes.slice(0, 3))).toEqual([0xff, 0xd8, 0xff]);
  });
});
