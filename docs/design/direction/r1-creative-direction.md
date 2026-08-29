# R1 · Creative direction — D1

**Author:** D1, Creative Director. Round 1, independent. No cross-talk with D2 or D3.
**Scope:** concept, visual language, colour, type, iconography, the name, the mark.
**Status:** a proposal to be critiqued in R2, not a decision.

---

## 1 · The concept, in one sentence

**Max is money printed on paper and read in daylight: a warm, quiet page where
exactly one number is allowed to be large, nothing is ever coloured good or bad,
and there is no red anywhere in the product.**

The differentiator is not warmth — every finance app claims warmth. It is
**chromatic abstention**. Every other money app tells you how you are doing in
colour before you have read a word: green up, red down, amber "careful". For
someone who avoids money because it feels like judgement, that is the judgement,
delivered pre-verbally, before they can look away. Max removes it. Colour in Max
carries identity and attention, never valence. That single decision is defensible,
testable, visible in one second, and — as far as I can find — unoccupied.

Three signature pieces, and only three (§9 lists them as enforceable rules):

1. **The one serif figure.** Exactly one number per screen, set large in a serif.
   Nobody in fintech sets money in a serif. It is the face of the app.
2. **No red.** The over-budget state is a *texture*, not a colour.
3. **Paper.** A real ground with grain and hairlines, not a card-on-grey shell.

These are visual signatures. D2's three motion signatures are a separate budget
and must be counted separately — combined we should be at six named moments in
the whole app, not sixteen.

---

## 2 · The case against the current direction

I looked at `01-home.png`, `02-home-light.png`, `03-week.png`. Nine specific
faults, each tied to something visible.

**2.1 · The gradient hero is a borrowed object.** The lime → mint → cyan panel is
the only saturated thing on either home screenshot. That exact ramp on near-black
is the house palette of crypto exchanges and sports-betting apps circa 2024–26. It
is not warm and it is not Max's; it arrived because it is what "modern fintech
accent" currently means.

**2.2 · It is also the loudest thing on the screen, at the top, for an avoidant
user.** `£3,027.24` at roughly 64px in black on bright lime is a *gains* graphic.
The emotional register is congratulation. This persona does not want to be
congratulated; being congratulated implies a scoreboard, and next month the same
component will be quiet. Brightness that varies with fortune is a mood ring.

**2.3 · Below the hero there is no design at all.** On `01-home.png`, Weeks,
Recurring, One-offs and 2026 Net Position are four categorically different objects
— a navigational container, a fixed commitment, discretionary spend, and a
long-run trend — rendered as four identical rounded grey rectangles with a label
left and a figure right. Hierarchy is being carried entirely by how big the number
happens to be. That *is* pain point 1. A wireframe is what you get when IA is
solved and visual language never is.

**2.4 · Mono is the single largest reason it reads as Trading 212.** "29 Aug · wk
4 of 4", "FORECAST · SPARE ON 30 AUG", "£1,474.29 spent of £2,180 this month", "of
£545 · £299.32 spent" — all letterspaced monospace. Monospace is the typographic
signature of terminals, receipts and code. The brand strategy says *not a
spreadsheet, not a bank, not a lecture*; the type says *terminal*. The type wins,
because it is read first.

**2.5 · Light is an inversion, not a design.** `02-home-light.png` is
`01-home.png` with the greys flipped. Same layout, same gradient at the same
saturation, same everything. On cream the gradient panel now reads unmistakably as
a promotional banner dropped into an app. Nothing about the light theme was
decided; it was computed.

**2.6 · The week screen is 40% empty and closes with the most generic component
in mobile design.** `03-week.png` has a lime FAB in the bottom-right of a large
void. Emptiness is fine — this is not a call for more content — but unshaped
emptiness plus a stock FAB is the absence of a decision, not restraint.

