import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/**
 * Route protection and CORS.
 *
 * The check here is deliberately *optimistic*: it only asks whether a session
 * cookie is present. Next's own guidance is that Proxy is not a session
 * management or authorization layer — it runs ahead of the app, on every
 * matched request, and doing a database read here would put a query on the
 * critical path of every asset request.
 *
 * The authoritative check is `getSessionUser()` / `requireUser()` inside each
 * page and route handler, which validates the token against the `sessions`
 * table and its expiry. This layer exists to turn "no cookie at all" into a
 * clean redirect or 401 instead of a render that fails later, and to stop
 * unauthenticated traffic reaching the app at all.
 *
 * Forging the cookie gets an attacker exactly as far as the next line of code.
 */

/** Paths reachable without a session. Everything else is closed by default. */
const PUBLIC_PAGES = new Set(["/login", "/signup"]);
const PUBLIC_API = new Set(["/api/auth/login", "/api/auth/signup", "/api/auth/logout"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // CSRF: SameSite=Lax already blocks the cross-site POST, but a same-site
  // cookie is still attached to a cross-*origin* form submission from a
  // different scheme/port. Any state-changing request that carries our cookie
  // must therefore come from our own origin. Requests with no cookie can't do
  // anything authenticated anyway and are left to the auth check below.
  if (hasSession && !isSafeMethod(req.method) && !isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const isPublic = isApi ? PUBLIC_API.has(pathname) : PUBLIC_PAGES.has(pathname);

  if (!isPublic && !hasSession) {
    if (isApi) {
      return NextResponse.json(
        { error: "Not signed in" },
        { status: 401, headers: corsHeaders() }
      );
    }
    const loginUrl = new URL("/login", req.url);
    // Come back to where they were headed once they're in. Only ever a path on
    // this app — never an absolute URL, which would make this an open redirect.
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  if (isApi) {
    for (const [key, value] of Object.entries(corsHeaders())) {
      res.headers.set(key, value);
    }
  }
  return res;
}

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  // Non-browser clients (curl, the native app) send no Origin. They also can't
  // be driven by a hostile page, which is the threat this check addresses.
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/**
 * Wildcard CORS is retained for the parked Expo client. It grants no
 * credentialed access — browsers refuse to send cookies to a `*` origin — so it
 * cannot be used to read a signed-in user's data. Once the native app has a
 * real, stable origin and a token-based auth story, pin this to it.
 */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = {
  // Everything except Next's own static output and file-looking requests.
  // Without this the auth redirect would also swallow CSS and images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
