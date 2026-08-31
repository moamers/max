import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createOpenAiProvider, estimateOpenAiCost } from "../openai";
import { LlmProviderError } from "../errors";
import type { OpenAiRuntimeConfig } from "../config";
import type { LlmRequest } from "../provider";

const CONFIG: OpenAiRuntimeConfig = {
  apiKey: "test-key",
  model: "gpt-5.6-luna",
  reasoningEffort: "none",
  endpoint: "https://api.openai.test/v1/responses",
  inputUsdPerMillionTokens: 0.2,
  outputUsdPerMillionTokens: 1.2,
};

function request(overrides: Partial<LlmRequest> = {}): LlmRequest {
  return {
    capability: "test_capability",
    systemPrompt: "A system prompt",
    messages: [
      { role: "user", content: "First turn" },
      { role: "assistant", content: "First answer" },
      {
        role: "user",
        content: [
          { type: "text", text: "Second turn" },
          { type: "image", bytes: new Uint8Array([1, 2, 3]), mimeType: "image/jpeg", detail: "high" },
        ],
      },
    ],
    output: {
      type: "json",
      name: "answer",
      strict: true,
      schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
    },
    maxOutputTokens: 320,
    timeoutMs: 1000,
    reasoningEffort: "none",
    safetyIdentifier: "safe-user",
    ...overrides,
  };
}

describe("OpenAI provider adapter", () => {
  it("maps the provider-neutral contract to one Responses API call", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        output: [{ type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] }],
        usage: { input_tokens: 1000, output_tokens: 200, total_tokens: 1200 },
      })
    );
    const provider = createOpenAiProvider(CONFIG, fetchImpl);

    const result = await provider.generate(request());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(CONFIG.endpoint);
    expect(init?.headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer test-key", "Content-Type": "application/json" })
    );
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "gpt-5.6-luna",
      instructions: "A system prompt",
      max_output_tokens: 320,
      reasoning: { effort: "none" },
      store: false,
      stream: false,
      safety_identifier: "safe-user",
      text: { format: { type: "json_schema", name: "answer", strict: true } },
    });
    expect(body.input).toHaveLength(3);
    expect(body.input[2].content[1]).toMatchObject({
      type: "input_image",
      detail: "high",
      image_url: "data:image/jpeg;base64,AQID",
    });
    expect(result).toEqual({
      provider: "openai",
      model: "gpt-5.6-luna",
      text: '{"ok":true}',
      usage: { inputTokens: 1000, outputTokens: 200, totalTokens: 1200, costUsd: 0.00044 },
    });
  });

  it("supports streamed text and reports final usage", async () => {
    const sse = [
      'data: {"type":"response.output_text.delta","delta":"Hel"}',
      'data: {"type":"response.output_text.delta","delta":"lo"}',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":10,"output_tokens":2,"total_tokens":12}}}',
      "",
    ].join("\n\n");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(sse));
    const provider = createOpenAiProvider(CONFIG, fetchImpl);
    const events = [];
    for await (const event of provider.stream(request({ output: { type: "text" } }))) events.push(event);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      { type: "text_delta", delta: "Hel" },
      { type: "text_delta", delta: "lo" },
      {
        type: "done",
        usage: { inputTokens: 10, outputTokens: 2, totalTokens: 12, costUsd: 0.0000044 },
      },
    ]);
    const body = JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));
    expect(body.stream).toBe(true);
  });

  it("maps provider throttling without exposing its response body", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"error":{"message":"secret provider detail"}}', { status: 429 })
    );
    const provider = createOpenAiProvider(CONFIG, fetchImpl);
    await expect(provider.generate(request())).rejects.toMatchObject({ code: "rate_limited", status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("requires a server-side key before making a request", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const provider = createOpenAiProvider({ ...CONFIG, apiKey: "" }, fetchImpl);
    await expect(provider.generate(request())).rejects.toEqual(expect.any(LlmProviderError));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("treats an unreadable provider response as malformed", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ output: [] }));
    await expect(createOpenAiProvider(CONFIG, fetchImpl).generate(request())).rejects.toMatchObject({
      code: "malformed",
    });
  });

  it("aborts one slow request at Ravel's deadline without retrying", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })
    );
    const provider = createOpenAiProvider(CONFIG, fetchImpl);
    await expect(provider.generate(request({ timeoutMs: 5 }))).rejects.toMatchObject({ code: "timeout" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("cost accounting", () => {
  it("shows checkable input plus output arithmetic", () => {
    expect(estimateOpenAiCost({ inputTokens: 3500, outputTokens: 320 }, CONFIG)).toBe(0.001084);
  });

  it("does not invent a dollar figure for an unknown model price", () => {
    expect(
      estimateOpenAiCost(
        { inputTokens: 3500, outputTokens: 320 },
        { inputUsdPerMillionTokens: null, outputUsdPerMillionTokens: null }
      )
    ).toBeNull();
  });
});
