"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** R-19: deleting your own data must not require a database console. */
export function DeletePeriodButton({ periodId, label }: { periodId: number; label: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/periods/${periodId}`, { method: "DELETE" });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm underline underline-offset-2"
        style={{ color: "var(--text-muted)" }}
      >
        Remove this period
      </button>
    );
  }

  return (
    <span className="text-sm flex items-center gap-3 flex-wrap">
      <span style={{ color: "var(--text-secondary)" }}>Remove “{label}” and everything in it?</span>
      <button
        onClick={remove}
        disabled={busy}
        className="rounded-md px-3 py-1 text-white"
        style={{ background: "var(--critical)" }}
      >
        {busy ? "Removing…" : "Yes, remove"}
      </button>
      <button onClick={() => setConfirming(false)} style={{ color: "var(--text-muted)" }}>
        Keep it
      </button>
    </span>
  );
}
