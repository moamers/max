# Ravel — motion spec

**The prototype is the deliverable.** Open `prototype.html` on a phone. This
document exists so someone can wire it into the Next.js app without guessing,
and so a reviewer can fail me on something specific.

Supersedes `r1-motion-grammar.md` where they disagree. It keeps that document's
token scale, its pairing rules and its reduced-motion discipline; it replaces
its signature moments, because the brand changed and the Deck died with
structure A.

---

## 0 · The one idea

The old tab change **cut and rebuilt**: it set the body to `opacity: 0`,
replaced `innerHTML`, and faded back in. Every element on screen was destroyed
and a different one was constructed. That reads as a page load, and no amount of
easing fixes it.

Fluid interfaces do the opposite. **Elements persist and travel.**

> **The headline you were reading does not disappear. It becomes the line it
> is in the wider scope, and the screen reflows around where it landed.**

`£245.68` is the week's headline. It is also, exactly, the Week 4 row of the
month. So when you move week → month, it does not vanish and a new figure
appear — the same figure travels down and takes its place in the list, the
week's three category cards fold into the figure they belonged to, and the
month's cards and rows unfold out of where it landed. Month → year does the
same thing one level up: `about £3,030` is the month's headline and the year's
August row.

Coming back is the exact inverse: a line promotes to the headline and the
narrower scope blooms out of it.

That is the whole design. Everything else is in service of it.

---

## 1 · Duration scale

Five steps. Nothing between them, nothing above them.

| Token | ms | Name | For |
|---|---|---|---|
| `--d-tap` | **90** | tap | Press / release. Also the ceiling under reduced motion. |
| `--d-tick` | **140** | tick | In-place state change: chip, toggle, colour cross-fade, an underline drawing. |
| `--d-move` | **220** | move | Something moves within the current screen. The workhorse. Also every exit of a `travel`. |
| `--d-travel` | **320** | travel | Something crosses a boundary: scope, sheet, the flight of a figure. |
| `--d-settle` | **480** | settle | A bar fill resolving to a new value. **One consumer, nothing else.** |
| `--stride` | **30** | stagger stride | Max 4 staggered items → total stagger never exceeds 120ms. |

Duration does not scale with distance. A 40px move and a 600px move both take
`travel`.

**Easings**

| Token | cubic-bezier | For |
|---|---|---|
| `--e-standard` | `.2, 0, 0, 1` | Default. Anything A→B that stays on screen. |
| `--e-enter` | `.05, .7, .1, 1` | Arriving. Pure deceleration. |
| `--e-exit` | `.3, 0, .8, .15` | Leaving. Never on anything that comes to rest on screen. |
| `--e-settle` | `.34, 1.2, .64, 1` | ~4% overshoot. **Geometry only.** Never a numeral, never a bar fill, never a colour. |
| `linear` | — | 1:1 gesture tracking only. |

**Three rules that govern the rest**

- **Exit is one step down.** Entered on `travel` → leaves on `move`, with
  `--e-exit`. `move` in → `tick` out.
- **Back is the exact numeric inverse of forward.**
- **A finger has no easing.** While a pointer is down the element tracks 1:1,
  `transition: none`. Curves apply on release only.

**How the scale is wired.** All five are CSS custom properties on `:root`, and
JS reads them live (`D("travel")`). That is what makes the two judging controls
one-line changes and keeps them honest:

```css
:root[data-rate="4"]{ --d-tap:360ms; --d-tick:560ms; --d-move:880ms;
                      --d-travel:1280ms; --d-settle:1920ms; --stride:120ms }
:root[data-rm="1"]  { --d-tick:var(--d-tap); --d-move:var(--d-tap);
                      --d-travel:var(--d-tap); --d-settle:var(--d-tap); --stride:0ms }
```

There is no second place where a duration lives. Nothing in the app may hard-code
a millisecond value.

---

## 2 · THE FOLD — the scope change

