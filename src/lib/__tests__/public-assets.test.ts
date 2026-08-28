/**
 * The home-screen icon must be fetchable without a session.
 *
 * `apple-icon` and `icon` are generated routes with NO file extension, so the
 * matcher's "anything ending in .png" exemption does not reach them. Left
 * inside the auth matcher, the phone asks for the icon, gets a 307 to /login,
 * and quietly falls back to a plain letter tile — indistinguishable from having
 * no icon configured at all, which is how the first attempt at this shipped.
 *
 * The manifest has the same problem for the same reason.
 */
import { describe, it, expect } from "vitest";
import { config } from "../../proxy";

/** The matcher as Next applies it: one regex against the pathname. */
const matcher = new RegExp(`^${config.matcher[0]}$`);

const runsAuth = (pathname: string) => matcher.test(pathname);

describe("icons and the manifest are reachable signed out", () => {
  it.each(["/apple-icon", "/icon", "/manifest.webmanifest", "/favicon.ico"])(
    "%s skips the auth redirect",
    (pathname) => {
      expect(runsAuth(pathname)).toBe(false);
    }
  );
});

describe("nothing else was let through by accident", () => {
  it.each(["/", "/goals", "/income", "/week/2", "/recurring", "/one-offs", "/add", "/year"])(
    "%s is still behind auth",
    (pathname) => {
      expect(runsAuth(pathname)).toBe(true);
    }
  );

  it("a path that merely starts with icon is not exempt", () => {
    // The exemptions are anchored, so this cannot become a way in.
    expect(runsAuth("/icons-are-fun")).toBe(true);
    expect(runsAuth("/apple-icon-secrets")).toBe(true);
  });

  it("the API is still matched", () => {
    expect(runsAuth("/api/periods")).toBe(true);
  });
});