**2.7 · The bars get hotter as they fill.** Everyday, Weekend and Transport in
`03-week.png` ramp lime → amber → orange as the fill approaches the track end.
Transport is visibly *hotter* than Everyday. Whether or not this satisfies the
letter of the bar doctrine, it fails its stated intent — "magnitude must not
shout" — because temperature is shouting. This is the clearest live example of
colour carrying a verdict.

**2.8 · Six money figures above the fold, in four type styles and three colours,
with nothing saying which one you were meant to read.** £3,027.24, £6,520.70,
£9,547.94, £705.71, £1,474.29, £2,180. Progressive disclosure is D3's problem, but
the *typographic* failure is mine: there is no rule stating how many figures may
be prominent, so all of them are.

**2.9 · The mark is a fruit.** At header size it is a ~26px black blob with a 6px
lime leaf; in dark it is a white blob. It says orchard, health, education, or
grocery — not money, not months, not room. It has no colour identity (black in
light, white in dark), it does not survive 16px, and it is the only remaining
trace of a naming rationale nobody now believes.

**What survives.** The information architecture is genuinely good, the copy is
good ("1 week to go. Spend the weekly budget that's left and this is where August
lands." is the best sentence in the product and should probably become the
brand's), and the restraint instinct is right. This is a re-skin and a re-name,
not a re-think.

---

## 3 · Light-first. Committed.

**Max is light-first. Dark ships, designed separately, opt-in-by-OS-preference
only, and is never the first thing a new user sees.**

The argument:

- **The evidence in the room.** Three of the founder's four references (Monzo,
  iMessage, Airbnb) are experienced by almost everyone as light. The fourth —
  Trading 212, the dark one — is the one he named as least preferred, and it is
  the one the current build most resembles. That is not proof, but it is the only
  data we have and it all points one way.
- **Dark makes every accent glow, and glow reads as alarm.** On a near-black
  ground, any saturated fill emits. `01-home.png` demonstrates it: the lime is
  not merely visible, it is a light source. For an app whose brief forbids using
  fear as a motivator, a substrate that turns every accent into a warning light is
  the wrong substrate.
- **Dark cannot do paper, and paper is the concept.** Grain, hairline rules, ink —
  the entire material metaphor is a light-ground metaphor. Inverted it becomes
  "screen", which is what we are getting away from.
- **Context.** Phone-in-hand, standing up, mid-day — the brief's own words. Dark
  UI is optimised for the 11pm bedroom check, which is the exact compulsive
  behaviour this product should not be courting.
- **Dark is the fintech default now.** Choosing light is the cheapest available
  act of differentiation, and it is the one Airbnb-class craft actually lives in:
  typographic hierarchy on a quiet ground is much harder to fake than a glowing
  card on black, which is why everyone chooses black.

**Dark theme, when it ships, is a different design and not a remap.** Ground is
warm charcoal `#1A1815`, never near-black. Chroma of the accent is *reduced* and
luminance raised, so it sits in the page rather than floating above it. Body copy
drops one weight step (500 → 400) because light-on-dark optically gains weight.
Card borders replace card shadows. Values in §4.

---

## 4 · The colour system

**Three hues exist in the entire product: paper, ink, and clay.** Everything else
is a step within one of them. If a fourth hue appears, it is a bug.

### 4.1 · Light — "Daylight" (default)

| Token | Hex | The one thing it means |
|---|---|---|
| `paper` | `#F2EEE6` | The app ground. There is exactly one ground and this is it. |
| `card` | `#FFFCF6` | A raised object. Only real objects get this. |
| `ink` | `#17150F` | Every figure and every heading. The default text colour. |
| `ink-2` | `#56504A` | Sentence copy that supports a figure. |
| `ink-3` | `#6B6459` | Labels, units, provenance, timestamps. |
| `rule` | `#E0D8C8` | 1px hairlines, dividers, and every bar track. |
| `clay` | `#B3502F` | "This is the thing to look at, or to touch." Attention and action. Never good, never bad. |
| `clay-deep` | `#8C3C21` | Pressed and hover state of `clay`. No other use. |
| `clay-wash` | `#F0E2D9` | Selected / held state fill. One use only. |
| `hatch` | pattern | Over the line. See 4.4. **It is a texture, not a colour.** |

