"use client";

import { useState } from "react";
import { Bar } from "@/components/ui/Bar";
import { Checkbox } from "@/components/ui/Checkbox";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FAB } from "@/components/ui/FAB";
import { IconButton } from "@/components/ui/IconButton";
import { Chip, Pill } from "@/components/ui/Chip";
import { NumericField } from "@/components/ui/NumericField";
import { Row } from "@/components/ui/Row";
import { Accordion, Caret } from "@/components/ui/Accordion";
import { Scrim } from "@/components/ui/Scrim";
import { Sheet } from "@/components/ui/Sheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BackArrowIcon, ChevronDownIcon, HamburgerIcon } from "@/components/ui/icons";
import { BottomNav, navClearance, type NavDestination } from "@/components/nav/BottomNav";
import { ThemeControls } from "@/components/theme/ThemeControls";
import { Wordmark } from "@/components/brand/Counterbalance";
import type { ModeChoice, ThemeId } from "@/lib/brand";

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h2 style={{ fontSize: "var(--type-title)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>{title}</h2>
        {note && (
          <p style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)", margin: 0 }}>
            {note}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `var(${varName})`,
          border: "1px solid var(--hairline-3)",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "var(--type-caption)", fontWeight: 600 }}>{name}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-micro)", color: "var(--text-tertiary)" }}>{varName}</span>
      </div>
    </div>
  );
}

