/**
 * This check rejected every write from every browser in production.
 *
 * It compared the browser's Origin against `req.nextUrl.host`, which behind a
 * reverse proxy is the app's internal address rather than the hostname the
 * user typed. Every curl test passed because curl sends no Origin; every real
 * browser failed. Server Actions surfaced the 403 as "an unexpected response
 * was received from the server", which named nothing.
 */
import { describe, it, expect } from "vitest";
import { acceptableHosts, originIsAcceptable } from "../../proxy";

const PUBLIC = "max-production-f9e5.up.railway.app";

function req(headers: Record<string, string>, internalHost = "localhost:8080") {
  return {
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    nextUrl: { host: internalHost },
  };
}

describe("CSRF origin check", () => {
  it("accepts a browser request behind a reverse proxy", () => {
    // The regression: public hostname outside, internal address inside.
    const r = req({ origin: `https://${PUBLIC}`, "x-forwarded-host": PUBLIC, host: PUBLIC });
    expect(originIsAcceptable(`https://${PUBLIC}`, acceptableHosts(r))).toBe(true);
  });

  it("accepts a request with no proxy in front", () => {
    const r = req({ origin: "https://example.com", host: "example.com" }, "example.com");
    expect(originIsAcceptable("https://example.com", acceptableHosts(r))).toBe(true);
  });

  it("still rejects a genuinely cross-origin write", () => {
    const r = req({ origin: "https://evil.example", "x-forwarded-host": PUBLIC, host: PUBLIC });
    expect(originIsAcceptable("https://evil.example", acceptableHosts(r))).toBe(false);
  });

  it("takes the first entry of a forwarded chain", () => {
    const r = req({ "x-forwarded-host": `${PUBLIC}, internal.railway`, host: "internal" });
    expect(acceptableHosts(r)[0]).toBe(PUBLIC);
  });

  it("lets non-browser clients through, which is why curl never caught this", () => {
    expect(originIsAcceptable(null, [PUBLIC])).toBe(true);
  });

  it("rejects an unparseable Origin rather than trusting it", () => {
    expect(originIsAcceptable("not-a-url", [PUBLIC])).toBe(false);
  });
});
