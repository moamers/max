# Handoff: Max — personal budget app (dark + light)

## Overview
Max is a mobile budget app for a household that has outgrown a spreadsheet. It imports an existing
sheet/statement, then answers one question on the home screen — *where do I stand this month* — and
lets the user drill down: weeks → a week → a single transaction, plus recurring bills, one-off spend,
a year round-up, budget goals, and income month by month.

Two complete visual modes are included: **dark** (`Max App v1.dc.html`) and **light**
(`Max App v1 Light.dc.html`). They are the same information architecture and the same layout — only
the palette differs. Build one component tree with two themes.

## About the design files
The files in this bundle are **design references written in HTML** — prototypes showing intended
look, hierarchy and behaviour. They are **not production code to copy**. The task is to recreate
these screens inside the target codebase using its existing environment, patterns and component
library (React/Vue/SwiftUI/native). If no environment exists yet, pick the most appropriate stack
for the product and implement the designs there.

Each file is a self-contained prototype: a left-hand rail lists the screens ("states"), and the phone
frame on the right renders the selected screen. The rail, the notes under each screen and the colour
legend are **presentation scaffolding for review — not part of the product.** Build only what is
inside the phone frame.

## Fidelity
**High fidelity.** Colours, type sizes, weights, spacing, radii and interaction states are final and
should be matched closely. Copy is final. The data shown is realistic sample data (August 2026) and
should be replaced with real data bindings.

---

## Design tokens

### Palette — dark mode
| Role | Hex |
| --- | --- |
| App background | `#0E0F14` |
| Card surface | `#14171C` |
| Inset / field surface | `#191C23`, deepest `#0E1015` |
| Raised / hover surface | `#1C1F27`, `#1A1D24`, `#1F232B` |
| Hairline | `#16191F`, `#1E212A`, `#23262F`, `#262A33` |
| Text primary | `#F2F4EE` |
| Text secondary | `#9DA2AE` / `#8B8F9C` |
| Text tertiary / mono meta | `#6E7382` |
| Text disabled | `#4A4F5A`, `#5B6270` |
| Accent (brand lime) | `#C6FF3D`, hover `#D4FF5F`, ink on lime `#12210A` |
| Bar fill (spent) | `#7A8296` |
| Over budget (red) | `#E8736F` (strong variant `#FF5A5F`) |
| Pending (amber) | `#F0C64B`, tint bg `#1E1A0C` |
| Label / tag (cyan) | `#4DE0FF`, tint bg `#0F1D24` |
| Positive tile border | `#2B3417`; negative `#3A2224` |
| Hero gradient | `linear-gradient(140deg,#C6FF3D,#4DE0FF)`, ink `#0F2118` / `#123028` / `#1E3A16` |

### Palette — light mode
Same roles, mapped 1:1 (this is the exact mapping used in the light file):

| Dark | Light |
| --- | --- |
| `#0E0F14` bg | `#F6F6F2` |
| `#14171C` card | `#FFFFFF` |
| `#191C23` inset | `#F0F0EA` (deepest `#EAEBE4`) |
| `#1C1F27` / `#1A1D24` hover | `#EDEDE7` / `#F2F2ED` |
| `#16191F` → `#262A33` hairlines | `#E7E7E0` → `#D7D7CD` |
| `#F2F4EE` text primary | `#15150F` |
| `#9DA2AE` / `#8B8F9C` secondary | `#5C5C55` |
| `#6E7382` tertiary | `#6C6C64` |
| `#4A4F5A` disabled | `#9B9B92` |
| `#7A8296` bar fill | `#8A8A80` |
| `#E8736F` red | `#B93A34` (strong `#D0332F`) |
| `#F0C64B` amber (as ink) | `#8A5E00`; tint bg `#FAF0D0` |
| `#4DE0FF` cyan (as ink) | `#0A7391`; tint bg `#DFF1F7` |
| `#C6FF3D` lime **as ink** | `#3F6B0A` |
| `#C6FF3D` lime **as fill** | unchanged `#C6FF3D` (ink on it stays `#12210A`) |
| tile borders `#2B3417` / `#3A2224` | `#BFD98A` / `#F2D8D7` |

**Rule:** the lime accent stays saturated when it is a *fill* (buttons, pills, the hero gradient) and
darkens to `#3F6B0A` when it is *ink* (the "£703 left" numbers, links, mono accents). Shadows in
light mode: `0 10px 24px rgba(30,32,24,0.18)`; scrim `rgba(40,42,34,0.32)` (dark mode
`rgba(8,9,12,0.72)`).