Contrast: `ink`/`paper` ≈ 16:1. `ink-2`/`paper` ≈ 6.3:1. `ink-3`/`paper` ≈ 4.6:1.
`clay`/`paper` ≈ 6.2:1, and `#FFFCF6` on `clay` ≈ 7.2:1, so clay can hold text in
both directions. Every one of these passes AA for body text; that is the floor,
not a nice-to-have, because the persona reads this on a phone in sunlight.

### 4.2 · Dark — "Lamplight" (opt-in via OS preference)

| Token | Hex | Note |
|---|---|---|
| `paper` | `#1A1815` | Warm charcoal. Not `#0B0B0C`. Never pure black. |
| `card` | `#232019` | +1 step, plus a `rule` border. |
| `ink` | `#F3EEE3` | Warm white. Never `#FFFFFF`. |
| `ink-2` | `#B5AEA1` | |
| `ink-3` | `#8A8377` | |
| `rule` | `#38332B` | |
| `clay` | `#D98A66` | Higher luminance, *lower* chroma than light-mode clay, so it does not emit. |
| `clay-deep` | `#EFA783` | Inverted direction: pressed goes lighter. |
| `clay-wash` | `#2E241D` | |

### 4.3 · Rules for combining colour

- **Colour never encodes valence.** No hue in Max means good, bad, safe, risky,
  ahead or behind. Under and over budget are the same colour.
- **Clay is rationed: at most two clay elements per screen.** Typically the
  primary action and one "open this figure" affordance. The mark does not count in
  the app chrome; it counts everywhere else.
- **Categories are never colour-coded.** Labels are the user's own words
  (non-negotiable 3); a colour assigned to "Weekend" is an internal vocabulary
  imposed on their word. Categories get type and space, never a swatch or dot.
- **There is no red in the product.** Not for over, not for errors, not for
  destructive actions. Destructive confirmation is carried by the word and by the
  hatch, not by a colour. This is the headline of the system and the easiest rule
  in the document to check: grep for it.
- **Colour never carries information alone.** Anything clay is also distinguished
  by weight, position or an icon.
- **Focus rings are `ink`, 2px, offset 2px.** Never clay, never blue.

### 4.4 · The gradient rule

**All gradients go.** The lime → cyan hero in `01-home.png` / `02-home-light.png`
is deleted, not restyled, not desaturated, not made subtler. Its replacement is
`card` on `paper` with `ink` type — the number carries the screen, not the panel.

Exactly two non-flat fills are permitted in the entire product:

- **`grain`** — a global paper texture on `paper` only: a 128×128 tiled noise at
  **≤3% opacity**, non-repeating in appearance, no colour of its own.
- **`hatch`** — the over-the-line state: 45° lines of `paper` over a solid `ink`
  fill, **1.5px line on a 3px pitch**. Implemented as a `repeating-linear-gradient`,
  which is the single sanctioned exception below.

**The failable form:** `src/` may contain **zero** `linear-gradient(`,
`radial-gradient(` or `conic-gradient(` declarations, and exactly **one**
`repeating-linear-gradient(` — the `hatch` token. A reviewer runs one grep.

### 4.5 · What this does to the bar

The bar grammar is non-negotiable and I am not asking to open it. Magnitude stays
in the number. What I am changing is the *material*, which §4 of the brief
explicitly leaves to me:

- Track: 6px tall, radius 3, fill `rule`, full content width.
- Fill: solid `ink`. Not clay — bars appear many times per screen and clay is
  rationed. Ink on paper is calm, and it is the same weight whether the month is
  good or bad.
- **Over the line: the same fill, same colour, switched to `hatch`.** A different
  *material*, not a different temperature. It reads as "this is a different kind
  of thing", which is true, rather than "you did a bad thing", which is a verdict.

