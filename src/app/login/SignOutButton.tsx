"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-md px-4 py-2 font-medium text-white"
      style={{ background: "var(--series-bills)" }}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        router.refresh();
        router.push("/login");
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