### Typography
- UI face: a geometric grotesque — the prototype uses **Manrope** (fallback system sans). Weights 400/500/600/700/800.
- Numeric / meta face: **JetBrains Mono**, 9.5–12px, letter-spacing 0.06–0.16em, frequently uppercase.
- Scale in use: 52px/800 hero number · 36px/800 week-sheet headline · 30–34px/800 sheet titles ·
  25–27px/800 section "left" numbers · 21–22px/700 field values · 19px/800 month title ·
  16–17px/600–700 row titles · 15px/500 body rows · 13px chips · 10–12px mono meta.
- Letter-spacing tightens as size grows: −0.045em at 52px, −0.035em at 25–30px, −0.02em at 15–17px.
- Line-height: 0.94–1.08 for display numbers/titles, 1.5–1.6 for body copy. Body copy uses `text-wrap: pretty`, headlines `text-wrap: balance`.

### Spacing, radii, motion
- Spacing steps: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 26 px. Screen gutter **20px**; card padding 16–20px; sheets pad 16px 20px 30px.
- Layout is flex/grid with `gap` throughout — never margin-spaced siblings.
- Radii: 8–9px chips · 11–14px fields · 16px rows · 18–22px cards · 26px hero · 30px sheet top · 99px pills/buttons.
- Buttons: full-width pill, height 54–56px, lime fill, ink `#12210A`, 16–17px/700; hover `#D4FF5F`. Secondary = 1px hairline border, no fill.
- Icon buttons: 34–38px circle on card surface; FAB 52–54px lime circle, bottom right, 20px inset.
- Animations: `sheetUp` 0.26s cubic-bezier(0.22,0.9,0.3,1) (translateY 14px + fade) · `fadeUp` 0.24–0.32s ease · `scrim` 0.2s ease fade · progress bar width 0.4s ease. Carets rotate 90° on expand.
- Phone frame: 393×852 @ 46px status bar. Sheets are absolutely positioned below the status bar and cover the screen.

---

## The one chart grammar (important — this was iterated on hard)
There is exactly **one** bar in the app and it means one thing:

- The **whole track is the budget** (target). Track colour = inset surface (`#191C23` / `#F0F0EA`).
- The **fill is what has been spent**, in neutral grey (`#7A8296` / `#8A8A80`). Fill width = `min(spend/budget, 1) × 100%`.
- The **empty remainder is what is left** — it is not coloured.
- If spend exceeds budget the **whole fill turns red** (`#E8736F` / `#B93A34`) at 100% width. The magnitude of the overspend is carried by the number ("£62 over"), never by bar length.
- There is no notch, no headroom beyond 100%, no lime inside bars. Lime/red is used for the *number*.
- Amber (`#F0C64B`) is a **transaction flag** ("Pending" — amount not final yet), never a bar colour.

Bar heights: 3px (week rows), 7–8px (category rows), 12px (totals).

---

## Screens

### 01 · Import (3 states)
1. **Invite** — logo, `Send me / the spreadsheet.` (32px/800, two lines), body copy, then a dashed drop
   zone (1px dashed `#262A33`, radius 22px, flex-1) containing an upload glyph, "drop a file, or paste"
   and four mono pills: spreadsheet / screenshot / statement / pdf. Footer: lime "Choose a file"
   button + a quiet "skip — start from scratch" link.
2. **Reading** — mono eyebrow "Reading", filename as 28px title, "4 sheets · 1,284 rows · 8 months".
   Six checklist rows stream in one per 520ms (`fadeUp`), each 14px text with a lime ✓; the last row
   ("2 lines I couldn't place") uses red and a "?" tick. Bottom: 4px progress bar + percentage.
3. **Result** — "1,284 lines. Nothing thrown away." Then a 2×2 grid of stat tiles (Income £5,850 /
   Recurring £2,975 / Your week £420 / Labels kept 9), a cyan chip row of the user's own labels, and a
   bordered "2 I couldn't place" card: each unknown merchant offers three category chips; picking one
   replaces the chips with a lime confirmation line. Lime "Continue" button.

### 02 · Home — "where I stand"
Vertical scroll, 20px gutter, 22px gaps, 108px bottom padding for the FAB.
1. **Month bar** — logo mark + "August" (21px/800) + chevron (opens the month picker); right side:
   mono "18 Aug · wk 4 of 5" and a 34px hamburger button (opens the menu).