**One flagged deviation.** `AGENTS.md` non-negotiable 2 describes the primitive as
"the whole fill turns red at 100% when over". I am keeping the binary state change
at 100% and changing only its *rendering*, from red to hatched ink. The palette is
explicitly open for challenge, and a system with no red cannot have a red over
state. **This needs orchestrator ratification before anyone edits `Bar.tsx`**, and
if it is refused, the fallback is a single deep low-chroma `#6E2020` used nowhere
else — which I think is worse, because it reintroduces temperature.

Related, and also for the orchestrator: **the amber ramp visible in `03-week.png`
should be removed regardless of which way the above goes.** It is not in the
doctrine, and it fails the doctrine's stated intent.

---

## 5 · The type system

### 5.1 · Faces

| Role | Face | Fallback stack |
|---|---|---|
| Display figure | **Instrument Serif** 400 | `"Instrument Serif", "Iowan Old Style", Georgia, "Times New Roman", serif` |
| Everything else | **Instrument Sans** 400/500/600 | `"Instrument Sans", -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |

Both are on Google Fonts, both are open licence, and they are a designed pair.

**Why a serif for money.** No consumer finance app sets figures in a serif. It is
the single cheapest ownable move available, it reads as *written down by a person*
rather than *computed by a system*, and it is exactly the "confident typographic
hierarchy" that transfers from Airbnb when you have no photography. Instrument
Serif is high-contrast and display-only, which is a feature here: it is physically
unusable below ~40px, so the face itself enforces §5.4.

If a variable weight range turns out to be needed, the substitute is **Fraunces**
with `opsz` on and `WONK` at 0 — but only as a substitute, not alongside.

### 5.2 · Mono numerals: **gone**

Removed everywhere. Mono's one real benefit is column alignment, and that is
obtainable without the terminal register: **`font-variant-numeric: tabular-nums`
on every figure**, in Instrument Sans. Figures align, and the app stops looking
like a receipt.

Monospace survives in exactly one place: raw imported statement text shown inside
a provenance drawer, where the point *is* that you are looking at a machine's
output (non-negotiable 5). System mono, 12px, and nowhere else.

### 5.3 · The scale

1rem = 16px. Ratio ≈ 1.25 in the text range, with a deliberate break to display.

| Level | Size / line-height | Face + weight | Tracking | For |
|---|---|---|---|---|
| `display` | 56 / 54 (desktop 72 / 68) | Serif 400 | −0.02em | **The one figure.** Nothing else. |
| `title` | 28 / 32 | Sans 600 | −0.015em | Screen title. One per screen. |
| `heading` | 20 / 25 | Sans 500 | −0.01em | Card title. |
| `body` | 17 / 26 | Sans 400 | 0 | Sentences. 17, not 16 — this is a phone-in-hand read. |
| `figure` | 17 / 20 | Sans 600, tabular | 0 | Every money figure that is not the display one. |
| `label` | 13 / 16 | Sans 500 | +0.02em | Labels and units. Sentence case. |
| `micro` | 12 / 16 | Sans 400 | 0 | Provenance, timestamps, "tap to see where this came from". |

### 5.4 · Type rules

- **One display element per screen.** At most one element ≥40px anywhere on a
  screen. Countable; `01-home.png` currently fails it in spirit by pairing a 64px
  figure with three 24px figures competing beneath.
- **Three weights exist: 400, 500, 600. Nothing heavier.** The current chunky
  700-weight headings ("August", "Weeks", "Recurring") go. Emphasis comes from
  size, ink step and space — never from weight above 600.
- **No all-caps letterspaced text.** Zero occurrences. It is the dashboard tell
  and it is on every screenshot.
- **Every money figure carries `tabular-nums`.** No exceptions.
- **Line length is capped at 62 characters.** Content column max-width 520px,
  centred, on any viewport — the app never becomes a wide dashboard on desktop.

---

## 6 · Iconography and the mark

### 6.1 · Icons

- 24px grid, **1.75px stroke**, round caps, round joins, **no fills**, single
  colour (`ink`, or `clay` when the icon is one of the screen's two clay
  elements). Internal geometry radius 2px.
- **Icon budget: 18.** The set is fixed. Adding a nineteenth requires deleting one
  and saying which in the PR. A reviewer counts the files in the icon directory.
- **No category pictograms.** Categories are the user's own words; drawing a
  shopping trolley next to a label the user typed is exactly the normalisation
  non-negotiable 3 forbids.
- No emoji in product UI. No duotone. No filled circle behind an icon.
- Chevrons stay, but at 1.75px they stop being the `›` glyph currently doing the
  job on the Weeks and category rows.

### 6.2 · The mark — direction

The current mark is a small fruit. It goes. The replacement must satisfy four
tests: legible as a 16px favicon in one colour; not a fruit, coin, wallet, pig,
chart, arrow or shield; carries *room* rather than *growth*; and drawable with two
elements or fewer.

Three concepts, at 48×48, `stroke-linecap="round"`, drawn in `ink` or `clay`:

**M1 · The Open Ring** — the month, unclosed.
Circle centred (24,24), r=16, stroke 6, no fill. A single gap of **62°** centred
on the upper-right diagonal (dasharray ≈ `83.2 17.3`, rotated −14°). The gap is
the room you have left. **Rule: the gap is fixed at 62° and may never be animated
or bound to a value.** It is a mark, not a gauge — the moment it moves it becomes
a progress ring, which is a breakable mechanic and is banned.
*Risk:* open rings are common. Its defence is the specific 62° and the ink weight.

**M2 · The Basin** *(recommended)* — where the month lands.
One open bowl and one resting dot. Bowl: `M9 14 C 9 34, 39 34, 39 14`, stroke 5,
round caps. Dot: r=4, centre (29, 23) — inside the bowl, **right of centre**, so
it reads as *settled with room either side* rather than balanced at the middle.
It is a catch, a cupped hand, a valley floor. Not a chart, not a coin, not fruit.
At 16px it is a curve and a dot and stays legible.
*Risk:* inverted it becomes a fermata (a musical "hold this as long as you need",
which is on-message) — but flipped and shallow it can read as a raised eyebrow.
Mitigation is the orientation: bowl **opens upward**, always.

**M3 · The Rule and the Dot** — the plainest possible statement.
A horizontal rule `M8 32 H40`, stroke 5, and a solid dot r=4.5 at (30,19) sitting
above it, right of centre. The line is the budget, the dot is where you are, and
the gap between them is the product. Utterly reducible; works as a 16px favicon,
as a letterhead device, and as a divider that appears throughout the UI.
*Risk:* austere to the point of anonymity on its own; strongest as the *lockup*
device with a wordmark rather than a standalone app icon.

**Recommendation: M2, with M3's rule as the recurring UI device.** M2 is the app
icon; the M3 rule-and-dot appears as the section divider throughout the product,
so the mark is a compressed version of something you see on every screen. That is
how identity gets into a UI without decorating it.

**App icon:** `clay` mark on `paper`. Not ink-on-white and not white-on-black —
the icon is where the one chromatic earns its keep, and the current mark's failure
to have any colour identity at all is why it disappears on a home screen.

---

## 7 · The name

### 7.1 · Against "Max"

The stated rationale — *"maximize your benefit, even if you're the least
financially engaged person imaginable"* — is generous in intent and wrong in
mechanism, for four reasons:

1. **"Maximise" is optimisation vocabulary, and this user's problem is not
   under-optimisation.** It is avoidance. A name built on *more* sets a
   performance bar in the one place a user cannot dismiss it: the icon on their
   home screen, every day, whether they open it or not.
2. **It is a verdict word about the product.** `src/lib/tone.ts` bans the app from
   grading the user. The name grades the *product* on the same axis — best, most,
   maximum — and it is the only piece of copy in the whole system that makes a
   superlative claim.
3. **"Max" is a man's name.** Every sentence becomes an advisor persona: "Max
   thinks", "ask Max". Brand strategy explicitly rejects "not a lecture" and "a
   friend who never makes you feel bad" — but a named humanoid advisor is a
   character with opinions about you, which is a heavier promise than the product
   should make.
4. **Practically it is indefensible.** A streaming service, a phone model, an OS
   window control, a dog. Unsearchable, undefendable, and the `.com` is gone.

### 7.2 · Candidates

| Name | One-line rationale |
|---|---|
| **Spare** | The product's own word for the number it exists to tell you — `01-home.png` literally reads "SPARE ON 30 AUG". Means both *what is left* and *unfussy*. The precise antonym of "maximise". |
| **Leeway** | Room to move without penalty. Spoken English, warm, no fintech occupies it, and it names the emotional deliverable rather than the mechanism. |
| **Margin** | The money left over *and* the blank edge of a printed page — it names the number and the visual concept in one word. Risk: corporate-finance overtone, and it is a CSS property. |
| **Lands** | From the best sentence in the product: "this is where August lands." An arrival, not a score. Risk: reads as a plural noun, weak as a verb-name. |
| **Headroom** | Space above you. Positive, concrete. Risk: slightly engineering/AV-industry, and two syllables of jargon. |
| **Elbow** | As in elbow room. Physical, memorable, completely unlike any finance brand. Risk: a body part; needs the tagline to survive first contact. |
| **Even** | "We're even", "even keel", "evening". Calm and non-judgemental by construction. Risk: near-ungoogleable and generic in UI copy. |
| **Plainly** | The voice as the name — promises no lecture, which is the actual product promise. Risk: adverb names date, and it is hard to say as a possessive. |
| **Tally** | Friendly, low-tech counting; warm mouthfeel. Risk: implies keeping score, which is the one thing this product must not do. |

### 7.3 · Recommendation: **Spare**

Naming the app after the single number it exists to produce is the most
defensible naming logic available, and this product has already, unprompted,
chosen that word for its own hero label. It is a plain English word an anxious
person can say without wincing. It is the exact opposite of "maximise" — the
product is not about getting more, it is about knowing calmly what you can let go
of. And "spare" carries a second meaning that describes the visual direction
without straining: spare as in unornamented.

**The one honest risk:** "spare" can read as scarcity ("spare and meagre") rather
than surplus. I think idiom wins — spare room, spare cash, spare time all mean
*surplus and freedom* — but it should be tested on five people from the persona
before it is locked.

**Runner-up: Leeway.** If "Spare" tests as bleak, Leeway carries the identical
meaning with no scarcity reading at all, and "The Leeway" is a better-sounding
company than "The Spare".

Per §9 of the brief: **decide now, rename later.** Nothing in `src/` changes this
round.

---

## 8 · What this looks like on the home screen

Not my deliverable — D3 owns layout — but so the direction is not abstract:

Cream ground with grain. A 13px `ink-3` label, sentence case, no letterspacing:
"Forecast · spare on 30 Aug". Beneath it `£3,027.24` at 56px in Instrument Serif,
`ink`, tabular — the only large thing on the screen, on paper, with nothing behind
it. Beneath that the existing sentence at 17px in `ink-2`. A 1px `rule` hairline.
Then the supporting figures at 17/600 tabular, each preceded by a label in `ink-3`,
separated by hairlines rather than by four grey boxes. One clay element: the
affordance that opens the forecast's provenance. One clay element in reserve.

No panel, no gradient, no colour on any number, and the screen still tells you the
one thing you came for before you have finished raising the phone.

---

## 9 · The rules I am imposing

Each is written so a reviewer can point at work and say "that breaks rule N".

1. **Light is the default theme.** A first-run user with no OS preference gets
   Daylight. Dark is reachable only via OS preference or an explicit setting.
2. **Dark is not a remap.** Dark ground is `#1A1815`, never below `#0F0F0F`; dark
   `clay` has lower chroma and higher luminance than light `clay`. If dark can be
   produced from light by a token-for-token substitution, it has not been designed.
