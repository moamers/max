import "server-only";

import { LibheifDecoder } from "@keeratita/heic-converter";
import sharp, { type Sharp } from "sharp";
import { CAPTURE_IMAGE_LIMITS, type DetectedImage } from "./image-types";

export interface PreparedImage {
  bytes: Uint8Array;
  mimeType: "image/jpeg";
  width: number;
  height: number;
  sourceFormat: DetectedImage["format"];
}

/**
 * Cost ceiling: decode only a bounded raster, apply phone orientation, fit it
 * within 1600px, and send one compressed JPEG to the provider. HEIC/HEIF is
 * converted here rather than being handed to a provider that does not accept it.
 */
export async function prepareCaptureImage(input: Uint8Array, detected: DetectedImage): Promise<PreparedImage> {
  const isHeif = detected.format === "heic" || detected.format === "heif";
  let pipeline: Sharp;

  if (isHeif) {
    // OpenAI does not accept HEIC/HEIF, and Sharp's prebuilt binary does not
    // include an HEVC decoder. Decode locally in WASM, then hand bounded raw
    // pixels to Sharp for the same resize/compression path as other formats.
    const decoder = new LibheifDecoder();
    try {
      await decoder.initialize();
      const decoded = await decoder.decode(input);
      if (decoded.width * decoded.height > CAPTURE_IMAGE_LIMITS.maxInputPixels) {
        throw new Error("Image dimensions exceed the capture limit");
      }
      pipeline = sharp(Buffer.from(decoded.data), {
        raw: { width: decoded.width, height: decoded.height, channels: 4 },
        limitInputPixels: CAPTURE_IMAGE_LIMITS.maxInputPixels,
        failOn: "warning",
      });
    } finally {
      decoder.free();
    }
  } else {
    pipeline = sharp(input, {
      limitInputPixels: CAPTURE_IMAGE_LIMITS.maxInputPixels,
      failOn: "warning",
    }).rotate();
  }

  const { data, info } = await pipeline
    .resize({
      width: CAPTURE_IMAGE_LIMITS.maxDimension,
      height: CAPTURE_IMAGE_LIMITS.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: CAPTURE_IMAGE_LIMITS.jpegQuality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    bytes: data,
    mimeType: "image/jpeg",
    width: info.width,
    height: info.height,
    sourceFormat: detected.format,
  };
}
