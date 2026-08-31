"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Deliberately undesigned: semantic HTML and the existing CSS variables only.
 * The design system lands separately and will restyle this — nothing here
 * should be worth defending.
 */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);

    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "Could not sign in. Try again.");
      setPending(false);
      return;
    }

    router.push(safeNextPath());
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="border rounded-md px-3 py-2"
          style={{ borderColor: "var(--hairline-4)", background: "var(--surface)", color: "var(--text-primary)" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border rounded-md px-3 py-2"
          style={{ borderColor: "var(--hairline-4)", background: "var(--surface)", color: "var(--text-primary)" }}
        />
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--bar-over)" }}>
          {error}
        </p>
      )}

      {/*
        The real Button primitive rather than a hand-rolled one: it is the only
        thing that knows the ink that reads on the theme's primary fill, and it
        carries the outline butter-static needs (a pale lilac fill on butter is
        2.15:1 on its own). This screen used to paint white text on an
        undefined token.
      */}
      <Button type="submit" height={54} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p style={{ color: "var(--text-secondary)" }}>
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </form>
  );
}

/**
 * Only ever a path on this app. An absolute URL or a protocol-relative `//host`
 * would turn the post-login hop into an open redirect.
 */
function safeNextPath(): string {
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