*Not a signature moment. It is the app's peer-navigation grammar, and it
replaces R1 §4's "peer navigation: cross-fade at tick, never slide". That rule
produced the defect.*

### The technique

FLIP, twice, with no library.

1. **FIRST.** Before touching the DOM, measure every `[data-key]` and every
   `[data-conv]` in the outgoing view, plus the outgoing headline. One
   synchronous burst of `getBoundingClientRect`.
2. **Freeze.** The outgoing view goes `position: absolute; inset 0` so the
   incoming view can take the flow. It does not move a pixel doing this.
3. **Build + LAST.** Render the incoming view, append, measure it the same way.
   Still the same synchronous burst — measured: **30 reads, spanning 11.6ms,
   all finished 12.5ms after the tap, none inside a rAF.**
4. **Play.** Transform and opacity only, from here on.

### The pairing

Every figure that exists in two scopes carries the same `data-key`:

| key | week | month | year |
|---|---|---|---|
| `fig-week` | the headline | the Week 4 row | — |
| `fig-aug` | — | the headline | the August row |
| `fig-year` | — | — | the headline |

The first key present in both views is the shared element. If there is no match
— week ↔ year, which skips a level — it falls back to **headline → headline**:
the figure still travels, and cross-fades its glyphs at the midpoint because it
is genuinely a different number.

### The choreography

| What | From → to | Token / easing |
|---|---|---|
| **The shared figure** | its rect in the old view → its rect in the new one | `travel` / X on `standard`, Y on `enter` |
| **The detail, leaving** | → 42% of the way toward the *outgoing* view's anchor, `scale .93` (out) / `1.06` (in), opacity → 0 | `move` / `exit`, stride 30, cap 4 |
| **The detail, arriving** | ← 42% of the way from the *incoming* view's anchor | `move` / `enter`, delay `tick`, stride 30, cap 4 |
| **The period identity** | opacity only, in place. **It never slides.** | out `tick` / `exit`, in `move` / `enter`, delay `tick` |
| **The pill indicator** | translateX, with a 1.14 scaleX squash at the midpoint | `travel` / `standard` |
| **The mark** | ±13 units apart, −5°, and back to rest | `travel`, `sin(πt)·standard(1−t)` |

**The anchor rule is what makes back the exact inverse of forward.** Each view
has its own anchor: the position the shared figure occupies *in that view*.
Outgoing detail folds toward the outgoing anchor; incoming detail blooms from
the incoming anchor. Reverse the direction and every element retraces its path.

### The figure's flight, precisely

Two congruent ghosts in an overlay layer (`#fly`), so neither is affected by the
view-level animations:

- A wrapper animates **translateX on `--e-standard`**; an inner div animates
  **translateY on `--e-enter`**. Two curves on two axes bends the path into an
  arc with no path maths and no dependency.
- Ghost A (the old glyphs) scales `1 → 1/k` and fades out over the first 62%.
- Ghost B (the new glyphs) scales `k → 1` and fades in over the last 76%.
- `k` is the ratio of the two rendered heights.
- The real elements at both ends are `visibility: hidden` for the duration and
  restored on landing.

**Why the two figures share a typeface.** Any figure that participates in a
morph is set in Newsreader with `tabular-nums`, at both ends. Same family, same
figures, so the width ratio equals the font-size ratio exactly and the uniform
scale lands the glyphs on top of each other. Set the destination in a different
face and the cross-fade shows as a width mismatch. This is a typography rule
that exists for a motion reason, and it is the reason the month and year list
figures are Newsreader rather than Libre Franklin.

### Drilling in

The `open ›` control on the current-week and August rows runs the same
transition with the row as the source. Tapping the row's *figure* opens the Tape
instead. **Figure means evidence; the row means navigate.** One meaning per
target, everywhere.

### Reduced motion

No travel and no fold. The outgoing view cross-fades out and the incoming one
in, both `90ms`, opacity only, in place. The figure that carries over then
flashes `opacity .45 → 1` over 90ms so the eye is still pointed at where it
went. The indicator jumps. The mark does not move.

