"use client";

import Link from "next/link";
import { Row } from "@/components/ui/Row";
import { Scrim } from "@/components/ui/Scrim";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MaxMark } from "@/components/home/MaxMark";

interface MenuProps {
  onDismiss: () => void;
}

/**
 * README screen 10: a 296px left drawer over a scrim. Not built on the
 * `Sheet` primitive — Sheet only has "full" (covers the frame) and
 * "bottom" (anchored to the bottom) variants; a left-anchored, width-capped
 * drawer is a third shape it doesn't offer, so this composes `Scrim`
 * directly the same way `Sheet`'s bottom variant does internally.
 */
export function Menu({ onDismiss }: MenuProps) {
  return (
    <div style={{ position: "absolute", top: 46, left: 0, right: 0, bottom: 0, zIndex: 6 }}>
      <Scrim onDismiss={onDismiss} />
      <div
        style={{
          position: "absolute",
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
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <MaxMark size={26} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.03em" }}>Max</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <Link href="/goals" style={{ color: "inherit", textDecoration: "none" }}>
            <Row interactive divider padding="16px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" }}>Manage budget goals</span>
              <span style={{ fontSize: 17, color: "var(--text-disabled)" }} aria-hidden>
                &rsaquo;
              </span>
            </Row>
          </Link>

          <Row divider padding="14px 0" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em" }}>Appearance</span>
            <ThemeToggle />
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

          {/*
            The prototype's own "Clear data" row just closes the menu (onClick={{back}})
            — there is no clear-data mutation anywhere in the query/store layer to call,
            so this matches the prototype's actual behaviour rather than inventing one.
          */}
          <Row
            interactive
            divider
            padding="16px 0"
            onClick={onDismiss}
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
        </div>
      </div>
    </div>
  );
}
