import "server-only";

import { LlmProviderError } from "./errors";
import type {
  LlmContentPart,
  LlmMessage,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  LlmStreamEvent,
  LlmUsage,
} from "./provider";
import type { OpenAiRuntimeConfig } from "./config";

type FetchLike = typeof fetch;

interface OpenAiUsageShape {
  input_tokens?: unknown;
  output_tokens?: unknown;
  total_tokens?: unknown;
}

function finiteTokenCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function estimateOpenAiCost(
  usage: Pick<LlmUsage, "inputTokens" | "outputTokens">,
  config: Pick<OpenAiRuntimeConfig, "inputUsdPerMillionTokens" | "outputUsdPerMillionTokens">
): number | null {
  if (config.inputUsdPerMillionTokens === null || config.outputUsdPerMillionTokens === null) return null;
  return (
    (usage.inputTokens * config.inputUsdPerMillionTokens +
      usage.outputTokens * config.outputUsdPerMillionTokens) /
    1_000_000
  );
}

function parseUsage(value: unknown, config: OpenAiRuntimeConfig): LlmUsage {
  const raw = value && typeof value === "object" ? (value as OpenAiUsageShape) : {};
  const inputTokens = finiteTokenCount(raw.input_tokens);
  const outputTokens = finiteTokenCount(raw.output_tokens);
  const totalTokens = finiteTokenCount(raw.total_tokens) || inputTokens + outputTokens;
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd: estimateOpenAiCost({ inputTokens, outputTokens }, config),
  };
}

function asDataUrl(part: Extract<LlmContentPart, { type: "image" }>): string {
  return `data:${part.mimeType};base64,${Buffer.from(part.bytes).toString("base64")}`;
}

function mapMessage(message: LlmMessage) {
  if (typeof message.content === "string") return { role: message.role, content: message.content };
  return {
    role: message.role,
    content: message.content.map((part) => {
      if (part.type === "text") {
        return {
          type: message.role === "assistant" ? "output_text" : "input_text",
          text: part.text,
        };
      }
      if (message.role !== "user") throw new LlmProviderError("malformed");
      return {
        type: "input_image",
        image_url: asDataUrl(part),
        detail: part.detail ?? "auto",
      };
    }),
  };
}

function requestBody(request: LlmRequest, config: OpenAiRuntimeConfig, stream: boolean) {
  return {
    model: config.model,
    instructions: request.systemPrompt,
    input: request.messages.map(mapMessage),
    max_output_tokens: request.maxOutputTokens,
    reasoning: { effort: request.reasoningEffort ?? "none" },
    store: false,
    stream,
    safety_identifier: request.safetyIdentifier,
    text:
      request.output.type === "json"
        ? {
            format: {
              type: "json_schema",
              name: request.output.name,
              schema: request.output.schema,
              strict: request.output.strict ?? true,
            },
          }
        : { format: { type: "text" } },
  };
}

function responseText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const response = value as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return null;
  const chunks: string[] = [];
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const candidate = part as { type?: unknown; text?: unknown };
      if (candidate.type === "output_text" && typeof candidate.text === "string") chunks.push(candidate.text);
    }
  }
  return chunks.length > 0 ? chunks.join("") : null;
}

function providerFailure(status: number): LlmProviderError {
  return new LlmProviderError(status === 429 ? "rate_limited" : "provider", status);
}

async function fetchWithTimeout(
  fetchImpl: FetchLike,
  config: OpenAiRuntimeConfig,
  request: LlmRequest,
  stream: boolean
): Promise<{ response: Response; controller: AbortController; finish: () => void }> {
  if (!config.apiKey) throw new LlmProviderError("configuration");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs);
  const finish = () => clearTimeout(timer);
  try {
    const response = await fetchImpl(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody(request, config, stream)),
      signal: controller.signal,
    });
    if (!response.ok) {
      finish();
      throw providerFailure(response.status);
    }
    // Keep the deadline alive until the JSON body or stream has finished, not
    // merely until response headers arrive.
    return { response, controller, finish };
  } catch (error) {
    finish();
    if (error instanceof LlmProviderError) throw error;
    if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new LlmProviderError("timeout");
    }
    throw new LlmProviderError("provider");
  }
}

export function createOpenAiProvider(config: OpenAiRuntimeConfig, fetchImpl: FetchLike = fetch): LlmProvider {
  return {
    async generate(request): Promise<LlmResponse> {
      const timed = await fetchWithTimeout(fetchImpl, config, request, false);
      try {
        let payload: unknown;
        try {
          payload = await timed.response.json();
        } catch (error) {
          if (timed.controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
            throw new LlmProviderError("timeout");
          }
          throw new LlmProviderError("malformed");
        }
        const text = responseText(payload);
        if (text === null) throw new LlmProviderError("malformed");
        const usage = parseUsage((payload as { usage?: unknown }).usage, config);
        return { provider: "openai", model: config.model, text, usage };
      } finally {
        timed.finish();
      }
    },

    async *stream(request): AsyncIterable<LlmStreamEvent> {
      const timed = await fetchWithTimeout(fetchImpl, config, request, true);
      if (!timed.response.body) {
        timed.finish();
        throw new LlmProviderError("malformed");
      }
      const reader = timed.response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let emittedDone = false;

      const handleEvent = (raw: string): LlmStreamEvent | null => {
        const data = raw
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data || data === "[DONE]") return null;
        let event: unknown;
        try {
          event = JSON.parse(data);
        } catch {
          throw new LlmProviderError("malformed");
        }
        if (!event || typeof event !== "object") return null;
        const shaped = event as { type?: unknown; delta?: unknown; response?: { usage?: unknown } };
        if (shaped.type === "response.output_text.delta" && typeof shaped.delta === "string") {
          return { type: "text_delta", delta: shaped.delta };
        }
        if (shaped.type === "response.completed") {
          emittedDone = true;
          return { type: "done", usage: parseUsage(shaped.response?.usage, config) };
        }
        return null;
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          pending += decoder.decode(value, { stream: !done });
          const events = pending.split(/\r?\n\r?\n/);
          pending = events.pop() ?? "";
          for (const raw of events) {
            const event = handleEvent(raw);
            if (event) yield event;
          }
          if (done) break;
        }
        if (pending.trim()) {
          const event = handleEvent(pending);
          if (event) yield event;
        }
        if (!emittedDone) throw new LlmProviderError("malformed");
      } catch (error) {
        if (error instanceof LlmProviderError) throw error;
        if (timed.controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
          throw new LlmProviderError("timeout");
        }
        throw new LlmProviderError("provider");
      } finally {
        timed.finish();
      }
    },
  };
}
