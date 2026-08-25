"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FAB } from "@/components/ui/FAB";
import { Sheet } from "@/components/ui/Sheet";

interface MoneySheetProps {
  addHref: string;
  children: ReactNode;
}

/** Shared fixed frame for screens 05 and 06. */
export function MoneySheet({ addHref, children }: MoneySheetProps) {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        maxWidth: 480,
        margin: "0 auto",
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      <Sheet variant="full" onBack={() => router.back()}>
        {children}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "14px 20px 22px",
            background: "linear-gradient(to top, var(--bg) 62%, transparent)",
            display: "flex",
            justifyContent: "flex-end",
            pointerEvents: "none",
          }}
        >
          <FAB style={{ pointerEvents: "auto" }} onClick={() => router.push(addHref)} />
        </div>
      </Sheet>
    </div>
  );
}
