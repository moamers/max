import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { LLM_LIMITS } from "@/lib/llm/config";
import { extractTransaction } from "@/lib/llm/capabilities/extract-transaction";
import { LlmCapabilityError, LlmProviderError } from "@/lib/llm/errors";
import {
  CAPTURE_IMAGE_LIMITS,
  declaredMimeMatchesImage,
  detectCaptureImage,
} from "@/lib/llm/image-types";
import { prepareCaptureImage } from "@/lib/llm/images";
import { createUserRateLimiter } from "@/lib/llm/rate-limit";

export const runtime = "nodejs";

export const CAPTURE_FILE_ERROR = "Max can read PNG, JPEG, WebP, HEIC or HEIF images up to 10 MB.";
export const CAPTURE_TIMEOUT_ERROR =
  "Reading that image took longer than expected. Try again, or type it by hand.";
export const CAPTURE_PROVIDER_ERROR = "Max couldn't read that image just now. Try again, or type it by hand.";
export const CAPTURE_NO_TRANSACTION =
  "Max couldn't find a transaction in that image. Choose another image, or type it by hand.";
export const CAPTURE_RATE_LIMIT_ERROR = "Give it a moment, then try again or type it by hand.";

const extractionLimiter = createUserRateLimiter(
  LLM_LIMITS.extractTransaction.requestsPerWindow,
  LLM_LIMITS.extractTransaction.rateLimitWindowMs
);

function json(body: Record<string, unknown>, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}
export async function POST(req: NextRequest) {
  // Auth is deliberately the first awaited operation: no anonymous caller gets
  // file parsing, image conversion, or a paid model call.
  const user = await requireUser();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ error: CAPTURE_FILE_ERROR, code: "invalid_file" }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > CAPTURE_IMAGE_LIMITS.maxBytes) {
    return json({ error: CAPTURE_FILE_ERROR, code: "invalid_file" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectCaptureImage(bytes);
  if (!detected || !declaredMimeMatchesImage(file.type, detected)) {
    return json({ error: CAPTURE_FILE_ERROR, code: "invalid_file" }, 400);
  }

  const rateLimit = extractionLimiter.take(user.id);
  if (!rateLimit.allowed) {
    return json(
      { error: CAPTURE_RATE_LIMIT_ERROR, code: "rate_limited" },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) }
    );
  }

  let prepared;
  try {
    prepared = await prepareCaptureImage(bytes, detected);
  } catch {
    return json({ error: CAPTURE_FILE_ERROR, code: "invalid_file" }, 400);
  }

  try {
    const result = await extractTransaction(user.id, {
      bytes: prepared.bytes,
      mimeType: prepared.mimeType,
    });

    if (result.status === "no_transaction") {
      return json({ error: CAPTURE_NO_TRANSACTION, code: "no_transaction" });
    }
    return json({ draft: result.draft });
  } catch (error) {
    if (error instanceof LlmProviderError && error.code === "timeout") {
      return json({ error: CAPTURE_TIMEOUT_ERROR, code: "timeout" }, 504);
    }
    if (error instanceof LlmProviderError && error.code === "rate_limited") {
      return json({ error: CAPTURE_RATE_LIMIT_ERROR, code: "provider_rate_limited" }, 503);
    }
    if (error instanceof LlmCapabilityError || (error instanceof LlmProviderError && error.code === "malformed")) {
      return json({ error: CAPTURE_PROVIDER_ERROR, code: "unreadable" }, 422);
    }
    return json({ error: CAPTURE_PROVIDER_ERROR, code: "provider" }, 503);
  }
}
