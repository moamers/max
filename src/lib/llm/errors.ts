export type LlmProviderFailure = "configuration" | "timeout" | "rate_limited" | "provider" | "malformed";

/** Provider details stay server-side; routes translate this stable code to plain copy. */
export class LlmProviderError extends Error {
  constructor(
    public readonly code: LlmProviderFailure,
    public readonly status?: number
  ) {
    super(`LLM provider failure: ${code}`);
    this.name = "LlmProviderError";
  }
}
export class LlmCapabilityError extends Error {
  constructor(public readonly code: "malformed" | "unreadable") {
    super(`LLM capability failure: ${code}`);
    this.name = "LlmCapabilityError";
  }
}