*Verified: under reduced motion the fold runs `[90]` and nothing else, and no
running animation contains a `transform` keyframe.*

---

## 3 · THE TAPE — signature 1

Touch any figure; its evidence unfolds beneath it. **The figure does not move,
does not scale, does not change colour.** That discipline is what makes it read
as an object you opened rather than a widget that reacted.

*Verified: the figure's bounding rect is identical before, during and after —
`{x:313, y:264}` at every sample.*

### The technique — a FLIP for a height change

The constraint is that nothing may animate `height`. So:

1. The panel takes its natural height **instantly** (`style.height = H + "px"`).
   The layout pushes; one forced read, outside any rAF. *Measured: exactly one
   layout read per open, 1.1ms after the tap.*
2. The panel's inner content starts at `translateY(-H)` and is clipped by
   `overflow: hidden`, so the panel box looks empty.
3. Every element **below** the panel in flow starts at `translateY(-H)` — which
   is precisely where they were before the panel appeared.
4. Both release to `0` on the same duration and curve. One motion, not two.

`travel` / `--e-standard`. Detail rows enter `opacity 0→1, translateY 6px → 0`,
`move` / `--e-enter`, stride 30, cap 4.

**Affordance.** A 2px `--color-primary` underline draws left-to-right under the
figure, `scaleX(0 → 1)` from the left, `tick` / `standard`. It is the only thing
that happens in the first 140ms, and it is the receipt for the tap.

**Fold.** Height collapses on `move` / `standard` — exit is one step down. Rows
fade at `tick` with **no** stagger; leaving is not choreographed. Opening a
second figure while the first is open runs both in the same frame. **Nothing
queues.**

### Every figure has real evidence

This is doctrine 5, not decoration. Every tape in the prototype sums to the
figure it opens, and the totals are derived, not typed:

- `£245.68 left` = `£545` set − `£53.64` bills − `£210.45` − `£29.21` − `£6.02`
- `£210.45 Everyday` = seven transactions
- `about £3,030` = `£9,547` − `£3,767.70` − `£573.00` − `£2,180.00` =
  **`£3,026.30`**, and the tape says so — that is what justifies the word
  *about*, and it is the only place the exact figure appears
- `+£11,806.05` = five month rows

> **Note for whoever seeds the fixtures.** The figures in `r11-the-look-settled.html`
> did not add up: the three category amounts sum to `£245.68`, which was also
> presented as the amount *left* of `£545`. Both cannot be true. I reconciled it
> by naming the missing `£53.64` as the four settled bills the screen already
> flags, which makes `545 − (53.64 + 245.68) = 245.68` correct. The current week
> also moved from 17–23 Aug to 24–30 Aug so that the week headline and the
> month's Week 4 row are genuinely the same number — the shared element only
> works if it is actually shared.

### Reduced motion

No unfold. The panel appears at full height instantly, content below shifts
instantly, the panel fades `0 → 1` over 90ms. The underline appears rather than
draws. Haptic still fires. Same content, same number of taps.

---

## 4 · THE LANDING — signature 2

`t = 0` is release of **Add it**. The write goes at `t = 0`, once, optimistic.
**Zero milliseconds of this blocks.**

| t (ms) | What | Token / easing |
|---|---|---|
| 0 | Button press state. Write dispatched. | `tap` / `standard` |
| 0–220 | The sheet leaves; the scrim fades; the app returns from `scale(.985)`. | `move` / `exit` |
| 0–220 | The amount chip does **not** leave with it. It lifts out at full opacity, `scale 1 → .72`. | `move` / `standard` |
| 90–410 | The chip travels. X on `standard`, Y on `enter` — the same two-curve arc as the Fold. | `travel` |
| 410 | Chip `scale → 0`, `opacity → 0`. **Haptic fires here**, on the consequence, not the input. The row's number **re-states instantly**. | `tick` / `exit` |
| 410–890 | The bar fill settles to its new fraction. Decelerating, **no overshoot, ever**. | `settle` / `enter` |
| 890 | *Over case only:* the fill cross-fades to `--color-spark`. | `tick` / `standard` |

