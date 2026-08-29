# R3 — what is settled, what is not, and what the founder must decide

Orchestrator's ruling after two rounds. Written by the orchestrator, not a
director, because R2 ended in a genuine tangle that no participant could settle:
**each of the two directors conceded the home screen to the other.**

---

## 0 · The tangle

- **D3 (UX)** withdrew its own horizon scrubber — *"It was the wrong mechanic and
  I was wrong to invent it"* — and asked for its content model to be put on D2's
  card deck.
- **D2 (motion)** conceded its own signature moment — *"The scrubber wins. THE
  DECK loses the home screen, and I am not going to pretend otherwise"* — and
  adopted D3's scrubber.

They swapped positions. Nobody now holds either. This is what honest
cross-critique looks like when both parties argue in good faith, and it is
exactly why the round existed — but it means the ruling is mine.

---

## 1 · SETTLED: home is one figure at four time horizons

**Both directors agree on the content model, arriving from opposite directions.**
This is the round's real output and it is not in doubt.

Home shows **one money figure**, and the thing the user moves is **the time
horizon**: `Today → Week → Month → Year`.

The shared reasoning, which each stated independently:

- The current home shows four horizons as four unrelated objects. They are not
  four things. They are **one question at four distances**: *how much room do I
  have?*
- The axis must be **ordered**. D2 put it best, correcting its own R1 rule:
  *"lateral means along a predictable order, not merely alternatives."* The old
  card set — Forecast → Weeks → Commitments → Year — is a shuffle; nothing is
  "to the right of" Weeks. Time distance is monotone, and a user works it out on
  the first drag and never has to remember it again.

That disposes of the nine-figures problem at its root rather than by hiding
things.

## 2 · SETTLED: the numeral rule, in a better form than either started with

D3 conceded outright. D2 then found the rule both had been reaching for.

D2's R1 rule — *numerals never tween* — was a proxy that could not explain why a
480ms bar settle is honest and a 400ms count-up is not. The real discriminator is
**precision**:

> A numeral is precise to its last digit, so every frame is a specific claim —
> `£1,637.42` on the way from £245.68 to £3,030 is true of nothing. An analogue
> indicator is precise only to its read resolution, so mid-travel it truthfully
> says *"somewhere between"*.

So: **the figure does not re-count, it re-states.** A step function of drag
position with hysteresis. Bar fills may settle; numerals may not travel.

This matters beyond motion. It is the same doctrine that made figures openable
after the parser misread real data twice, arrived at independently by a director
who was not told about those incidents.

## 3 · SETTLED: the other two signature moments

- **THE TAPE** (D3's name, D2's inline presentation) — any figure, anywhere, is a
  door; touching it unfolds its evidence beneath it and the figure itself never
  moves, scales or recolours. Both directors specified this independently — one
  the physics, one the content contract — and they compose without a seam. It is
  also the only signature moment *required* by doctrine rather than chosen for
  delight.
- **THE LANDING** — the commit on `/add`. The amount travels to the row it
  belongs to and the fill settles after it arrives. One write, at t=0.

The presentation question resolved structurally, not by taste: as a sheet, the
tape would push `/transaction/[id]` to a third layer and break D3's own two-layer
depth cap. Inline, the problem disappears.

## 4 · SETTLED: the deck survives at `/week/[n]`

Both directors independently place the founder's peek-deck on the week screen,
where the three spending categories genuinely are peers of the same shape,
period and grammar. It keeps its geometry and loses its signature slot and its
haptic — *"a carousel is not describable to a friend."*

---

## 5 · NOT SETTLED — and not for me to settle

### 5.1 The control on home: sliding cards, or a tick strip?

Content is agreed. The **form of the control** is not, and the two directors
have now each argued for the other's answer.

The scoring, honestly:

| D3's objection to the strip | Status |
|---|---|
| A second horizontal gesture on one screen | **Neutral.** Both end states have exactly one horizontal meaning on home, since the deck leaves for `/week` either way |
| Intermediate positions have no referent — a figure between Week and Month is true of nothing | **Answered.** D2's step-function-with-hysteresis means no intermediate figure is ever rendered. D3 did not have this when it withdrew |
| Nobody has felt it | **A risk, not a defect** — and D2 has pre-registered a half-day test with kill criteria |