3. **Three hues exist: paper, ink, clay.** Any fourth hue in `src/` is a bug.
4. **There is no red anywhere in the product.** No hue with a red-orange dominant
   above `clay`'s chroma appears in any state, including errors and destructive
   actions.
5. **Colour never encodes valence.** Under-budget and over-budget are the same
   colour. Good months and bad months are the same colour.
6. **At most two `clay` elements are visible per screen.** Countable in a
   screenshot.
7. **Categories are never colour-coded.** No swatch, dot, tint or pictogram is
   assigned to a user-entered label.
8. **Zero gradients.** `src/` contains no `linear-gradient(`, `radial-gradient(`
   or `conic-gradient(`, and exactly one `repeating-linear-gradient(` — the
   `hatch` token.
9. **The over-budget state is a texture, not a colour** — solid `ink` fill,
   `paper` hatch, 1.5px on a 3px pitch, 45°. *(Requires ratification against
   `AGENTS.md` non-negotiable 2; see §4.5.)*
10. **The amber/orange ramp on bar fills is removed.** A bar's fill is one flat
    colour at every fill level.
11. **Exactly one element per screen is ≥40px.** One display figure, no
    competitors.
12. **The serif is used only at ≥40px.** Instrument Serif never appears in body,
    labels, buttons or secondary figures.
