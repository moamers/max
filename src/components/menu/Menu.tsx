"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Row } from "@/components/ui/Row";
import { Scrim } from "@/components/ui/Scrim";
import { ThemeControls } from "@/components/theme/ThemeControls";
import { Wordmark } from "@/components/brand/Counterbalance";
import type { ModeChoice, ThemeId } from "@/lib/brand";
import { clearDataAction } from "./actions";

interface MenuProps {
  periodCount: number;
  /** The stored brand preference, read on the server so the switch renders selected. */
  brand: { theme: ThemeId; mode: ModeChoice };
  onDismiss: () => void;
}

/**
 * README screen 10: a 296px left drawer over a scrim. Not built on the
 * `Sheet` primitive — Sheet only has "full" (covers the frame) and
 * "bottom" (anchored to the bottom) variants; a left-anchored, width-capped
 * drawer is a third shape it doesn't offer, so this composes `Scrim`
 * directly the same way `Sheet`'s bottom variant does internally.
 */
export function Menu({ periodCount, brand, onDismiss }: MenuProps) {
  const router = useRouter();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  async function clearData() {
    setClearing(true);
    setClearError(null);
    try {
      await clearDataAction();
      onDismiss();
      router.replace("/");
      router.refresh();
    } catch {
      setClearError("I couldn’t confirm whether that finished. Refresh to check.");
      setClearing(false);
    }
  }

  return (
    <div style={{ position: "absolute", top: 46, left: 0, right: 0, bottom: 0, zIndex: 6 }}>
      <Scrim onDismiss={onDismiss} />
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: 0,
          left: 0,
          bottom: 0,
          width: 296,
          background: "var(--surface)",
          borderRight: "1px solid var(--hairline-3)",
          padding: "22px 20px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          animation: "fadeUp var(--duration-fade) ease both",
        }}
      >
        <Wordmark size={26} idSuffix="menu" />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href="/goals" style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider padding="16px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" }}>Manage budget goals</span>
              <span style={{ fontSize: 17, color: "var(--text-disabled)" }} aria-hidden>
                &rsaquo;
              </span>
            </Row>
          </Link>

          <Row divider padding="16px 0" style={{ alignItems: "stretch" }}>
            <ThemeControls theme={brand.theme} mode={brand.mode} />
          </Row>

          <Link href="/import" style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider padding="16px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" }}>Import a file</span>
              <span style={{ fontSize: 17, color: "var(--text-disabled)" }} aria-hidden>
                &rsaquo;
              </span>
            </Row>
          </Link>

          {/*
            Export was built behind /api/export but had no way in, because the
            agent that wrote it did not own this file. A feature nobody can
            reach is not shipped.
          */}
          <Link href="/api/export" style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider padding="16px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" }}>Export your data</span>
              <span style={{ fontSize: 17, color: "var(--text-disabled)" }} aria-hidden>
                &rsaquo;
              </span>
            </Row>
          </Link>

          {!confirmingClear ? (
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              style={{ padding: 0, border: 0, background: "none", color: "inherit", textAlign: "left" }}
            >
              <Row
                interactive
                divider
                padding="16px 0"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--hairline-2)",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--bar-over)" }}>Clear data</span>
                <span style={{ fontSize: 17, color: "var(--text-disabled)" }} aria-hidden>
                  &rsaquo;
                </span>
              </Row>
            </button>
          ) : (
            <div
              role="group"
              aria-label="Confirm clearing data"
              style={{
                padding: "18px 0",
                borderBottom: "1px solid var(--hairline-2)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--bar-over)" }}>Clear data?</span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                  This removes {periodCount} {periodCount === 1 ? "period" : "periods"} and every transaction in {periodCount === 1 ? "it" : "them"}. Your account, goals and default income stay.
                </span>
              </div>
              {clearError && (
                <span role="alert" style={{ fontSize: 12, lineHeight: 1.45, color: "var(--bar-over)" }}>
                  {clearError}
                </span>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Button variant="destructive" height={54} disabled={clearing} onClick={() => void clearData()}>
                  {clearing ? "Clearing…" : "Yes, clear everything"}
                </Button>
                <Button variant="secondary" height={54} disabled={clearing} onClick={() => setConfirmingClear(false)}>
                  Keep my data
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