Total 890ms. Fully readable at 410ms. Any input cancels everything to its end
state on the next frame.

**The bar.** `transform: scaleX()` with `transform-origin: left`, on a track with
`overflow: hidden; border-radius: 99px` so the fill's ends are clipped rather
than scaled. Never `width`. The fill is capped at `scaleX(1)`: past the budget
the **whole fill** turns `--color-spark`, at the *end* of the settle, as a 140ms
cross-fade. Never during, never faster, never a pulse, never a shake. **Motion
does not editorialise.**

An overshoot on a fill is a fraction that is false for four frames. `--e-settle`
is the prettiest curve we own and it is banned here. TRUTH outranks delight.

**The copy states the fact and never the verdict.** Over reads
`£49.45 past the £260 you set`. Screen 07 of the design handoff specifies the
word "Overspent"; `src/lib/tone.ts` bans it; `TONE > METHOD`, so the gate wins.
**Flagging as instructed.** *All copy in the prototype was run through the
actual `BANNED` list from `tone.ts`: clean.*

### Reduced motion

No flight. The sheet closes instantly, the number re-states, the fill jumps to
its final `scaleX`, and the destination row alone fades `0.6 → 1` over 90ms so
the eye is still pointed at what changed. Haptic still fires.

---

## 5 · THE ARRIVAL — signature 3

**The slot the mark morph vacated, and I am claiming it for the mark.**

### The case

Counterbalance is two soft shapes and a coral sliver where they intersect. Read
the SVG and you find the thing that makes this worth a signature slot: the green
half is the **exact 180° rotation of the violet about (90, 90)**, and the coral
is not a drawn shape at all — it is the green path clipped by the violet one.

So the sliver *only exists while the halves overlap*. Pull them apart and it is
gone; bring them together and it appears, at exactly the rate they meet. The
arrival is therefore not an effect applied to the logo. It is the logo's own
construction, played forwards.

> The two halves come in from opposite ends of the axis they share, the
> assembly rotates into rest, and the coral appears because they met.

R1 §3 rejected a crafted app-open sequence on the grounds that it "fires before
the user has done anything, so it can only ever be in their way." That objection
is about *blocking*, not about existing, and it is answerable: this sequence
blocks nothing, gates no tap, and ends on the first pointer-down. I am
overruling that line and I am saying so rather than quietly ignoring it.

### The choreography

| t | What | Token / easing |
|---|---|---|
| 0–320 | The halves converge along the axis (62 user units → 0) and the assembly rotates −17° → 0. The coral resolves as a consequence. Mark fades in over `tick`. | `travel` / `enter`, rAF |
| 320–640 | The mark **travels** to its slot in the header, `scale 96px → 26px`. | `travel` / `standard` |
| 460–~800 | Wordmark, then the screen, then the chrome, assemble behind it. `opacity 0→1, translateY 8px → 0`, stride 30, cap 4. | `move` / `enter` |

~800ms end to end, none of it blocking, all of it cancellable. It waits for the
webfont so the figures do not reflow under it, but **never more than 150ms** —
a brand moment may not hold up the first paint.

**Replay:** tap the mark. That keeps it user-initiated, which is the rule.

### The rest of the mark's life

Rest geometry is **exactly** the kit's `ravel-*-symbol.svg`, and the three fills
map to `--color-primary`, `--color-health`, `--color-spark`, so the mark is
theme-correct by construction rather than by having four copies of it.

The same gesture recurs at a fraction of the amplitude: on a Fold the halves
part by 13 units and rotate −5°, and return. **It answers where you are. It
never answers a value.** Geometry that responds to spending is a progress ring,
which is banned.

### Reduced motion

The mark is simply present, at rest, and the screen fades up over 90ms. No
convergence, no travel, no rotation.

---

## 6 · The functional layer