13. **Only weights 400, 500 and 600 are used.** No 700+ anywhere.
14. **No all-caps letterspaced text.** Zero occurrences in product UI.
15. **Every money figure sets `font-variant-numeric: tabular-nums`.**
16. **Monospace appears in exactly one context** — raw imported statement text
    inside a provenance view — and nowhere else.
17. **Content column is capped at 520px and 62 characters**, on every viewport.
18. **Icons: 24px grid, 1.75px stroke, no fills, maximum 18 in the set.** A
    nineteenth requires deleting one, named in the PR.
19. **The mark's geometry is fixed and never data-bound.** No part of the logo
    animates to represent a value, ever.
20. **Exactly two radii and one shadow exist:** 4px for controls, 14px for cards,
    999px for pills, and a single shadow token
    `0 1px 0 rgba(23,21,15,.04), 0 6px 16px -8px rgba(23,21,15,.10)`. Nothing else
    casts a shadow.
21. **Three visual signatures, named** (§1). A fourth requires retiring one.

---

## 10 · Report

**Built:** this document and `r1-creative-specimen.html` — palette swatches with
hexes and roles, the type scale at real size, the three marks as inline SVG at
48px and 16px, and the bar material comparison. Nothing in `src/` touched, no git
commands run, no other files created.

**Deviations and things needing a decision, not silence:**

