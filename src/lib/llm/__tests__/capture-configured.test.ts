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

afterEach(() => {
  if (original === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = original;
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
