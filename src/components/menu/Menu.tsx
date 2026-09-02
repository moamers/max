"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Row } from "@/components/ui/Row";
import { BottomNav, navClearance } from "@/components/nav/BottomNav";
import { ThemeControls } from "@/components/theme/ThemeControls";
import { Wordmark } from "@/components/brand/Counterbalance";
import type { ModeChoice, ThemeId } from "@/lib/brand";
import { clearDataAction } from "./actions";

interface SettingsScreenProps {
  periodCount: number;
  /** The stored brand preference, read on the server so the switch renders selected. */
  brand: { theme: ThemeId; mode: ModeChoice };
  /** Carried through so the nav's Week and Month lead back to the month the user left. */
  periodId: number | null;
  /** The live week of that period — see `currentWeekOf`. */
  weekNumber: number;
}

/**
 * README screen 10, as a screen — Task F.
 *
 * It was a 296px left drawer over a scrim, opened by a hamburger on home. The
 * founder's instruction is that Settings is a navigation destination, so the
 * drawer, the scrim and the hamburger are all gone and this is `/settings`.
 * Every control the drawer carried came with it unchanged, including **Clear
 * data**, which keeps exactly the two-step confirmation it had: nothing is
 * deleted by the press that reveals the confirmation.
 *
 * The file keeps its path. `clearDataAction` lives beside it and the route
 * that renders it is what names the screen; moving both directories would be
 * churn a reviewer has to read past.
 *
 * Same fixed frame as home, for the same reason: a full-height frame with one
 * inner scrolling region, so the pill can hover over content that scrolls
 * beneath it.
 */
export function SettingsScreen({ periodCount, brand, periodId, weekNumber }: SettingsScreenProps) {
  const router = useRouter();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  async function clearData() {
    setClearing(true);
    setClearError(null);
    try {
      await clearDataAction();
      // Bare `/`, deliberately: there is no period left to name. Every other
      // navigation in the app carries one because dropping it changes which
      // month you land in; here there are no months.
      router.replace("/");
      router.refresh();
    } catch {
      setClearError("I couldn’t confirm whether that finished. Refresh to check.");
      setClearing(false);
    }
  }

  return (
    <div data-fold-screen="" style={{ position: "fixed", inset: 0, background: "var(--bg)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      <div data-fold-body="" style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            // Clearance on the scroller, not the page — see HomeScreen.
            padding: `22px 20px ${navClearance(26)}`,
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          <Wordmark size={26} idSuffix="settings" />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <Link href="/goals" style={{ color: "inherit", textDecoration: "none" }}>
              <Row interactive divider padding="16px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--type-body)", fontWeight: 600, letterSpacing: "-0.015em" }}>Manage budget goals</span>
                <span style={{ fontSize: "var(--type-body)", color: "var(--text-disabled)" }} aria-hidden>
                  &rsaquo;
                </span>
              </Row>
            </Link>

            <Row divider padding="16px 0" style={{ alignItems: "stretch" }}>
              <ThemeControls theme={brand.theme} mode={brand.mode} />
            </Row>

            <Link href="/import" style={{ color: "inherit", textDecoration: "none" }}>
              <Row interactive divider padding="16px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--type-body)", fontWeight: 600, letterSpacing: "-0.015em" }}>Import a file</span>
                <span style={{ fontSize: "var(--type-body)", color: "var(--text-disabled)" }} aria-hidden>
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
                <span style={{ fontSize: "var(--type-body)", fontWeight: 600, letterSpacing: "-0.015em" }}>Export your data</span>
                <span style={{ fontSize: "var(--type-body)", color: "var(--text-disabled)" }} aria-hidden>
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
                  <span style={{ fontSize: "var(--type-body)", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--bar-over)" }}>Clear data</span>
                  <span style={{ fontSize: "var(--type-body)", color: "var(--text-disabled)" }} aria-hidden>
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
                  <span style={{ fontSize: "var(--type-body)", fontWeight: 700, color: "var(--bar-over)" }}>Clear data?</span>
                  <span style={{ fontSize: "var(--type-caption)", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                    This removes {periodCount} {periodCount === 1 ? "period" : "periods"} and every transaction in {periodCount === 1 ? "it" : "them"}. Your account, goals and default income stay.
                  </span>
                </div>
                {clearError && (
                  <span role="alert" style={{ fontSize: "var(--type-caption)", lineHeight: 1.45, color: "var(--bar-over)" }}>
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

      <BottomNav active="settings" periodId={periodId} weekNumber={weekNumber} />
    </div>
  );
}
