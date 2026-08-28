export const CAPTURE_IMAGE_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxDimension: 1600,
  maxInputPixels: 40_000_000,
  jpegQuality: 82,
} as const;

export const CAPTURE_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.heic,.heif,image/png,image/jpeg,image/webp,image/heic,image/heif";

export type CaptureImageFormat = "png" | "jpeg" | "webp" | "heic" | "heif";

export interface DetectedImage {
  format: CaptureImageFormat;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/heic" | "image/heif";
}

const CLIENT_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const CLIENT_EXTENSIONS = /\.(png|jpe?g|webp|heic|heif)$/i;

export type ClientFileProblem = "type" | "size" | null;

export function validateClientCaptureFile(file: Pick<File, "name" | "size" | "type">): ClientFileProblem {
  if (file.size > CAPTURE_IMAGE_LIMITS.maxBytes) return "size";
  if (!CLIENT_MIMES.has(file.type.toLowerCase()) && !CLIENT_EXTENSIONS.test(file.name)) return "type";
  return null;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis"]);
const HEIF_BRANDS = new Set(["mif1", "msf1"]);

export function detectCaptureImage(bytes: Uint8Array): DetectedImage | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { format: "png", mimeType: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { format: "jpeg", mimeType: "image/jpeg" };
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { format: "webp", mimeType: "image/webp" };
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brands: string[] = [ascii(bytes, 8, 4)];
    for (let offset = 16; offset + 4 <= Math.min(bytes.length, 64); offset += 4) {
      brands.push(ascii(bytes, offset, 4));
    }
    if (brands.some((brand) => HEIC_BRANDS.has(brand))) {
      return { format: "heic", mimeType: "image/heic" };
    }
    if (brands.some((brand) => HEIF_BRANDS.has(brand))) {
      return { format: "heif", mimeType: "image/heif" };
    }
  }
  return null;
}

export function declaredMimeMatchesImage(declaredMime: string, detected: DetectedImage): boolean {
  const declared = declaredMime.toLowerCase();
  // Some iOS file providers omit File.type for HEIC. The byte signature is the
  // security boundary; an absent declaration is not treated as a contradiction.
  if (declared === "") return true;
  if (detected.format === "jpeg") return declared === "image/jpeg";
  if (detected.format === "heic") return declared === "image/heic" || declared === "image/heic-sequence";
  if (detected.format === "heif") return declared === "image/heif" || declared === "image/heif-sequence";
  return declared === detected.mimeType;
}