| D2's argument for the strip | Status |
|---|---|
| The axis must be ordered | **Agreed by both** — but this is now a property of the *content*, and cards ordered by time satisfy it too |
| Motion must carry payload; the deck's motion only says "other cards exist" | **Strong** |
| Soft failure mode — degrades to a tap strip and loses nothing but wow. The deck's failure is hard | **Strong** |
| The strip shows the whole axis at rest; a deck shows one card and asks you to remember the order | **Strongest, and unique to the strip.** Legibility at rest matters most for the user this app is for |

**Note both are honest.** A card sliding does not tween a numeral — it translates
one. So doctrine does not decide this.

**The candidate synthesis, which neither director has vetted:** D2's deck already
carries a pager label strip. D3's scrubber is essentially that strip promoted to
a control. One component — **cards that slide, over an ordered tick strip that is
itself tappable** — keeps the founder's mechanic and its tactility, makes the
axis legible at rest, and supplies the tap/keyboard/desktop route whose absence
is a confirmed defect in the prototype.

I am flagging it rather than ruling it. Inventing a fourth position at the
convergence stage, unvetted by either director, is how an orchestrator's taste
quietly replaces the work it was meant to referee. **It should be tested, not
decreed** — see §7.

### 5.2 The bar colour ramp — the founder's own decision to reverse

D1 withdrew its proposed remedy after reading `bar-grammar.ts` (the existing
mechanism is better than what it proposed) but narrowed and re-made its
objection. It now contests **four hex values, not the rule**:

- The mechanism encodes fraction; the *stops chosen* are literally green → amber
  → red, which is a verdict vocabulary.
- The "calm" end is not calm: `#8fd14f` occupies 0–62%, where bars sit most of
  the time, and green is the approval half of the same traffic light.
- **In dark mode the intent inverts** — on a near-black ground the lime is the
  highest-luminance object in the frame, so the state meaning "nothing to see
  here" is the loudest thing in the product. This argument stands alone.
- The recorded reasoning is about *one* bar; the week screen shows four
  side by side, where temperature ranks categories by fraction — so Transport at
  94% of £40 outranks Everyday at 50% of £300. That puts a magnitude in bar
  temperature, and the wrong one.

**It also proposed a five-minute falsification test**, which is the right way to
settle it: hue-rotate the ramp to lime → teal → indigo, same stops, same curve.
If it still reads correctly, the colour was carrying fraction and D1 is wrong. If
it stops working, the colour was carrying culture.

**This is a founder reversal, not an orchestrator call.** The ramp exists because
he asked for it, and the reasoning recorded in the code is his. He reverses it
knowingly or not at all.

### 5.3 His own mechanic has been demoted by both directors

The peek-deck is the mechanic the founder arrived at twice independently. Both
directors have now moved it off home. D2 raised this itself and was right to:
he should know it happened and be able to overrule it.

### 5.4 The name

D1 recommends **Spare** — the product's own word for the number it exists to
produce, and the exact antonym of "maximise" — with Leeway as runner-up and seven
others. Its argument against "Max": *maximise* is optimisation vocabulary aimed
at a user whose problem is avoidance, and the name is the only superlative claim
in a product whose tone gate bans verdicts.

D3 flags a real collision: "Spare" is already the app's own label for a specific
figure, so the name would shadow a word the UI uses.

### 5.5 Smaller escalations
- **`+£11,806.05` leaving home at rest.** D1's argument: once colour valence is
  gone, a `+` sign is the last pre-verbal verdict in the product. Counter: it may
  be the figure the founder considers the payoff.
- **Light-first.** D1 committed to it and the case is strong, but it is the
  largest single visual change on the table.

---

## 6 · Defects to fix regardless of any decision above

1. `YearView.tsx` renders a **second bar grammar** (segment width = magnitude)
   that no doctrine sanctions.
2. The **"not now" affordance** the brand strategy calls *required* does not
   exist anywhere in `src/`.
3. The motion prototype's pager labels are `<span>`s — three of four cards are
   **drag-only**, with no keyboard or desktop route.
4. The forecast renders as `£3,027.24` — a **projection stated to the penny**,
   claiming precision it does not have. Live in the app and faithfully carried
   into the prototype.

---

## 7 · What R4 should do first

**Settle §5.1 by testing, not arguing.** D2 pre-registered the experiment: a
strip-only device prototype, half a day, two kill criteria, both of which return
the third signature slot to the deck so the budget holds at three either way.

Build all three candidates on the real home screen with real data — sliding
cards, tick strip, and the synthesis — and put them on the founder's phone. That
is the only instrument that has ever settled a taste question on this project.

Everything else in §5 is a founder decision and should be presented as one, with
the recommendation attached and the history intact.
