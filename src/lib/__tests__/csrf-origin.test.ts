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
import { dominantMonth } from "../periods";

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

describe("a period is named by one rule everywhere", () => {
  const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m, day));

  it("names Jun 29 – Aug 2 as July, not June", () => {
    // The regression: the month bar said July and the calendar tile said Jun,
    // because one used the dominant month and the other used the start month.
    // Two days in June, thirty-one in July, two in August.
    expect(dominantMonth(d(2026, 5, 29), d(2026, 7, 2)).getUTCMonth()).toBe(6);
  });

  it("names a period inside one month by that month", () => {
    expect(dominantMonth(d(2026, 7, 3), d(2026, 7, 30)).getUTCMonth()).toBe(7);
  });

  it("crosses a year boundary without losing the year", () => {
    const m = dominantMonth(d(2025, 11, 1), d(2026, 0, 4));
    expect(m.getUTCMonth()).toBe(11);
    expect(m.getUTCFullYear()).toBe(2025);
  });

  it("gives an exact split to the month it began in", () => {
    expect(dominantMonth(d(2026, 3, 16), d(2026, 4, 15)).getUTCMonth()).toBe(3);
  });
});