- **Rule 9 conflicts with `AGENTS.md` non-negotiable 2** ("the whole fill turns
  red at 100%"). I am changing the rendering of that state, not the grammar. This
  must be ratified by the orchestrator before any code change. My fallback is
  stated in §4.5 and I think it is worse.
- **The amber ramp in `03-week.png`** appears to fail the bar doctrine's stated
  intent and is not, as far as I can tell, specified by it. Someone who has read
  `Bar.tsx` should confirm whether it is intentional.
- **The name is a recommendation, not a decision**, and "Spare" carries a real
  scarcity risk I cannot resolve alone (§7.3). Five persona interviews would
  settle it cheaply.

**What I am not confident about:**

- **Instrument Serif at 56px on a phone across the real figure range.** `£3,027.24`
  is nine glyphs; a five-figure income line may not fit at 56px on a 360px
  viewport, and this face has no condensed axis. Needs testing with real data
  before it is locked. Fraunces is the escape hatch.
- **Whether "no red at all" survives a genuinely urgent state** — a failed
  payment, a destructive delete. I believe word plus hatch is enough and that the
  absence of red is the strongest idea here, but I have not designed those screens
  and D3 may find a case I cannot answer.
- **Clay `#B3502F` on cream is close to Airbnb's territory** without being its
  colour. I judged that acceptable because the founder named Airbnb approvingly,
  but a reviewer who thinks it is derivative has a point worth hearing.
- **I have not seen the empty, loading or error states**, only three screens.
  Judgements about the current build are limited to what those three show.
