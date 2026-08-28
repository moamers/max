/**
 * T-10: Max depends on this contract, never on a provider SDK's types.
 * It is deliberately broad enough for the next caller: a streamed, multi-turn
 * conversation with optional images and a capability-owned JSON schema.
 */
export type LlmRole = "user" | "assistant";

export type LlmTextPart = {
  type: "text";
  text: string;
};

export type LlmImagePart = {
  type: "image";
  bytes: Uint8Array;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  detail?: "low" | "high" | "original" | "auto";
};

export type LlmContentPart = LlmTextPart | LlmImagePart;

export interface LlmMessage {
  role: LlmRole;
  content: string | LlmContentPart[];
}
export type LlmOutput =
  | { type: "text" }
  | {
      type: "json";
      name: string;
      schema: Record<string, unknown>;
      strict?: boolean;
    };

export interface LlmRequest {
  capability: string;
  systemPrompt?: string;
  messages: LlmMessage[];
  output: LlmOutput;
  maxOutputTokens: number;
  timeoutMs: number;
  reasoningEffort?: "none" | "low" | "medium" | "high";
  /** Stable, non-financial identifier used for provider abuse detection. */
  safetyIdentifier?: string;
}

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number | null;
}

export interface LlmResponse {
  provider: string;
  model: string;
  text: string;
  usage: LlmUsage;
}

export type LlmStreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "done"; usage: LlmUsage };

export interface LlmProvider {
  generate(request: LlmRequest): Promise<LlmResponse>;
  stream(request: LlmRequest): AsyncIterable<LlmStreamEvent>;
}
