import "server-only";

export const LLM_LIMITS = {
  extractTransaction: {
    maxOutputTokens: 320,
    providerTimeoutMs: 20_000,
    requestsPerWindow: 5,
    rateLimitWindowMs: 60_000,
  },
} as const;

export interface OpenAiRuntimeConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  inputUsdPerMillionTokens: number | null;
  outputUsdPerMillionTokens: number | null;
}
const KNOWN_OPENAI_PRICING: Readonly<Record<string, { input: number; output: number }>> = {
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
};

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
    endpoint: "https://api.openai.com/v1/responses",
    inputUsdPerMillionTokens:
      optionalPositiveNumber("OPENAI_INPUT_USD_PER_MILLION_TOKENS") ?? known?.input ?? null,
    outputUsdPerMillionTokens:
      optionalPositiveNumber("OPENAI_OUTPUT_USD_PER_MILLION_TOKENS") ?? known?.output ?? null,
  };
}
