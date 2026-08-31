"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Mirrors MIN_PASSWORD_LENGTH in src/lib/auth.ts. Duplicated rather than
// imported because auth.ts pulls in node:crypto and must never reach a client
// bundle; the server is the authority and re-checks this on every request.
const MIN_PASSWORD_LENGTH = 10;

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);

    if (!res || !res.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? "Could not create the account. Try again.");
      setPending(false);
      return;
    }

    router.push("/");
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
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className="border rounded-md px-3 py-2"
          style={{ borderColor: "var(--hairline-4)", background: "var(--surface)", color: "var(--text-primary)" }}
        />
        <small style={{ color: "var(--text-secondary)" }}>
          At least {MIN_PASSWORD_LENGTH} characters.
        </small>
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
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p style={{ color: "var(--text-secondary)" }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
