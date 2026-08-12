import { NextRequest, NextResponse } from "next/server";

/**
 * Permissive CORS for all /api/* routes. The Expo Go tunnel domain is
 * unpredictable and regenerates per dev session, so we don't allowlist
 * specific origins yet — this is a single-user, pre-auth app with no
 * multi-tenant boundary to protect. Tighten this once Supabase Auth is
 * in place and there's a real origin (the deployed mobile/web app) to pin to.
 */
export function proxy(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders())) {
    res.headers.set(key, value);
  }
  return res;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = {
  matcher: "/api/:path*",
};