| Thing | Behaviour |
|---|---|
| **Sheet** | `translateY(101% → 0)`, `travel` / `enter`; scrim `move` / `standard`; the app behind takes `scale(.985)` on `travel` / `standard`. That last one is the weight. |
| **Sheet dismiss** | 1:1 finger tracking with `transition: none`. Commits past 25% of height or 0.4px/ms. On release it eases; while held it does not. |
| **List rows** | Stagger on first paint and on a signature moment's detail rows only. Stride 30ms, max 4. **Never** on a list the user scrolled to. |
| **Pill indicator** | Slides on `travel` / `standard` with a 1.14 scaleX squash at the midpoint. Tabs are equal-width so the indicator only translates — a capsule that changes width distorts its own end caps. |
| **Pressed states** | `scale(.975)` on `tap` / `standard`. Under reduced motion, opacity instead of scale. |
| **Numerals** | Instant. Always. |
| **Loading** | Nothing spins. Not built in the prototype; R1 §4's rule stands unchanged. |
| **Errors** | Never shake, never flash. R1 §4 stands. |

**Haptics.** Three call sites, matching the three things that *change*: Tape
open (8ms), Fold commit (8ms), Landing at t=410 (18ms). Never on tap-down, never
on an error, and **never on crossing a budget** — the app must not flinch in
your hand when you go over. `navigator.vibrate` is Android-only and is a
progressive enhancement; nothing is confirmed only haptically.

---

## 7 · What must never animate

1. **A numeral's value.** No count-ups, no odometers, no rolling digits. Every
   frame of a tween is a specific claim that is true of nothing, in a product
   whose parser has misread real data twice. Figures may move through space,
   cross-fade, or re-state at a threshold. They may never tween a value.
2. **A bar fill past its true value.** No overshoot, no bounce.
3. **Colour as alarm.** No pulsing, throbbing, flashing. The over state is
   stated, then still.
4. **Anything on a timer the user did not start.** No ambient loops, no idle
   animation, no attract loop. If the user is not touching Ravel, Ravel is not
   moving.
5. **The header and the period identity.** Where you are never slides.
6. **`width`, `height`, `top`, `left`.** Transform and opacity only for anything
   that moves. The two places a layout value is *set* — the Tape's panel height
   and the fill's `scaleX` target — are set instantly and then FLIPped.
7. **The mark, in response to a value.** Ever.
8. **Type.** No animated weight or size beyond a shared-element scale.
9. **Anything that delays the keyboard or the first tap.** Including a
   render-blocking webfont — the prototype loads Google Fonts non-blocking for
   exactly this reason, and this was a live defect: a blocking stylesheet
   prevented the app's script from executing at all.

---

## 8 · Failable rules

A reviewer should be able to fail this mechanically.

1. No duration exists outside `{90, 140, 220, 320, 480}` × the rate multiplier.
2. No easing exists outside the four named curves plus `linear`.
3. `--d-settle` has exactly one consumer: a bar fill's `scaleX`.
4. Every exit is one step below its enter and uses `--e-exit`.
5. A back transition is the numeric inverse of its forward transition.
6. `--e-settle` never appears on a numeral, a bar fill, or a colour.
7. No numeral transitions its value. Any tween on a number is a bug.
8. No bar fill overshoots.
9. Every animation is cancellable to its end state on the next input. No
   animation gates a tap, a keystroke or a navigation. *Verified: tapping Year
   80ms into a week→month fold lands on Year with one view in the DOM, no
   orphaned ghosts and nothing left hidden; four scope taps in one tick land
   clean.*
10. Total stagger ≤ 120ms, stride 30ms, ≤ 4 items.
11. No `transition` or easing is active on an element while a pointer is down on
    it.
12. Under `prefers-reduced-motion: reduce`, no animation exceeds 90ms, no
    `transform` is animated, and every task completes in the same number of taps.
13. All layout reads happen in one synchronous burst before any animation
    starts; zero `getBoundingClientRect` / `offsetHeight` inside a rAF.
