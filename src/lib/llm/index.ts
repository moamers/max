import "server-only";

import { getOpenAiConfig } from "./config";
import { LlmProviderError } from "./errors";
import { createOpenAiProvider } from "./openai";
import type { LlmProvider } from "./provider";

export function createLlmProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase() || "openai";
  if (provider === "openai") return createOpenAiProvider(getOpenAiConfig());
  throw new LlmProviderError("configuration");
}

export type {
  LlmContentPart,
  LlmImagePart,
  LlmMessage,
  LlmOutput,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  LlmStreamEvent,
  LlmTextPart,
  LlmUsage,
} from "./provider";