export function StyleguideView({ brand }: { brand: { theme: ThemeId; mode: ModeChoice } }) {
  const [hero, setHero] = useState<"today" | "forecast">("forecast");
  const [txnState, setTxnState] = useState<"final" | "pending">("final");
  const [weeksOpen, setWeeksOpen] = useState(true);
  const [checkboxOn, setCheckboxOn] = useState(true);
  const [catOpen, setCatOpen] = useState<string | null>("everyday");
  const [amount, setAmount] = useState<number | null>(190);
  const [scrimVisible, setScrimVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [navActive, setNavActive] = useState<NavDestination>("month");

  const categories = [
    { key: "everyday", name: "Everyday", spend: 176, budget: 190 },
    { key: "weekend", name: "Weekend", spend: 212, budget: 150 },
    { key: "transport", name: "Transport", spend: 63, budget: 80 },
  ];

  return (
    // Unlike the product screens this page is an ordinary document scroll, so
    // its clearance is page padding rather than a scroller's. Was a flat
    // 120px, which the pill plus a home indicator would have eaten.
    <div style={{ maxWidth: 860, margin: "0 auto", padding: `40px 24px ${navClearance(40)}`, display: "flex", flexDirection: "column", gap: 44 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ fontSize: "var(--type-display)", fontWeight: 800, letterSpacing: "-0.035em", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Wordmark size={30} idSuffix="styleguide" /> <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>styleguide</span>
          </h1>
          <p style={{ fontSize: "var(--type-body)", color: "var(--text-secondary)", margin: 0, maxWidth: 520 }}>
            Every primitive from src/components/ui, in every documented state. Development surface only — not a
            product screen.
          </p>
        </div>
        <ThemeControls theme={brand.theme} mode={brand.mode} />
      </header>

      {/* ---------------------------------------------------------- Tokens */}
      <Section title="Palette" note="semantic roles — same names, both themes">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
          <Swatch name="Background" varName="--bg" />
          <Swatch name="Surface" varName="--surface" />
          <Swatch name="Inset surface" varName="--surface-inset" />
          <Swatch name="Raised surface" varName="--surface-raised" />
          <Swatch name="Text primary" varName="--text-primary" />
          <Swatch name="Text secondary" varName="--text-secondary" />
          <Swatch name="Text tertiary" varName="--text-tertiary" />
          <Swatch name="Lime fill" varName="--lime-fill" />
          <Swatch name="Lime ink" varName="--lime-ink" />
          <Swatch name="Bar fill (spend)" varName="--bar-fill" />
          <Swatch name="Over budget" varName="--bar-over" />
          <Swatch name="Pending (amber)" varName="--amber-ink" />
          <Swatch name="Label (cyan)" varName="--cyan-ink" />
        </div>
      </Section>

      {/* ------------------------------------------------------ Typography */}
      <Section
        title="Typography"
        note="Newsreader (the one large figure per screen) + Libre Franklin (everything else). No monospace — tabular-nums aligns."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(
            [
              ["figure", "44", "£703", { fontFamily: "var(--font-figure), Georgia, serif", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }],
              ["display", "34", "£62 over", { fontWeight: 700, letterSpacing: "-0.035em" }],
              ["heading", "26", "£1,397 spent", { fontWeight: 700, letterSpacing: "-0.03em" }],
              ["title", "20", "August", { fontWeight: 700, letterSpacing: "-0.02em" }],
              ["body", "16", "Body copy, inputs, the text a sentence is set in.", { fontWeight: 400 }],
              ["label", "14", "Controls, chips, navigation", { fontWeight: 600 }],
              ["caption", "12", "Captions and secondary labels", { fontWeight: 400, color: "var(--text-secondary)" }],
              ["micro", "10", "DENSE METADATA", { fontWeight: 600, letterSpacing: "0.12em", color: "var(--text-tertiary)" }],
            ] as const
          ).map(([name, px, sample, style]) => (
            <div key={name} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span
                style={{
                  fontSize: "var(--type-micro)",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  width: 78,
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {name} · {px}
              </span>
              <span style={{ fontSize: `var(--type-${name})`, ...style }}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- Statuses */}
      <Section
        title="Status — settled · pending · review · over"
        note="mapped by meaning, not by neighbouring hues. The dot and the leading rule carry the ordering structurally, so it holds where a hue is visually softer."
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatusPill status="settled">4 bills settled</StatusPill>
          <StatusPill status="pending">2 pending</StatusPill>
          <StatusPill status="review">1 needs a look</StatusPill>
          <StatusPill status="over">Over target</StatusPill>
        </div>
      </Section>

      {/* ------------------------------------------------------- Checkbox */}
      <Section title="Checkbox" note="used by the create-a-month copy control">
        <Checkbox checked={checkboxOn} onChange={setCheckboxOn} label="Copy recurring from last month" />
      </Section>

      {/* ----------------------------------------------------------- Bar */}
      <Section title="Bar — the one chart grammar" note="track = budget · fill = spend (grey) · over = whole fill red at 100% width">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>Under budget · size=&quot;week&quot; (3px) · £140 of £190</span>
            <Bar spend={140} budget={190} size="week" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>At budget · size=&quot;category&quot; (8px) · £190 of £190</span>
            <Bar spend={190} budget={190} size="category" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>Over budget · size=&quot;total&quot; (12px) · £252 of £190 (£62 over)</span>
            <Bar spend={252} budget={190} size="total" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>Zero spend · empty track</span>
            <Bar spend={0} budget={190} size="category" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>Strong over variant (strong)</span>
            <Bar spend={340} budget={190} size="category" strong />
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------- Cards */}
      <Section title="Card" note="sm (20px) / lg (22px) / hero (26px) radius">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Card size="sm">
            <span style={{ fontSize: "var(--type-label)", fontWeight: 600 }}>Nested card</span>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>radius 20px</span>
          </Card>
          <Card size="lg" interactive>
            <span style={{ fontSize: "var(--type-label)", fontWeight: 600 }}>Interactive card</span>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--text-secondary)" }}>hover lifts a surface step</span>
          </Card>
          <Card size="hero" style={{ background: "var(--hero-gradient)", color: "var(--hero-ink-1)" }}>
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--hero-ink-3)" }}>
              Forecast · spare on 31 Aug
            </span>
            <span style={{ fontFamily: "var(--font-figure), Georgia, serif", fontSize: "var(--type-figure)", fontWeight: 400, letterSpacing: "-0.015em" }}>£307</span>
          </Card>
        </div>
      </Section>

      {/* ------------------------------------------------------- Buttons */}
      <Section title="Button, IconButton, FAB">
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 340 }}>
          <Button variant="primary">Continue</Button>
          <Button variant="secondary">Choose a different file</Button>
          <Button variant="destructive">Delete</Button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
          <IconButton size="sm" icon={<HamburgerIcon />} aria-label="Menu" />
          <IconButton size="md" icon={<ChevronDownIcon />} aria-label="Expand" />
          <IconButton size="lg" outline icon={<BackArrowIcon />} aria-label="Back" />
          <FAB aria-label="Add" />
        </div>
      </Section>

      {/* --------------------------------------------------- Bottom nav */}
      <Section
        title="Bottom navigation"
        note="a shortcut pill, not a tab bar — fixed to the bottom of this page so the glass has something to blur"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
          <p style={{ fontSize: "var(--type-label)", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            The current item is a filled capsule at the heavier weight, and carries aria-current=&quot;page&quot;.
            Switch it here to see both states; the links are real, so following one leaves the styleguide.
          </p>
          <SegmentedControl
            value={navActive}
            onChange={setNavActive}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
              { value: "settings", label: "Settings" },
            ]}
          />
        </div>
        {/* The real component, in the position it actually occupies. A
            non-fixed replica would be a parallel version of the thing it is
            documenting, and would show the glass over nothing. */}
        <BottomNav active={navActive} periodId={1} weekNumber={1} />
      </Section>

      {/* --------------------------------------------------- Segmented */}
      <Section title="SegmentedControl">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "var(--type-caption)", width: 140 }}>Today | End of month</span>
            <SegmentedControl
              value={hero}
              onChange={setHero}
              options={[
                { value: "today", label: "Today" },
                { value: "forecast", label: "End of month" },
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "var(--type-caption)", width: 140 }}>Final | Pending</span>
            <SegmentedControl
              value={txnState}
              onChange={setTxnState}
              options={[
                { value: "final", label: "Final" },
                { value: "pending", label: "Pending", activeColor: "var(--amber-ink)" },
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: "var(--type-caption)", width: 140 }}>Theme &amp; appearance</span>
            <ThemeControls theme={brand.theme} mode={brand.mode} />
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------- Chips */}
      <Section title="Chip / Pill">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip tone="quiet">spreadsheet</Chip>
            <Chip tone="quiet">screenshot</Chip>
            <Chip tone="quiet" selected>
              statement
            </Chip>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip tone="cyan">dxb-26</Chip>
            <Chip tone="cyan">home-improvements</Chip>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone="lime">now</Pill>
            <Pill tone="cyan" uppercase>
              set by you
            </Pill>
            <Pill tone="amber" uppercase>
              pending
            </Pill>
            <Pill tone="neutral">of £190</Pill>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------- NumericField */}
      <Section title="NumericField" note="£ prefix, right-aligned, digits only, clamped 0–99,999">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--surface)", borderRadius: 16, padding: "14px 16px" }}>
            <span style={{ fontSize: "var(--type-body)", fontWeight: 600 }}>Everyday</span>
            <NumericField value={amount} onChange={setAmount} label="Everyday weekly budget" />
          </div>
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
            value = {amount} (try typing letters or a number over 99,999 — it clamps)
          </span>
        </div>
      </Section>

      {/* --------------------------------------------------- Row/Accordion */}
      <Section title="Row & Accordion" note="single-open accordion for week categories; simple show/hide for the Weeks section">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
          <div>
            <Row
              interactive
              onClick={() => setWeeksOpen((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--type-body)", fontWeight: 600 }}>
                <Caret open={weeksOpen} /> Weeks
              </span>
              <span style={{ fontSize: "var(--type-label)", color: "var(--lime-ink)", fontWeight: 700 }}>£703 left</span>
            </Row>
            {weeksOpen && (
              <Row divider>
                <span style={{ fontSize: "var(--type-label)", fontWeight: 500 }}>4 – 10 Aug</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "var(--type-caption)", color: "var(--text-tertiary)" }}>
                  of £420 · £396 spent
                </span>
              </Row>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categories.map((c) => (
              <Accordion
                key={c.key}
                open={catOpen === c.key}
                onToggle={() => setCatOpen((cur) => (cur === c.key ? null : c.key))}
                header={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: "var(--type-body)", fontWeight: 600 }}>{c.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "var(--type-label)", fontWeight: 700, color: c.spend > c.budget ? "var(--bar-over)" : "var(--lime-ink)" }}>
                        {c.spend > c.budget ? `£${c.spend - c.budget} over` : `£${c.budget - c.spend} left`}
                      </span>
                      <Caret open={catOpen === c.key} />
                    </span>
                  </div>
                }
              >
                <Bar spend={c.spend} budget={c.budget} size="category" />
                <div style={{ paddingTop: 12, fontSize: "var(--type-label)", color: "var(--text-secondary)" }}>
                  Transactions for {c.name.toLowerCase()} would list here.
                </div>
              </Accordion>
            ))}
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- Scrim/Sheet */}
      <Section title="Scrim & Sheet" note="sheetUp: translateY(26px) + fade, 0.26s cubic-bezier(0.22,0.9,0.3,1)">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="secondary" style={{ width: "auto", padding: "0 20px" }} onClick={() => setScrimVisible((v) => !v)}>
            Toggle scrim demo
          </Button>
          <Button variant="secondary" style={{ width: "auto", padding: "0 20px" }} onClick={() => setSheetOpen(true)}>
            Open full sheet
          </Button>
          <Button variant="secondary" style={{ width: "auto", padding: "0 20px" }} onClick={() => setBottomSheetOpen(true)}>
            Open bottom sheet
          </Button>
        </div>

        {scrimVisible && (
          <div style={{ position: "relative", height: 120, borderRadius: 16, overflow: "hidden", background: "var(--surface)" }}>
            <Scrim onDismiss={() => setScrimVisible(false)} style={{ position: "absolute" }} />
          </div>
        )}

        {sheetOpen && (
          <div style={{ position: "relative", height: 320, borderRadius: 20, overflow: "hidden", background: "var(--surface-inset)" }}>
            <Sheet variant="full" onBack={() => setSheetOpen(false)}>
              <div style={{ padding: "8px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ fontSize: "var(--type-title)", fontWeight: 800, margin: 0 }}>Full sheet</h3>
                <p style={{ fontSize: "var(--type-body)", color: "var(--text-secondary)", margin: 0 }}>
                  Covers the whole frame below the 46px status bar, with a circular back button.
                </p>
              </div>
            </Sheet>
          </div>
        )}

        {bottomSheetOpen && (
          <div style={{ position: "relative", height: 320, borderRadius: 20, overflow: "hidden", background: "var(--surface-inset)" }}>
            <Sheet variant="bottom" onDismiss={() => setBottomSheetOpen(false)}>
              <h3 style={{ fontSize: "var(--type-title)", fontWeight: 800, margin: 0 }}>Bottom sheet</h3>
              <p style={{ fontSize: "var(--type-body)", color: "var(--text-secondary)", margin: 0 }}>
                Rounded top corners only, anchored to the bottom, scrim behind it.
              </p>
              <Button variant="primary" onClick={() => setBottomSheetOpen(false)}>
                Done
              </Button>
            </Sheet>
          </div>
        )}
      </Section>
    </div>
  );
}
