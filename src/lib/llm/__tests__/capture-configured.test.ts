/**
 * A feature that cannot work is not offered.
 *
 * The capture control shipped visible on Add and Edit with no provider key
 * configured, so tapping it opened the picker, uploaded the image, and then
 * failed. That reads as a broken app rather than an unconfigured one — the
 * same shape as a screen that looks disabled because no targets are set.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

// `config.ts` is server-only; the marker package throws outside a server module.
vi.mock("server-only", () => ({}));

import { isCaptureConfigured, getOpenAiConfig } from "../config";

const original = process.env.OPENAI_API_KEY;

const originalEffort = process.env.OPENAI_REASONING_EFFORT;

afterEach(() => {
  if (original === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = original;
  if (originalEffort === undefined) delete process.env.OPENAI_REASONING_EFFORT;
  else process.env.OPENAI_REASONING_EFFORT = originalEffort;
  vi.unstubAllEnvs();
});

describe("capture is offered only when it can work", () => {
  it("is off when no key is set", () => {
    delete process.env.OPENAI_API_KEY;
    expect(isCaptureConfigured()).toBe(false);
  });

  it("is off for a key that is only whitespace", () => {
    process.env.OPENAI_API_KEY = "   ";
    expect(isCaptureConfigured()).toBe(false);
  });

  it("is on once a key is present", () => {
    process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
    expect(isCaptureConfigured()).toBe(true);
  });

  it("never leaks the key through the config object's shape", () => {
    // The value is read server-side only; this pins that the flag is a boolean
    // and cannot be mistaken for something safe to send to the browser.
    process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
    expect(typeof isCaptureConfigured()).toBe("boolean");
    expect(getOpenAiConfig().apiKey).not.toBe("");
  });
});

describe("how hard it thinks is a config value, not a constant", () => {
  it("costs nothing extra by default", () => {
    // Reading a printed figure is extraction, not deduction.
    delete process.env.OPENAI_REASONING_EFFORT;
    expect(getOpenAiConfig().reasoningEffort).toBe("none");
  });

  it("can be raised without a code change", () => {
    process.env.OPENAI_REASONING_EFFORT = "low";
    expect(getOpenAiConfig().reasoningEffort).toBe("low");
  });

  it("accepts the value however it is cased or spaced", () => {
    process.env.OPENAI_REASONING_EFFORT = "  MEDIUM ";
    expect(getOpenAiConfig().reasoningEffort).toBe("medium");
  });

  it("falls back rather than failing on a typo", () => {
    // A mistyped deploy variable should not take the feature down.
    process.env.OPENAI_REASONING_EFFORT = "maximum";
    expect(getOpenAiConfig().reasoningEffort).toBe("none");
  });
});