2. **Hero card** (radius 26px, padding 18/22/22) with a two-option segmented pill top-right:
   **Today | End of month**.
   - *End of month* (default): lime→cyan gradient background, mono eyebrow "Forecast · spare on 31 Aug",
     **52px/800 number**, one sentence of explanation, then a footer row above a hairline:
     `{spend} of {income} income` — both numbers 17px/800, joined by mono connectors — and an
     "edit income" pill on the right that opens screen 12.
   - *Today*: identical structure on `#1C1F27` (light: `#EDEDE7`), eyebrow "Actual · spare today".
   - Maths: spare = income − spend. Today spend = £4,840 (recurring + weekly to date + one-offs);
     forecast spend = £5,543 (recurring £2,975 + one-offs £468 + full weekly £2,100). Editing income
     updates both instantly.
3. **Weeks** (card, collapsible — tap the header to toggle; open by default):
   header row = "Weeks" + rotating caret on the left, right-aligned stack of
   **£703** (25px/800 lime) + mono "left", with mono "£1,397 spent of £2,100 this month" beneath —
   i.e. the full monthly weekly-budget, not just the week.
   Then one **roomy row per week** (5 rows, hairline-separated, padding 22px 4px 24px, 16px internal gap):
   - date range 15px/500 secondary + a lime "now" pill on the live week;
   - the week's headline number 27px/800 (lime "left" / red "over" / grey "budget" for future weeks)
     with a mono word beside it; a chevron on the right;
   - a 3px full-width bar (grammar above);
   - a 3-column grid of the three weekly categories: mono lowercase name, then the remaining amount
     16px/700 (red if over), then mono "left of £190" / "over £150" / "budget £80".
   Tapping a row opens screen 03.
4. **Recurring** card — title + £2,975 (19px/700). Tap → screen 05. No bar (no target exists).
5. **One-offs** card — title + £468. Tap → screen 06.
6. **Year strip** — bordered row: mono "2026 net position", "+£1,108" in lime, and a 160×40
   sparkline of cumulative position (2px lime polyline over a dashed zero line). Tap → screen 07.
7. **FAB** — lime 52px circle, bottom right, over a bottom fade; opens Add.

### 03 · One week, opened (sheet)
Back button + mono "August · Week 2". Title = date range (30px/800). Headline number 36px/800
("£62 over" red) with mono "of £420 · £396 spent". 12px total bar. Then one card per category
(Everyday / Weekend / Transport): name, its number (15px), mono "of £190", caret, and an 8px bar.
Expanding a category lists its transactions: merchant 15px/500, amount 15px/600 right-aligned
(amber if pending, with an uppercase "pending" pill), optional mono note underneath. FAB adds a
transaction pre-filled to this week.

### 04 · One transaction (sheet)
Amount 34px/800 (amber when pending) with a **Final | Pending** segmented pill. Editable fields:
where, when, category chip, label, note, and the raw imported bank string in mono. A short line of
Max's reasoning ("Saturday night, so I filed it under Weekend"). Actions: Save (lime) beside Delete.
Every field is editable, amount included. Reachable from weeks, recurring and one-offs alike.

### 05 · Recurring (sheet)
Total, then four collapsible groups — Housing £1,664 / Childcare £716 / Bills £320 /
Subscriptions & services £275 — each with a proportional share bar in a grey ramp
(`#3A4152 → #6E7789`). Items list as merchant + amount; variable bills (Energy, Water) carry the
amber pending treatment. No targets, therefore no budget bars.

