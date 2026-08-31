import "server-only";

export const LLM_LIMITS = {
  extractTransaction: {
    maxOutputTokens: 320,
    providerTimeoutMs: 20_000,
    requestsPerWindow: 5,
    rateLimitWindowMs: 60_000,
  },
} as const;

export type ReasoningEffort = "none" | "low" | "medium" | "high";

const REASONING_EFFORTS: readonly ReasoningEffort[] = ["none", "low", "medium", "high"];

export interface OpenAiRuntimeConfig {
  apiKey: string;
  model: string;
  /** How hard the model is asked to think. More thinking is more output tokens, which is more money. */
  reasoningEffort: ReasoningEffort;
  endpoint: string;
  inputUsdPerMillionTokens: number | null;
  outputUsdPerMillionTokens: number | null;
}
const KNOWN_OPENAI_PRICING: Readonly<Record<string, { input: number; output: number }>> = {
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
};

/**
 * Reading a receipt is extraction, not deduction: the figure is printed on the
 * image. `none` is the default because thinking about it costs output tokens
 * and buys nothing here. Raised via env only if a real misread justifies it —
 * and an unrecognised value falls back rather than failing a request, since a
 * typo in a deploy variable should not take the feature down.
 */
function reasoningEffort(): ReasoningEffort {
  const raw = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  return REASONING_EFFORTS.find((effort) => effort === raw) ?? "none";
}

function optionalPositiveNumber(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function getOpenAiConfig(): OpenAiRuntimeConfig {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";
  const known = KNOWN_OPENAI_PRICING[model];
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() || "",
    model,
    reasoningEffort: reasoningEffort(),
    endpoint: "https://api.openai.com/v1/responses",
    inputUsdPerMillionTokens:
      optionalPositiveNumber("OPENAI_INPUT_USD_PER_MILLION_TOKENS") ?? known?.input ?? null,
    outputUsdPerMillionTokens:
      optionalPositiveNumber("OPENAI_OUTPUT_USD_PER_MILLION_TOKENS") ?? known?.output ?? null,
  };
}

/**
 * Whether image capture can actually work right now.
 *
 * Without a key the control still renders, opens the picker, uploads, and then
 * fails — which reads as a broken app rather than an unconfigured one. Ravel's
 * whole posture is to say what it doesn't know instead of failing at you, so a
 * feature that cannot work is not offered. Server-side only: the answer depends
 * on an env var the browser must never see.
 */
export function isCaptureConfigured(): boolean {
  return getOpenAiConfig().apiKey.length > 0;
}
