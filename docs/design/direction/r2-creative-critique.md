# R2 · Creative critique — D1

**Author:** D1, Creative Director. Round 2, cross-critique.
**Read:** `r1-orchestrator-corrections.md`, `r1-ux-architecture.md` (D3),
`r1-motion-grammar.md` (D2), and `src/components/ui/bar-grammar.ts`, `Bar.tsx`,
`globals.css` — which I should have read before R1 and did not.

---

## 1 · The correction, answered

### 1.1 What I got wrong, stated plainly

I wrote that the lime→amber→orange ramp "does not appear to be specified". It is
specified, in `src/components/ui/bar-grammar.ts`, with its reasoning recorded,
and the founder asked for it. I did not read the file. That is not a difference
of opinion, it is a failure of homework, and it makes my R1 rule 10 ("the
amber/orange ramp is removed") an assertion made against a decision I had not
troubled to find. I withdraw the *framing*. I do not withdraw the *objection*,
and the rest of this section is the objection re-made against the rule as
written.

I also withdraw the specific remedy I proposed. My R1 §4.5 said "fill: solid
`ink`", flat at every level. Having now read the mechanism — the gradient painted
across the **track**, the fill revealing the left part of it, so a half-full bar
shows only the calm half — I think **the mechanism is better than mine.** It is
the most elegant thing in the current build. I am not asking for it to be
deleted. I am asking for four hexadecimal values inside it to change.

### 1.2 The values, exactly

```css
--bar-ramp: linear-gradient(90deg, #8fd14f 0%, #8fd14f 62%,
                            #f0c64b 82%, #f0904b 94%, #e8736f 100%);
```

Lime, held flat to 62%. Amber at 82. Orange at 94. Salmon at 100. That is a
traffic light. Not a traffic light *reminiscent* of one — the literal green /
amber / red sequence, in that order, at those positions.

### 1.3 The re-made argument, in four parts

**(a) The mechanism encodes fraction. The stops encode a verdict. These are
separable, and only one of them is the founder's idea.**

The correction says the ramp encodes fraction of budget, not a judgement. The
*mechanism* does — that is exactly what "painted across the track" achieves, and
it is the clever part. But a fraction can be encoded in any monotonic visual
sequence. The specific sequence chosen is the one sequence in Western visual
culture that means **fine → careful → stop.** That meaning is not something the
mechanism produces; it is something the reader brings, pre-verbally, before the
number is legible.

**The falsification test, which costs five minutes and settles this without
either of us being right by assertion:** hue-rotate the ramp. Keep the stop
positions, keep the luminance curve, keep the late-warming timing. Make it
`#8fd14f → #4fd1c1 → #4f8fd1 → #6f5fd1` — lime to teal to indigo. It encodes
fraction of budget exactly as faithfully as the current ramp does. Look at it
for ten seconds.

If it still reads correctly, the argument is over and I lose: the ramp was
carrying fraction and I was seeing ghosts. If it now reads as arbitrary or
meaningless — *if the colour stops doing its job* — then what the current ramp
is carrying is not fraction. It is the cultural meaning of green-amber-red, and
green-amber-red is a verdict. **I expect it to fail the test, and I would rather
be shown wrong by a swatch than argue about it.**

**(b) The calm end is not calm. It is green, and green is the other half of the
verdict.**

The recorded reasoning defends the *warm* end: don't redden early. Agreed, and
the late stops are correct. But the reasoning never examines the stop at 0–62%,
which is where every bar in the app spends most of its life. `#8fd14f` is not
neutral. It is approval. A user four days into the month sees three green bars
and is being told *you're doing fine* — which is a grade, delivered by a product
whose tone gate exists to stop it grading anyone. It is the same judgement as
red, wearing the friendly face, and it establishes the scale against which the
warm end will later be read. You cannot have a non-judgemental orange at 94% if
the thing it is contrasted with is a congratulatory green at 40%.

**(c) In dark mode the ramp is inverted against its own stated intent.**

The stated intent is "quiet until the number is genuinely worth looking at." On
`#0B0B0C`, `#8fd14f` is the highest-luminance, highest-chroma object in the
frame. It emits. So on the current default theme, **the state meaning "nothing
to see here" is rendered in the loudest colour in the product**, at 62% of the
track's width, three or four times per screen. That is not a difference of
taste; it is the intent failing on the substrate it ships on. It is also
independent of everything else in this section: even if the ramp survives, the
low stop cannot stay `#8fd14f` in Lamplight.

**(d) The harm lands in the gap the reasoning does not cover: more than one bar
at a time.**

The recorded reasoning reasons about *a* bar. `03-week.png` shows four. Side by
side, temperature becomes a **ranking**, and it ranks by fraction — the one
quantity that is least worth ranking by. Transport at 94% of a £40 budget is
orange. Everyday at 50% of £300 is green. The screen has just told the user, in
the only pre-verbal channel it has, that the £38 bucket is the urgent one and the
£150 bucket is fine. Doctrine says magnitude lives in the number and never in the
bar. The ramp does not put magnitude in bar *length* — it puts a magnitude in bar
*temperature*, and it is the wrong magnitude. This is the strongest version of my
objection and it is not addressed anywhere in the current reasoning, because the
reasoning was written about one bar.

### 1.4 What I am asking the founder to give up, and what he gets

**Give up — three real things:**

1. **Green as the resting state of every bar in the app.** Approval, withdrawn.
2. **Instant familiarity.** Amber-means-nearly-there needs no learning. A
   value ramp needs one look at the number beside it. That is a genuine cost and
   it lands hardest in bright sunlight and for low-vision users. The mitigation
   is structural, not hopeful: D3's rule 21 makes it illegal to render a bar
   without its figure adjacent, so colour is never the sole carrier of anything.
3. **A second information channel he currently gets for free.**

**Get — three things:**

1. **A claim that is true rather than asterisked.** Today the honest sentence is
   "no colour in Max tells you how you're doing, except the bars, which are the
   most numerous coloured objects in the product." That is not a differentiator,
   it is a caveat. Change four hexes and the sentence becomes "no colour in this
   app has an opinion about you," greppable, demonstrable in one second, and — as
   far as I can find — unoccupied in consumer finance.
2. **The cross-bar defect in (d) goes away entirely**, and with it the only place
   in the product where a magnitude leaks out of the number.
3. **His mechanism survives and gets better.** The track-painted gradient is the
   good idea. It currently spends itself on a traffic light, which is the one
   thing about it anyone could have predicted. Spent on value instead, it becomes
   a thing nobody else has.

### 1.5 The proposal: the density ramp

Keep the mechanism exactly as written. Change the stops from hue to value.

```css
/* Daylight */
--bar-ramp: linear-gradient(90deg,
    rgba(23,21,15,0.42)  0%,
    rgba(23,21,15,0.42) 62%,
    rgba(23,21,15,0.68) 85%,
    rgba(23,21,15,1.00) 100%);
```

The bar **darkens** as it fills. Every property in the founder's recorded
reasoning survives verbatim: the gradient is painted across the track, the fill
reveals the left part of it, the colour at any point means "this much of the
budget", a half-full bar is entirely calm because it has not reached the dark
stops, and the stops sit deliberately late. Nobody has ever read *darker* as
*bad*. Ink accumulating on paper reads as **used up**, which is the true
statement, rather than **you are in trouble**, which is a verdict.

It also solves the over-state for free. The ramp's endpoint is full `ink`, so the
over state is **the same colour with a different material** — solid `ink` becomes
hatched `ink`. Nothing changes temperature at 100%; the surface changes. That is
a stronger reading of "this is a different kind of thing" than any colour change,
and it means the 100% boundary is marked without a red existing anywhere.

In Lamplight the ramp inverts direction — `ink` on charcoal, 0.38 → 1.00 — so the
bar **lightens** as it fills, and the calm state is the dimmest object on screen
rather than the brightest. Intent (c) restored.

### 1.6 The three options, for the R3 decision list

| | What ships | Cost |
|---|---|---|
| **A · Density ramp** *(recommend)* | Founder's mechanism, value stops, over = hatched ink, no red in `src/` | Weaker at-a-glance signal; needs a device test in sunlight |
| **B · Keep the ramp** | Nothing changes. I amend rule 5 to "colour never encodes valence **outside the one bar**" | The concept survives with an asterisk on its single most visible component. Honest, and survivable. I would still fix `#8fd14f` in Lamplight under this option — (c) is independent |
| **C · Flat ink fill** | My R1 position | **Withdrawn.** It bins a good mechanism to win an argument |

**This is the founder's call, not the orchestrator's**, and he is reversing
himself if he takes A. He should take A only if the hue-rotation test in §1.3
fails the way I expect. If it passes, take B and I will have been wrong twice in
one round, which is fine.

---

## 2 · Conflicts with D3 (UX)

### C1 · The Month headline does not fit. This is arithmetic, not taste.

I fetched Instrument Serif and measured it. Advance widths at 1000upm: digits
average 0.386em (`1` is 0.249em, `0` is 0.460em), `£` 0.520em, comma 0.217em,
period 0.213em, space 0.170em. Tracking at −0.02em. Content width on a 360px
viewport with 24px gutters: **312px**.

| String | em | at 56px, tracked |
|---|---|---|
| `£245.68` | 2.75 | **147px** ✓ |
| `£3,027.24` | 3.35 | **178px** ✓ |
| `+£11,806.05` | 4.12 | **219px** ✓ |
| `£1,234,567.89` | 4.57 | **242px** ✓ |
| `about £3,030` | 4.53 | **241px** ✓ |
| `+£11,806.05 kept` | 5.80 | **308px** — 4px of margin. Fails at 320px viewport |
| `about £3,030 spare on 30 Aug` | 10.06 | **533px** — over by 221px |

**Findings:**

1. **My R1 low-confidence flag is resolved, and I was wrong to be worried.**
   Instrument Serif is unusually narrow. A pure currency figure survives at 56px
   on a 360px phone all the way to `£1,234,567.89` with 70px to spare. **Fraunces
   is not required. I withdraw the escape hatch.**
2. **The face survives. D3's phrasing does not.** `about £3,030 spare on 30 Aug`
   as a display element is 1.7× the available width. It is not close.
3. `+£11,806.05 kept` clears 360px by four pixels and fails on 320px devices. A
   headline with four pixels of margin is a headline that breaks.

**Whose rule wins: mine, and the fix is D3's to make.** Not because the type
scale outranks the architecture, but because the alternative is to drop the
display size to 33px, and at 33px there is no display element — there is just a
screen of medium-sized text, which is defect 2.3 from my R1 restated.

**New rule 22 (below): the display element contains a currency figure and nothing
else, plus an optional hedge word. Every other word moves to the qualifier line.**
Applied to D3's horizon table:

| Horizon | Display | Qualifier line |
|---|---|---|
| Today | `£38.20` | left today · of £78 |
| Week | `£245.68` | left this week · of £545 · 3 days |
| Month | *about* `£3,030` | spare on 30 Aug · £6,520 of £9,547 income used |
| Year | `£11,806.05` | kept this year · of £28,643.82 earned |

This is not a downgrade of his design. It is stronger: the eye lands on one
object, and the word that qualifies it is where every other qualifier in the
product already is. It also removes the `+` (see C6).

### C2 · The Rule of Four and my display rule compose — and his 4a is better than my 11.

They compose cleanly. My scale has exactly two money levels: `display` (56px
serif) and `figure` (17px sans 600 tabular). Ratio 3.3:1. The Month horizon at
four figures does **not** break the hierarchy, because the three supporting
figures are 17px inside running text, not three peers.

**But his clause 4a closes a hole I left open.** My rule 11 said "one element
≥40px". That permits four figures at 38px, which is four headlines in a smaller
costume — exactly the failure he names. His 4a caps every non-headline money
figure at 24px. **His is stricter and more failable. I adopt it and amend my
rule 11.** (Note for reviewers: my `title` level is 28px Sans 600 — "August" — and
is not a money figure, so it does not trip 4a. That looks like a collision and
is not.)

**One clause I am adding, because his cap permits an arrangement my hierarchy
cannot survive.** Four figures at one weight, laid out as a column or a row of
three, is a rank of peers, and a rank of peers is the wireframe defect. **New
rule 23: supporting money figures are set inside running sentences, never as a
standalone column or row.** D3's own qualifier lines already do this — I am
codifying what he did rather than asking him to change it.

### C3 · The horizon scrubber needs an affordance my system did not define. Here it is.

He asked for this directly and he is right that it is the highest-risk element in
his document. Specification:

- A 1px `rule` hairline runs the full content width. Four labels sit **on** it at
  `label` size (13/16, Sans 500, sentence case, no letterspacing — rule 14).
- Inactive labels `ink-3`. Active label `ink`.
- The active scope is marked by a **2px `ink` segment** replacing the hairline
  beneath that cell — the M3 rule-and-dot device from my R1 §6.2, doing work.
- **No pill, no wash, no fill.** A `clay-wash` pill behind the active label would
  make it a segmented control, which is the object he deleted.
- **The discovery mechanic is motion, and it is free.** Per D2 §2.3, the mark
  tracks the finger 1:1 during drag. A control that moves with your thumb before
  it snaps announces itself as continuous in one gesture. This is the strongest
  argument for building the scrubber rather than falling back to four tap ticks,
  and it is the thing to prototype first.
- Tap targets are 44px tall, invisible, centred on each label.

**Clay spent: zero.** Which matters, see C4.

### C4 · His home screen wants five clay elements. It gets one, and I am spending it somewhere counter-intuitive.

Candidates on his home: the add action, "See this week →", three ledger chevrons,
the active horizon tick, and the "Not now ▾" hush. My rule 6 allows two.

**Allocation, at rest:**

| Element | Colour | Why |
|---|---|---|
| The add action (FAB) | **`clay`** | The one thing the app wants you to be able to do |
| "See this week →" | `ink`, with a `rule` underline that goes solid `ink` on press | It is a destination, not a request |
| Horizon active tick | `ink` (C3) | Position, not attention |
| Ledger chevrons | `ink-3`, 1.75px | Structure |
| "1 thing to look at" label | `ink` | **Not** coloured. A flag that is coloured is an alarm |
| **"Not now ▾"** | **`clay`** | See below |

**The one deliberate inversion, and I think it is the best small idea in this
document:** on a screen where the app is asking something of the user, **the only
coloured object is the way out of it.** The flag is plain ink. The dismissal is
clay. Every other finance app colours the problem; Max colours the exit. It costs
nothing, it is one line of CSS, and it is a physical instance of "the ability to
turn Max down is what makes Max safe to turn on" rather than a claim about it.

Clay at rest on home: exactly two. Rule 6 holds.

### C5 · The tape needs a text-level affordance, and it forces an amendment to my clay rule.

"No money figure is inert" (his rule 11) means every figure is interactive. Under
my R1 rule 6 that is impossible — the week screen has four figures and clay caps
at two. So figures cannot be clay, and I need a non-chromatic openability mark.

**Specification:**

- **Supporting figures (17px):** a 1px dotted `rule` baseline, 3px below the
  baseline, `text-underline-offset: 3px`, `text-decoration-style: dotted`. This
  is D3's own desktop hover proposal promoted to a resting state on both
  platforms, because a hover-only affordance does not exist for a touch user.
- **The display figure (56px):** **no** baseline. It is the subject of the
  screen; a dotted line under a 56px serif figure is noise, and its affordance is
  the press itself (D2's Trace underline).
- **On press:** the dotted `rule` baseline becomes a **2px solid `clay`
  underline**, drawn left-to-right over `--d-tick`. This is D2's Trace affordance,
  and clay is exactly the right colour for it — it is "look here", for 140ms, on
  the thing you just touched.

**Amendment to rule 6:** the two-clay budget counts **elements at rest**.
Transient clay — a press underline, a travelling chip, a focus state — is
exempt, because a budget you can blow by touching the screen is not a budget.

### C6 · Precision-as-provenance: yes, my type system carries it, and it carries it *better* without colour.

Three carriers, none chromatic, all present in greyscale, in print, and in forced-
colours mode:

1. **The hedge word.** `about` set in **Instrument Serif Italic at 0.5× the
   display size**, `ink-3`, inline before the figure. Same family, so no new
   dependency (the italic is in the family Google serves; I fetched it to measure
   it). Italic is the historical typographic mark for *a different register*, and
   a small lightweight italic attached to a large upright figure is instantly
   legible as a hedge rather than a name.
2. **Shape.** A rounded estimate has no decimal group and ends on a zero. `£3,030`
   and `£3,027.24` are different objects at a glance, and the difference is in the
   glyphs, not in a colour anyone can fail to see.
3. **The tape.** D3's own §7.1 point 5 — an estimate's tape has no rows, only an
   assumption in words. That is the strongest carrier of the three, because it is
   the one the user reaches by asking.

**This requires an exception to my rule 12 (serif only ≥40px), and I am taking
it deliberately.** The exception is a single case, it is bound to a single
meaning, and it makes the rule's boundary carry information rather than dilute
it. New wording in §6.

**One correction to his rule 14 as written:** "rounded to the nearest £10 and
prefixed about" — at Year scale, `about £11,810` is a false precision of a
different kind. Round to a **significant-figure band, not a fixed £10**: nearest
£10 below £1,000, nearest £100 above. Otherwise the display element grows a
digit group whose last two positions are noise.

### C7 · The ledger has no figures, which my system handles, but it removes my only ranking device.

Three rows, label + count, hairline-separated, no money. That is my R1 §8 home
exactly and I have no objection — it is better than what I sketched. One
consequence to name: with no figures, the rows have **no intrinsic order**, and
my system's ranking device is size, which is unavailable. Rows must therefore be
ordered by something stated, not by taste. Recommend: **by when the user will
next act on them** — Weeks, One-offs, Recurring. Not alphabetical, not by
hidden total. If they are ordered by hidden total, the ledger is smuggling the
figures back in through sequence.

### C8 · His rule 16 does not survive contact with my palette, and needs restating.

> "No element in the top 40% of the first paint uses the over/negative colour role."

Under my system **there is no over/negative colour role**, so his rule is
trivially satisfied and therefore does no work. It should still exist. Restated:

> **No over-state *material* — the hatch — appears in the top 40% of the first
> paint of any route.**

Same test, same screenshot, still failable, and it survives whichever way §1.6
goes: under option B, substitute "the ramp's warm stops or the over colour".

---

## 3 · Conflicts with D2 (motion)

### M1 · The Deck's peek geometry is a dark-mode design. It disappears on paper.

D2 §3 Signature 1: peers at `scale −0.06`, **`opacity −0.45`**.

On `#0B0B0C`, dimming a light card keeps it visible — it goes grey against black,
and the contrast delta stays large. On Daylight, `card` is `#FFFCF6` and `paper`
is `#F2EEE6`. The luminance delta between a card and its ground is roughly **4%**.
Take 45% of the card's opacity away and the peer is composited toward the ground
it is already almost identical to. **The peeked sliver becomes invisible**, which
breaks D3's Stub Rule by execution — the exact failure mode he warned about.

D3 flagged this collision in his §10 without knowing which of us would cause it.
It is mine to fix.

**Ruling: D2's timing and tracking are right, his depth cue is wrong, and the
replacement is a material change, not an opacity change.**

> **On paper, "recedes" means "becomes the ground", not "becomes dimmer".**

- **Live card:** `card` fill (`#FFFCF6`), 14px radius, the one shadow token.
- **Peers:** `paper` fill, **no shadow**, 1px `rule` border, `scale −0.03`
  per unit of distance. Opacity stays **1.00**.
- The sliver is therefore read as *a hairline-bounded shape the same colour as the
  ground*, which is exactly what a card seen edge-on is. It is legible at 32px of
  exposure and it is legible in sunlight.
- Peer labels in the pager: `ink-3`. Active label: `ink`. The pager's 0.4×
  parallax is kept unchanged — it is good and it is his.
- **During drag, `opacity` is not animated at all.** The interpolated properties
  are `scale`, `background-color` (card ↔ paper) and `border-color` (transparent ↔
  rule), all continuous off the same normalised progress value, so his continuity
  requirement — "a half-swipe looks exactly half-committed" — holds.

**Same fix for sheets.** D3 wants the layer beneath visible and receded; D2
specifies a scrim. A black scrim over cream goes muddy olive. **Scrim is
`rgba(23,21,15,0.18)`** — ink at 18%, a warm dim — and the layer beneath scales to
**0.97**, not 0.94, because a cream page pushed further than that reads as broken
rather than deep.

### M2 · The Deck lives at `/week/[n]` now, and it needs re-deriving for three siblings.

D2 built the Deck for four cards on home. D3 deleted the home card stack and moved
the mechanic to `/week/[n]`, where it holds three categories. D2 anticipated this
exactly ("if D3 removes the home card stack entirely, signature 1 dies and I owe a
replacement").

**D3 wins on location and D2's mechanic survives intact.** His own argument is the
reason: horizontal swipe means *alternatives at the same level*, and Weeks /
Recurring / One-offs are not peers — they are different kinds of object at
different horizons. Three spending categories in one week are genuinely a set.
Swiping between non-peers teaches a false equivalence, and it would have been the
first thing a careful user noticed was wrong.

Geometry re-derivation: at three siblings, container − 88px with 32px slivers still
holds, but the pager becomes three labels, and the deck must be **bounded, not
cyclic** — three items wrapping is a carousel, and the rubber-band at 0.35× is what
makes bounded feel deliberate rather than broken. That is D2's number and it should
stay.

### M3 · The Trace should be inline, D3's tape should not be a sheet — and this repairs a bug in D3's own depth model.

D2's Trace unfolds beneath the figure in place, pushing content down; the figure
never moves. D3's tape is "sheet over sheet" at layer 2. They cannot both ship.

**D2 wins, and not on aesthetics.** Walk D3's own model: on `/week/[n]` (layer 1),
tap a figure → tape (layer 2), tap a row → `/transaction/[id]` (layer 3). His depth
cap is two, so "a third open replaces the second" — **the tape you were reading is
destroyed to show you the row you tapped inside it.** That is the worst possible
moment to lose context, in the one mechanism that exists to build trust.

Inline the tape and the problem vanishes: tape is not a layer, so the transaction
record is layer 2 and nothing is replaced. **D2's mechanic fixes D3's model.**

It also suits my system better, for a reason worth stating: this is a page, and a
page's evidence belongs *on* the page, indented beneath the figure, the way a
footnote does. A sheet says "you have gone somewhere". The whole point of the tape
is that you have not.

**Visual spec for the unfolded panel:** it is a **recess, not a raise** — `paper`
fill (i.e. it reads as a hole in the card), 1px `rule` hairline top and bottom, no
shadow, no radius. Rows: label `ink-2` at `body`, amount `ink` at `figure`
tabular. The operator line ("£545 you set, minus 4 things recorded") in `ink-2`.
Raw imported statement text, where present, at 12px system mono in `ink-3` — my
rule 16's single sanctioned mono context, doing the job it was reserved for.

### M4 · Horizontal swipe: D2's rule 13 and D3's navigation model are in direct contradiction.

D2 rule 13: *"Horizontal swipe appears in exactly one component (the Deck). No
other component binds a horizontal gesture."*

D3 §5.1 binds horizontal swipe in three places: the home header (change month), the
`/week/[n]` deck (change category), and `/year` (change year).

Neither has seen the other. **D3's model wins, and D2's rule is over-tight rather
than wrong** — he was protecting a *meaning*, and then wrote the rule about a
*component*. Restated so it protects what he intended and permits what D3 built:

> **Horizontal swipe means exactly one thing everywhere in the app: move to the
> sibling at this level. No component may bind it to anything else, and nothing
> that is not a set of siblings may bind it at all.**

Failable the same way, and it now catches the real hazard — swipe-to-delete, swipe
to reveal actions, swipe to change depth — which a component count does not.

### M5 · Numerals never tween: no conflict, and one place where D3's word needs pinning.

Full agreement, and it is load-bearing for my system rather than merely compatible:
`tabular-nums` on every figure exists so that a value that changes does not shift
the glyphs around it. Tabular figures plus instant value changes means an updating
number **does not move at all** — it is the same object with different content.
Tween it and tabular alignment is wasted.

**One thing to pin.** D3 §4.2 state 3: "home's week figure **settles** from £245.68
to £233.28". If "settles" means tween, it breaks D2 rule 8 and my rule 15's whole
purpose. **The figure cuts. The bar settles.** D2's Landing already says exactly
this at t=410; D3's prose should be read as agreeing with it.

### M6 · Bar fills never overshoot: no conflict, and it survives §1.6 either way.

Agreed on truth grounds. Under my density ramp there is one addition: because the
gradient is painted across the track and scaled by `gradientSizePct`, **an
animating width must animate `background-size` on the same curve and duration, or
the ramp slides through the fill during the settle** — the colour at a given pixel
would be briefly false, which is the same class of error D2 banned overshoot for.
`Bar.tsx` currently transitions `width` and `background-color` but not
`background-size`. Flagging it as a real defect for whoever implements the Landing;
I am not touching `src/`.

### M7 · The over-state cross-fade becomes a material cross-fade, and it is harder than a colour cross-fade.

D2's Landing: "the colour change happens at the end of the settle, as a 140ms
cross-fade — never during." Correct instinct, and it survives. But under §1.6 A
there is no colour change: solid `ink` becomes hatched `ink`.

You cannot cross-fade a `background-image` against a `background-color` in one
element. **Implementation note:** the fill needs two stacked layers — solid beneath,
hatch above at `opacity 0` — and the 140ms cross-fade animates the hatch layer's
opacity. Same token, same curve, same timing as D2 specified. It is one extra div
and it should be inside `Bar.tsx`, not at any call site.

### M8 · Errors need a colour I do not have. Here it is, and it is not red.

D2 §4: "field border to the error colour." There is no error colour, and rule 4
says there never will be.

**Specification:** error field border is **`clay`, 2px** — this is precisely the
moment to spend attention, and clay's whole definition is "look here, or touch
here". The message below is `ink` at `body` (not `ink-2` — an error the user must
act on is not supporting copy). No icon, no shake (D2 rule 6, agreed), no fill
tint. On a form, the error state spends the screen's second clay slot, which is
correct: while there is an error, there is nothing else worth colouring.

### M9 · The loading block's opacity range assumes a high-contrast placeholder.

D2 §4: the block breathes `opacity 0.45 ↔ 0.7`. If the block is filled with `rule`
(`#E0D8C8`), it is already only ~8% off `paper`; at 0.45 opacity it is invisible,
and the "breathe" is a 3% oscillation nobody will see.

**Specification:** the loading block is `ink` at **6% ↔ 10% alpha**, breathing over
1600ms `linear`. Same perceptual amplitude he intended, on this ground. In
Lamplight: `ink` at 8% ↔ 13%.

### M10 · Which of my colours his three moments use — the direct answer he asked for.

| Moment | Colours |
|---|---|
| **Deck** (`/week/[n]`) | Live card `card` + shadow token. Peers `paper` + 1px `rule`, opacity 1.00 (M1). Pager `ink-3`, active `ink`. **Clay: zero.** A container does not get the attention colour |
| **Trace** | Press underline **2px `clay`**, transient, exempt from the rest budget (C5). Panel `paper` recess, `rule` hairlines, rows `ink-2`, amounts `ink`, mono provenance `ink-3`. **Clay: one, for 140ms** |
| **Landing** | The travelling chip is **`clay` fill with `card`-coloured text.** This is the single best use of the one chromatic in the product: the one moment where colour means *this is your thing, moving, and it is going somewhere.* Chip vanishes at t=410; the row's figure updates in `ink`; the fill settles per §1.6. **Clay: one, transient** |

The pattern underneath: **clay marks intent and consequence — the thing you are
about to do, the thing you just did, and the way out. It never marks a state.**

---

## 4 · What I concede

Plainly, and these are adjustments, not courtesies.

1. **The ramp mechanism is better than my flat fill.** Gradient across the track,
   fill revealing it, so colour means fraction and a half-full bar shows only the
   calm half. I proposed deleting it because I had not read it. §1.6 option C is
   withdrawn.
2. **My R1 §2.7 misattributed the fault.** I said the ramp "fails the doctrine's
   stated intent". The mechanism serves the intent. The *stops* fail it, and only
   at the low end and only in dark mode. That is a much smaller and much better
   claim.
3. **D3's clause 4a is stricter and better than my rule 11.** Adopted.
4. **My R1 low-confidence flag on Instrument Serif was unfounded** — I guessed a
   0.5em digit width and the real figure is 0.386em. Measured, resolved, escape
   hatch withdrawn. I should have measured in R1.
5. **My hatch spec has a defect I did not catch.** `Bar.tsx` renders `week`-size
   bars at **3px**. A 45° hatch at 1.5px on 3px pitch inside a 3px-tall element
   aliases into dirty grey — it is not a texture, it is a smear. Fix: **minimum
   bar height 6px for any bar that can enter the over state**, and the pitch drops
   to 1px line on a 2.5px pitch at that size. **I have not tested this on a device
   and it may still alias at 6px.** It is the least confident thing in this
   document. The safety net is D3's rule 21 — the figure is always adjacent — so a
   failed texture costs legibility, never truth.
6. **D3's tape is the best single idea across all three R1 documents.** More than
   my no-red, more than the serif. It is simultaneously the wow moment and the
   compliance mechanism for non-negotiable 5, and everything in my system should
   bend to serve it — which is what C5 and M3 are.
7. **D3 is right that the ledger's stub-with-count beats my R1 §8 sketch**, which
   still showed supporting figures at rest. His is a genuine density win that
   costs nothing.
8. **D2's "no motion stands between a finger and a result" is a stronger
   formulation of restraint than anything in my document**, and it is the reason
   his loading spec has no shimmer sweep. I would have accepted a shimmer.

---

## 5 · Unresolvable — for the founder

Three. Nothing else here needs him.

**F1 · The bar ramp.** §1.6. Three options, recommendation A, and it reverses a
decision he made personally with reasons recorded. The hue-rotation test in §1.3
should be run before he decides — it takes five minutes and it makes the decision
evidential rather than a contest between his taste and mine. **If A is refused, B
is honest and I will write it up without sulking.** C is withdrawn.

**F2 · `+£11,806.05` leaving home at rest.** D3 escalated this; I am adding one
argument from my seat, because it changes the shape of the question. **In a system
with no valence colour, a `+` or `−` prefix becomes the only pre-verbal good/bad
mark left in the product.** Green is gone, red is gone, and a plus sign in front of
a large figure is doing exactly the work they used to do — and it is doing it on
the first object of the first paint. So the question is not only "does this figure
belong at rest" but "may any figure carry a sign". My answer to the second is a
new rule (24). On the first I now back D3: it goes to the Year horizon, one gesture
away, and it loses the `+` when it gets there.

**F3 · The name.** Unchanged from R1 §7 — recommendation **Spare**, runner-up
**Leeway**, five persona interviews settle it. Nothing in R2 moved it and I am not
re-litigating it here.

---

## 6 · Revised rules

Only the ones that changed, plus new ones. Everything in R1 §9 not listed here
stands as written.

**Amended:**

> **5 · Colour never encodes valence.** No hue in Max means good, bad, safe,
> risky, ahead or behind. Under and over budget are the same hue and differ only
> in material. *Pending F1: if option B is taken, this reads "outside the one
> bar's fill ramp", and the exception is stated wherever the rule is.*

> **6 · At most two `clay` elements are visible per screen at rest.** Transient
> clay — a press underline, a travelling chip, a focus or error state — is exempt.
> Countable in a screenshot of the resting screen.

> **9 · The over-budget state is a texture, not a colour** — the ramp's endpoint
> colour, switched from solid to hatch. 45°, `paper` lines on `ink`. Any bar that
> can enter the over state is **at least 6px tall**; pitch is 1px on 2.5px at 6px,
> 1.5px on 3px at 8px and above. Rendered as two stacked layers inside `Bar.tsx`
> so the state change can cross-fade (M7). *(Requires ratification; see §1.6.)*

> **10 · The bar's fill ramp encodes fraction in value, not in hue.** Stops are
> steps of `ink` alpha, monotonic, arriving late (flat to 62%, 0.68 at 85%, 1.00
> at 100%). No hue changes anywhere along a bar at any fill level. *(Pending F1.)*

> **11 · Exactly one element per screen is ≥40px, and no money figure other than
> that one exceeds 24px.** *(Second clause adopted from D3's 4a.)*

> **12 · The serif is used only at ≥40px, with one exception:** the italic hedge
> word attached to a display estimate, set at 0.5× the display size in `ink-3`.
> No other sub-40px serif exists in the product.

**New:**

> **22 · The display element contains a currency figure and nothing else,** plus
> an optional italic hedge. Every qualifying word moves to the line beneath. Hard
> budget: **5.5em including tracking** — 308px at 56px, which is the 360px
> viewport's content width. Failable by measurement.

> **23 · Supporting money figures are set inside running sentences,** never as a
> standalone column or row of peers. Four figures at one weight in a stack is a
> table, and a table is the wireframe.

> **24 · A `+` or `−` prefix appears only where the sign is arithmetic, never
> where it is evaluative.** In a product with no valence colour, a sign is the
> last pre-verbal verdict available and it is subject to rule 5. A net position is
> stated as `£11,806.05 kept`, not `+£11,806.05`.

> **25 · Depth is carried by material, not by opacity.** A receded object changes
> its fill toward `paper` and gains a `rule` border; it does not fade. Nothing in
> the product signals "behind" by becoming transparent. Scrim is
> `rgba(23,21,15,0.18)`; a receded layer scales to 0.97.

> **26 · Every money figure below the display size carries a 1px dotted `rule`
> baseline** marking it as openable, on touch and pointer alike. The display
> figure carries none. On press, the baseline becomes a 2px solid `clay`
> underline. Failable: any rendered currency string without one is either inert
> (breaking D3's rule 11) or lying about being openable.

> **27 · Horizontal swipe means exactly one thing everywhere: move to the sibling
> at this level.** No component binds it to anything else, and nothing that is not
> a set of siblings binds it at all. *(Supersedes D2's rule 13.)*

---

## 7 · Report

**Written:** this file only. Nothing in `src/` touched, no git commands, no other
files created. I read `bar-grammar.ts`, `Bar.tsx` and `globals.css`, and I fetched
Instrument Serif's regular and italic `woff2` from Google Fonts into the scratchpad
to measure advance widths — that is the source of every number in C1.

**What changed in my position:** the ramp remedy (withdrawn and replaced), the
Fraunces escape hatch (withdrawn, resolved by measurement), rule 11 (tightened to
D3's), rule 6 (scoped to rest), and rule 12 (one exception added). Six new rules.

**What I am not confident about:**

- **The hatch at 6px.** Untested on a device, and it may alias. §4.5. If it does,
  the fallback is a 2px `ink` cap mark at the track's right end and no texture,
  which is weaker and which I have not designed.
- **Whether the density ramp is legible enough in sunlight.** A value ramp is a
  weaker at-a-glance signal than a hue ramp and I am trading that away on purpose.
  I believe D3's figure-adjacent rule makes it safe. I have not proven it.
- **My §1.3 falsification test predicts the founder's reaction.** I could be
  wrong about what he sees, and if the hue-rotated ramp reads fine to him, my
  whole §1 is a long way to arrive at nothing.
- **I have still not seen empty, loading or error states**, only the four
  screenshots. M8 and M9 are specified from D2's description, not from a design.
- **C1's measurements assume no font-feature or optical-size adjustment and a 24px
  gutter.** If the gutter is 20px the numbers get 8px looser; if a `letter-spacing`
  other than −0.02em ships, `+£11,806.05 kept` moves across the line in either
  direction. Rule 22 exists so that string never has to be measured again.