### 06 · One-offs (sheet)
Leads with what is left of genuinely spare money. Flat transaction list (not grouped), each row
showing merchant, amount, a cyan label chip (`dxb-26`, `home-improvements`, a person's name) and an
optional mono note. Instalments show pending amber and "2 of 3 still due".

### 07 · Year round-up (sheet)
Three logical groups:
1. **Net** — year picker (‹ 2026 ›), caption, net position 46px/800 (lime, or red + "Overspent" when
   negative), and a sentence: "kept 3.2% of the £47,320 you earned".
2. **Where income went** — one stacked 100% share bar (Recurring / All weekly / One-off / Kept) plus
   four tiles: amount 22px/700, percentage, and "~£x / y% per month". The Kept tile is outlined lime
   (or red when negative).
3. **Month by month** — cumulative position line chart with per-month dots (red below zero) and mono
   month labels, then a collapsible row per month: month name, ±position (red/lime), and on expand
   the four figures (all weekly / recurring / one-off spend / income, income in lime) plus a link
   into that month.
KPIs: best month, worst month, average month, and the low point of the year.

### 08 · Add or upload (bottom sheet)
Grabber, then either:
- **Type it** — amount 34px/800 with a **Final | Pending** pill and a drag slider (£0–250, £0.05 steps);
  a "Where — shop, café, name…" field; a 3-way segmented **Weekly | Recurring | One-off spend**;
  and *conditionally* a compact chip row of sub-categories for the chosen kind (Weekly → Everyday /
  Weekend / Transport; Recurring → Housing / Childcare / Bills / Subscriptions); a label chip that
  opens a picker; a note field. Lime "Add it".
- **Upload** — same sheet, drop target instead of fields, CTA "Read it".
Opened from anywhere and pre-tagged by where the user was.

### 09 · Change month (sheet)
Year stepper + a 3-column grid of 12 months; each tile shows the month and its net result
(lime/red mono), unavailable months flat and dimmed, the current month outlined lime.

### 10 · Menu (left drawer, 296px, over a scrim)
Logo, then hairline-separated rows: **Manage budget goals**, **Appearance** (a segmented
**Dark | Light** pill — the active mode is a lime pill, the other links to the other theme),
**Import a file**, and **Clear data** in red.

### 11 · Budget goals (sheet)
Deliberately just numbers — **no charts**.
Title "What are you aiming for?" + mono subtitle. Section **Per week**: three rows (Everyday /
Weekend / Transport), each a white/card row with the label left and a numeric input right
(inset field, 48px tall, "£" prefix in grey, value 21px/700, right-aligned, no visible border).
Under them: "that is £420 a week · £2,100 a month" (total is derived, never editable).
Section **Expected income**: one "A month" numeric input, plus a row "Some months differ — set them
one by one ›" into screen 12. Single lime "Done" button. Edits apply immediately and drive every
bar and target in the app.

### 12 · Income by month (sheet)
"Income, month by month" + mono "months you haven't touched use £5,850". Twelve rows, one per month:
month name (current month lime + lime-tinted border), an uppercase cyan "set by you" tag when the
month has been overridden, and a numeric input (44px, £ prefix, 18px/700). Lime "Done".

---

## Interactions & behaviour
- **Navigation:** home is the base; everything else is a sheet over it (`sheetUp` animation) with a
  circular back button. The menu is a left drawer over a scrim; tapping the scrim closes it.
- **Expand/collapse:** weeks section, week categories, recurring groups, one-off groups, and year
  months all toggle with a rotating caret. Only one member of a group is open at a time
  (single-open accordion) except the weeks section, which is a simple show/hide.
- **Hero toggle:** Today / End of month is local state; the segmented pill is the only control.
- **Pending flag:** on the transaction editor and the add sheet; amber propagates to every list the
  transaction appears in.
- **Numeric inputs:** digits only, clamped 0–99,999, applied on change (no explicit save step —
  the goals/income sheets close with "Done").
- **Sliders** (add amount): pointer position across the track sets the value; knob is a 16px lime
  circle with a 3px surface-coloured ring.
- **Hover:** cards lift one surface step (`#14171C → #1A1D24`), rows drop to 0.7–0.82 opacity,
  lime buttons go `#D4FF5F`, quiet chips gain a lime border.
- **Import** runs on timers (520ms per checklist row, 900ms pause, then the result screen) — replace
  with real parse progress.
- **Theme:** in this prototype the two modes are two files linked from the Appearance control. In the
  product, make it one theme token set with a light/dark switch (and honour `prefers-color-scheme`).

## State
`base` (import|home) · `imp`/`read` (import progress) · `unsure[]` (unclassified rows resolved) ·
`sheet` (week|recurring|oneoffs|year|add|months|menu|goals|income|null) · `txn` (open transaction) ·
`week` + `seg` (which week and which category is expanded) · `recOpen`/`ooOpen`/`yOpen` (accordions) ·
`weeksOpen` · `hero` (today|forecast) · `yearSel`, `pickerYear` · `goalVals` {everyday, weekend,
transport} · `incDefault` + `inc` {month → amount} · add-sheet drafts (`addAmt`, `addKind`,
`addArea`, `addLabel`, `addPending`, `addMode`).

Data the product must supply: transactions (merchant, amount, date, category, label, note, pending
flag, raw string), weekly targets per category, monthly income per month, recurring items and groups,
and derived aggregates per week/month/year.

## Assets
No bitmap assets. The Max mark is two inline SVG paths (a blob in text colour + a lime leaf); all
other icons are inline stroked SVGs at 1.6–2.4 stroke width, `stroke-linecap:round`. Fonts:
Manrope and JetBrains Mono (Google Fonts in the prototype — swap for the codebase's loader).

## Files
- `Max App v1.dc.html` — dark mode, all 12 screens.
- `Max App v1 Light.dc.html` — light mode, identical structure.
- `support.js` — the prototype's rendering runtime. **Not part of the design**; included only so the
  HTML files open and can be clicked through locally.