14. No literal colour in any app rule — only the seven kit tokens and
    `color-mix` derivations of them.
15. Three named signature moments: Tape, Landing, Arrival. A fourth costs one of
    these.
16. No motion dependency in `package.json`.
17. No screen, sheet or list uses a full-width horizontal slide.

---

## 9 · Colour

Everything derives from the kit's seven tokens. There is no hex anywhere in the
app's own rules — the only literals in the file are the four `[data-theme][data-mode]`
blocks copied verbatim from `themes/ravel-themes.css`, so the theme switch
another agent is wiring will land without touching motion code.

```css
--ink:   var(--color-text);
--ink2:  color-mix(in oklab, var(--color-text) 66%, var(--color-canvas));
--ink3:  color-mix(in oklab, var(--color-text) 46%, var(--color-canvas));
--rule:  color-mix(in oklab, var(--color-text) 13%, var(--color-surface));
--track: color-mix(in oklab, var(--color-text) 13%, var(--color-canvas));
--on-primary: var(--color-outline, var(--color-surface));
```

`--on-primary` is the one that needs a decision from whoever owns theming.
Butter Static's primary is a pale lilac that white type cannot sit on, and that
theme supplies `--color-outline` (near-black) for exactly this kind of job;
Quiet Voltage does not supply it and falls back to `--color-surface` (white on
violet). The fallback chain gets both themes legible, but it is inference from
the token set rather than something the kit states, so please confirm it.

The bar fill is `--color-text` — a flat ink fill, no ramp — turning
`--color-spark` at 100%. `--color-money` is unused: it exists only in Quiet
Voltage, and motion must not depend on a token one theme does not have.

---

## 10 · Wiring it into the app

- **`useDebouncedCommit()` is untouched by all of this.** The Landing fires its
  write once, on commit, at `t = 0` — one write per user action. Nothing here
  writes on change, and nothing here should tempt anyone to. Non-negotiable 8
  stands.
- **The Fold needs both views renderable at once.** In React that is two
  `<Scope>` subtrees under one relatively-positioned stage, the outgoing one
  `position: absolute` for one commit. `useLayoutEffect` does the FIRST/LAST
  measurement in a single pass, exactly as the prototype does — same order, same
  one burst.
- **`data-key` is the whole contract.** A figure that appears in two scopes must
  carry the same key and be set in Newsreader at both ends. Get that wrong and
  the transition silently degrades to the headline→headline fallback, which
  still looks fine — which is why it needs a test, not an eyeball.
- **Route boundaries.** Week / month / year are peers under one shell. If they
  become separate routes with a remount between them, the shared element is
  impossible and the fold dies. The stage must outlive the scope change.
- **`prefers-reduced-motion`** is read at animation time, not at mount, so a
  user changing it mid-session gets the right behaviour on the next interaction.

---

## 11 · Not confident about

- **`backdrop-filter` on the nav pill**, inherited from the settled look. A live
  blur behind content that is animating is the most likely source of dropped
  frames on a mid-range Android. Headless showed no frame over 16.8ms, but
  headless is not a phone. If it stutters, the fix is one line: drop the blur
  and give the pill a solid `--color-surface` at 92%.
- **The 90ms lead-in before the Landing's chip starts travelling.** Right on a
  phone; on a slow desktop paint it may read as a hitch. The one number here I
  expect to move after real-device testing.
- **The month cards' Tape opens beneath the whole card row**, not directly under
  the tapped card, because the row scrolls horizontally and a panel inside a
  168px card in a horizontal scroller is worse. It is a compromise with "unfolds
  directly beneath it" and I would like a second opinion on it.
- **The mark's separation axis** is `(0.87, 0.49)`, eyeballed from the two blob
  centres. It looks right; nobody has checked it against whatever the designer
  had in mind.
- **The wordmark is set in Libre Franklin 600**, not the kit's URW Gothic. It is
  a stand-in for the motion prototype, not a lockup decision.
