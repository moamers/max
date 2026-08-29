# Max — motion grammar (R1, D2)

**Round 1 · Motion & Interaction Director · written without sight of D1 or D3.**

Scope: timing and easing tokens, three signature moments, the invisible
functional layer, gestures, haptics, what must never move, the reduced-motion
contract, and the rules a reviewer can fail me on.

---

## 1 · The principle

> **Nothing in Max appears from nowhere or vanishes into nothing: every element
> arrives from a place the user can see and leaves toward a place they could
> point at — and no motion ever stands between a finger and a result.**

That is one sentence and it is testable twice. Any animated element must have an
on-screen origin or destination (fail: things that fade in from nowhere). Any
animation must be cancellable to its end state on the next input (fail: anything
that must finish).

**The choreography sentence** that falls out of it, and which every one of the
three signature moments obeys: *the thing the user did leads; the consequence
follows.* Never the reverse, never simultaneous.

---

## 2 · Tokens

The whole system is CSS custom properties plus the Web Animations API. **No
motion library, no springs, no new dependency** (non-negotiable 9). Springs are
excluded on purpose: a spring has no stated duration, so it cannot be audited,
and it cannot be clamped for reduced motion without becoming a different curve.

### 2.1 Duration scale — five steps, nothing between, nothing above

| Token | ms | Name | What it is for |
|---|---|---|---|
| `--d-tap` | **90** | tap | Press and release feedback. Also the hard ceiling for reduced motion. |
| `--d-tick` | **140** | tick | In-place state change: chip select, toggle, focus ring, colour cross-fade, an underline drawing. |
| `--d-move` | **220** | move | Something changes position or size *within* the current screen. The workhorse. Also every exit of a `travel`. |
| `--d-travel` | **320** | travel | Something crosses a boundary: screen, sheet, depth, a deck snap. |
| `--d-settle` | **480** | settle | A bar fill resolving to a new value. **Nothing else may use it.** |

Nothing in the app may use a duration outside this list. Not 200. Not 300. Not
250 "because it felt better" — if it felt better, argue to move the token and
move it everywhere.

Duration does **not** scale with distance. A card crossing 40px and a sheet
crossing 600px both take `travel`. Distance-scaled duration makes small
interactions feel sluggish and is unauditable.

### 2.2 Easing set

| Token | cubic-bezier | What it is for |
|---|---|---|
| `--e-standard` | `cubic-bezier(0.2, 0, 0, 1)` | The default. Anything moving A→B that stays on screen. Fast off the mark, long flat glide, no overshoot. |
| `--e-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Arriving — from off-screen, from zero height, from nothing. Pure deceleration. |
| `--e-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Leaving. Accelerates away. **Never** used on anything that comes to rest on screen. |
| `--e-settle` | `cubic-bezier(0.34, 1.2, 0.64, 1)` | The only curve with overshoot (~4%). **Geometry only** — cards, sheets, a travelling chip. Never a numeral, never a bar fill, never a colour. |
| `linear` | — | Two uses only: 1:1 gesture tracking, and the loading breathe. Nowhere else. |

### 2.3 The pairing rule

| Duration | Permitted easings |
|---|---|
| `tap` | `standard` |
| `tick` | `standard`, `enter`, `exit` |
| `move` | `standard`, `enter`, `exit`, `settle` *(geometry only)* |
| `travel` | `standard`, `enter`, `exit`, `settle` *(geometry only)* |
| `settle` (480) | `enter` only |

Three rules govern the rest:

- **Exit is one step down.** Whatever duration an element entered on, it leaves
  on the next step down, with `--e-exit`. `travel` in → `move` out. `move` in →
  `tick` out. `tick` in → `tap` out. Departure is always quicker than arrival;
  the user has stopped caring about it.
- **Back is the exact inverse of forward.** Same tokens, signs flipped. If back
  and forward are not mirror images, one of them is wrong.
- **A finger has no easing.** While a pointer is down, the element tracks it 1:1
  — `transition: none`, `linear` by definition. Durations and curves apply only
  on release. A gesture that eases while you are still touching it feels broken,
  and it is: you are no longer holding the thing.

### 2.4 Stagger budget

Stride **30ms**, maximum **4** staggered items, so total stagger never exceeds
**120ms**. Items 5..n arrive with item 4. Stagger is allowed on a screen's first
paint and on a signature moment's detail rows. It is **prohibited** on any list
the user scrolled to, on search results, and on anything that updates while
being read.

No delay may ever precede the element the user is currently looking at.

---

## 3 · The three signature moments

Three. Named below. If a fourth is proposed, one of these has to die.

---

### Signature 1 · **THE DECK**

**Lives:** the home screen, the card region beneath the header. Nowhere else.

**What it does.** The home screen's nine simultaneous figures become a deck of
four cards — *Forecast*, *Weeks*, *Commitments*, *Year* — of which exactly one
is live. The others are visibly present as sliver edges to the right and left
and as a label pager beneath, so nothing is hidden, only sequenced. You swipe
between them. You drag up or tap to expand the live one in place. **No
navigation event occurs.** The numbers did not leave; they stopped being
simultaneous.

**How it moves.**

- *At rest.* Live card at `scale 1`, `opacity 1`. Each peer, per unit of
  distance from centre: `scale −0.06`, `opacity −0.45`, clamped at one unit.
  Card width = container − 88px, gap 12px, so ~32px of the neighbouring card is
  always visible on each side. The deck reads as a deck standing still.
- *During drag.* The track follows the finger 1:1, `transition: none`. Every
  peer's scale and opacity interpolate **continuously** off one normalised
  progress value — a half-swipe looks exactly half-committed. This continuity is
  the whole reason it feels like iMessage rather than like a carousel. Past
  either end, rubber-band at **0.35×** so the deck feels bounded without a wall.
- *During drag, the pager.* The label row translates at **0.4×** the track's
  translation. Parallax leads the eye without racing it. The active label's
  opacity interpolates on the same value.
- *On release.* Commit if `|velocity| > 0.35 px/ms` **or** `|dx| > 28%` of card
  width. Commit → snap `--d-travel` / `--e-standard`. No commit → return
  `--d-move` / `--e-standard`. Track, peers and pager all snap on the same curve
  in the same frame — one movement, not three.
- *On expand.* Card height `--d-travel` / `--e-standard`. Peers slide to the
  edges and dim to 0 over `--d-move` / `--e-exit` — **they leave as the card
  grows, not before it**. Detail rows enter at `--d-move` / `--e-enter`,
  `translateY 6px → 0`, 30ms stride, capped at 4.
- *Leads / follows.* The card leads. The pager follows at 0.4×. The detail
  content arrives last and never before the card has the room for it.

**Why it earns its place.** The founder arrived at this mechanic twice,
unprompted, from two different directions — the iMessage photo cards and his own
proposed fix for the home screen. That is the strongest taste signal in the
pack. It is also the only mechanic that answers pain point 3 without deleting
information: peek-not-navigate (R3) applied to the exact surface he complained
about. And it gives the home screen a *shape*, which is what a wireframe lacks.

**What it costs to cut.** The home screen goes back to nine figures at once. The
founder's own diagnosis of his own product goes unanswered, and R3 loses its
flagship — leaving "peek, don't navigate" as a slogan with no instance.

---

### Signature 2 · **THE TRACE**

**Lives:** *any* figure, anywhere in the app. The deck's live number, a week
total, a category row, a transaction amount.

**What it does.** You touch a figure and the evidence for it unfolds directly
beneath it — the transactions, the source lines, the arithmetic — pushing the
rest of the screen down. The figure itself does not move, does not scale, does
not change colour. It stays exactly where your eye already is, and the proof
grows out of it. Touch it again, swipe down, or press Esc to fold it away.

This is non-negotiable 5 made physical: *a number the user can't trace is a
number they have to take on faith.* Today tracing costs a navigation; here it
costs nothing and loses no context.

**How it moves.**

- *On press.* A 2px accent underline draws left-to-right under the figure,
  `--d-tick` / `--e-standard`. That is the affordance and the receipt for the
  tap, and it is the only thing that happens in the first 140ms. Selection
  haptic fires here.
- *Unfold.* The panel's height 0 → auto over `--d-travel` / `--e-standard`.
  Content below is pushed by the same layout change, so it moves on the same
  curve for free — one motion, not two.
- *Rows.* `opacity 0→1`, `translateY 6px → 0`, `--d-move` / `--e-enter`, 30ms
  stride, capped at 4.
- *Fold.* Height collapses `--d-move` / `--e-standard` (exit is one step down —
  the rule holds). Rows fade at `--d-tick` with **no** stagger; leaving is not
  choreographed. Underline retracts right-to-left, `--d-tick`.
- *Interruption.* Opening a second figure while the first is open runs both
  animations concurrently in the same frame. The second never waits for the
  first. Nothing queues.
- *The figure never animates.* Not on open, not on close, not ever. That
  discipline is what makes it read as an object you opened rather than a widget
  that reacted.

**Why it earns its place.** It is the only signature moment *required by
doctrine* rather than chosen for delight — and it is the second axis of the
gesture grammar. **Lateral means alternatives (the Deck). Vertical means
evidence (the Trace).** Two moments, one coherent spatial logic, which is what
turns a list of effects into a grammar a screen built next year can already
speak.

**What it costs to cut.** Doctrine 5 reverts to a claim. Every figure stays
either something you take on faith or something that costs a navigation to
check — and this is a product whose two known data bugs (`F-1`, `F-3`) were both
caught by a human opening a figure, not by reading code.

---

### Signature 3 · **THE LANDING**

**Lives:** the commit of a transaction — the "Add it" button, and any quick-add.
The app's core loop and its only write.

**What it does.** The amount you typed leaves the form as a small solid chip,
travels one arc over the screen you have returned to, lands on the row it
belongs to, and *then* that row's fill settles to its new value. It answers a
question the user actually has — *did that go in, and where did it go?* — and it
teaches the budget's structure to someone who does not yet hold it in their
head. That informational payload is what separates it from decoration.

**How it moves.** t=0 is release of the button.

| t (ms) | What | Token |
|---|---|---|
| 0 | Button press state, `scale 0.98`. Write already dispatched, optimistic. Screen is non-blocking from this instant. | `--d-tap` / `--e-standard` |
| 0–220 | Form recedes: `translateY +12px`, `opacity → 0`. The destination is already behind it. | `--d-move` / `--e-exit` |
| 0–220 | The amount chip does **not** recede. It lifts out at full opacity, `scale 1 → 0.72`. | `--d-move` / `--e-standard` |
| 90–410 | Chip travels. X on `--e-standard`, Y on `--e-enter` — two different curves on two axes, which bends the path into an arc with no path library and no dependency. | `--d-travel` |
| 410 | Chip `scale → 0`, `opacity → 0`. Haptic fires **here** — on the consequence, not the input. Row's number updates **instantly**. | `--d-tick` / `--e-exit` |
| 410–890 | Row's bar fill settles to its new fraction. Decelerating, **no overshoot, ever**. | `--d-settle` / `--e-enter` |

Total 890ms, of which **zero** blocks. The answer is fully readable at 410ms.
Any input at any point cancels everything to its end state on the next frame.
Leave the screen mid-flight and nothing is lost — the write went at t=0.

**The over case.** If the new value crosses 100%, the fill still settles at the
same speed on the same curve. The colour change happens **at the end of the
settle, as a 140ms cross-fade** — never during, never faster, never a pulse,
never a shake. Motion does not editorialise. The copy states the fact
("£12 past the £190 you set") and never the verdict word.

**No overshoot on a fill, ever** — and the reason is not taste. An overshooting
fill states a fraction that is not true for four frames. TRUTH outranks delight,
so `--e-settle` is banned here even though it is the prettiest curve we own.

**Why it earns its place.** The one write in the app currently ends in a route
change and a cleared form, which reads as *did that work?* This closes the loop,
carries real information, and is the only place where the bar grammar's one
piece of licensed expression — how a fill settles — actually gets used.

**What it costs to cut.** The app's core action ends in silence, the user
verifies by navigating, and the structural lesson (which bucket their money went
into) is never taught. The "settle" token then has no consumer and should be
deleted from the scale.

---

### Why not a fourth

Considered and rejected, so nobody re-proposes them as if they were missed:

- **A count-up on the big number.** Banned outright — see §7.1.
- **A crafted app-open sequence.** The emotionally loaded moment, genuinely. But
  it fires before the user has done anything, so it can only ever be in their
  way, and R2 forbids that. It is handled by the invisible layer's first-paint
  stagger and stays unnamed.
- **Swipe-to-delete on rows.** Prohibited on safety grounds — see §5.
- **A separate "bar fill" signature.** It is the second half of the Landing, and
  as an invisible-layer rule it applies everywhere. Naming it would have spent a
  signature slot on something the user must specifically *not* notice.

---

## 4 · The invisible layer

Functional motion. If the user notices any of this, it is wrong.

**Screen transitions.** Depth, not full-width slides — slides are slow and fight
the desktop layout.
- *Push:* incoming `translateX +24px`, `opacity 0→1`, `--d-travel` /
  `--e-enter`. Outgoing `translateX −12px`, `opacity → 0`, `--d-move` /
  `--e-exit`.
- *Pop:* the exact inverse, signs flipped.
- *Sheet:* `translateY 100% → 0`, `--d-travel` / `--e-enter`; scrim `--d-move` /
  `--e-standard`.
- *Peer navigation (same level, e.g. tabs):* cross-fade `--d-tick`. **Never
  slide between peers** — horizontal travel is the Deck's word and must not be
  diluted.
- *Desktop:* identical tokens, translate distances halved. Nothing else differs.

**Lists.** Insert: height `0 → auto` + opacity, `--d-move` / `--e-enter`.
Remove: opacity `--d-tick` first, then height `--d-move` / `--e-exit`, so
neighbours never jump. Reorder: FLIP transform, `--d-move` / `--e-standard`.
Stagger on first paint only, per §2.4.

**State changes.** Chip / toggle / segmented control: `--d-tick`, colour and
background only, **no scale**. Focus ring: `--d-tick`, opacity only. Disabled →
enabled: `--d-tick` opacity. Numerals: **instant, always** (§7.1).

**Loading.** Nothing spins, anywhere.
- `<300ms`: show nothing. No skeleton flash.
- `300ms–1.2s`: the container holds its exact final dimensions as a flat block,
  `opacity` breathing 0.45 ↔ 0.7 over 1600ms `linear`. No shimmer sweep —
  sweeps read as showmanship and this app cannot afford to look pleased with
  itself while the user waits.
- `>1.2s`: add one line of plain copy. Still no spinner.
- *Buttons in flight:* the label stays, the button never resizes, a 2px
  indeterminate line runs under the label at `linear`.

**Errors.** Never shake, never flash. Field border to the error colour
`--d-tick`; message enters below at `--d-move` / `--e-enter`, pushing content
down; scroll to the first error at `--d-travel` / `--e-standard`. A shake is a
scold, and the persona is the entire reason this product exists.

**Keyboard.** Content translates by the exact inset over `--d-move` /
`--e-standard`. The focused field must be fully visible before the keyboard
finishes. **Nothing else on screen may animate while the keyboard is moving.**

**Empty states.** Enter once, `--d-travel` / `--e-enter`, opacity + 8px rise.
They never loop, and any illustration in one is static forever.

---

## 5 · Gesture vocabulary

One meaning per gesture, everywhere, no exceptions.

| Gesture | Means | Where |
|---|---|---|
| **Horizontal swipe** | Move between siblings — alternatives at the same level | **The Deck only.** Not on rows, not on lists, not on screens. |
| **Vertical drag / tap on a figure** | Reveal the evidence behind it | The Trace — any figure, anywhere |
| **Vertical drag down on a sheet** | Dismiss | Any sheet. 1:1 tracking; commits past 25% height or 0.4px/ms |
| **Tap** | Commit, or open | Everywhere |
| **Long-press** | *Nothing.* Deliberately unassigned in v1 | Reserved. Do not spend it. |
| **Swipe-to-delete** | **Prohibited** | A person who avoids money data must never destroy it with a gesture they did not mean to make. Destructive actions are explicit, confirmable, and reversible — never a swipe. |

Lateral is alternatives. Vertical is evidence. Those two sentences are the whole
grammar and a new screen built next year can be checked against them.

---

## 6 · Haptics

**The rule: a haptic confirms that something *changed*, never that something was
*touched*.** At most one per user action; if two would fire, the later wins and
the earlier is suppressed.

**Gets one — three moments, matching the three signatures:**
1. **Deck** — light selection tick at the instant a card *commits*, on release.
   Not on drag start. Not once per card crossed.
2. **Trace** — light selection tick on open. Nothing on close.
3. **Landing** — one medium impact at t=410, when the chip *lands*. Not at tap.

**Never gets one:** ordinary buttons and taps; scrolling; the deck reaching its
end; toggles, chips, segmented controls; form field focus; errors (a buzz on an
error is a physical scold); **crossing over budget — absolutely never; the app
must not flinch in your hand when you go over**; loading completion; keyboard;
long-press; anything on a timer.

**Implementation honesty:** the web gives us `navigator.vibrate` on Android and
nothing at all on iOS Safari. Haptics are a progressive enhancement. No
interaction may depend on one, and nothing may be confirmed *only* haptically.

---

## 7 · What must never animate

1. **A numeral's value.** No count-ups, no odometers, no rolling digits. A
   tweening number is a number that is *wrong* for 400ms, in a product whose
   parser has already misread real data twice. TRUTH outranks delight. Numbers
   cut, instantly, always.
2. **A bar fill past its true value.** No overshoot, no bounce, for the same
   reason: four frames of a false fraction.
3. **Colour as alarm.** No pulsing, throbbing, flashing or strobing on the over
   state or anywhere else. The over state is *stated* and then still.
4. **Anything on a timer the user did not start.** No auto-advancing deck, no
   ambient loops, no idle animation, no attract loop on an empty state. If the
   user is not touching Max, Max is not moving.
5. **The header and period identity.** Where you are never slides.
6. **Error feedback.** No shake, no bounce, no wobble.
7. **Type.** No animated weight, size or reflow. It thrashes layout and reads as
   jitter.
8. **Anything that delays the keyboard or the first tap.** R2, literally.
9. **Streak, ring, confetti or celebration mechanics of any kind.** Banned by
   the brand's own layout rules and by every reason those rules exist.

---

## 8 · The reduced-motion contract

`prefers-reduced-motion: reduce` is not "animations off". Each signature moment
has a named degradation, and **the degradation never changes what is on screen
or how many taps anything takes.** Only how it arrives.

Global: every duration clamps to `--d-tap` (90ms) and to **opacity only**.
No translate, no scale, no parallax. The loading breathe becomes a static flat
block at 0.6 opacity with no loop.

- **Deck.** The gesture survives intact — a finger dragging a card is direct
  manipulation, not motion, and removing it would remove a feature. Tracking
  stays 1:1. On release the track *jumps* to position and the newly live card
  cross-fades at 90ms. Peers become static edges at fixed scale and opacity. The
  pager parallax is off; the active label cross-fades. Expand is instant with a
  90ms opacity fade.
- **Trace.** No unfold. The evidence panel appears at its full height instantly,
  content below shifts instantly, panel opacity 0→1 over 90ms. The underline
  appears rather than draws. Haptic still fires.
- **Landing.** No flight. The chip does not travel. The form closes instantly,
  the destination row's number updates instantly, the fill jumps to its final
  width, and the destination row alone fades 0.6 → 1 over 90ms so the eye is
  still pointed at what changed. Haptic still fires.

Test: with reduced motion on, every task in the app completes in the same number
of taps, and nothing that was visible before is now unreachable.

---

## 9 · Failable rules

A reviewer should be able to fail me on any of these mechanically.

1. No duration exists in the codebase outside `{90, 140, 220, 320, 480}`ms.
2. No easing exists outside the five named tokens.
3. No duration/easing pair violates the §2.3 matrix.
4. `--d-settle` (480ms) has exactly one consumer: a bar fill's width.
5. Every exit is one duration step below its matching enter, and uses
   `--e-exit`.
6. A back transition is the exact numeric inverse of its forward transition.
7. `--e-settle` never appears on a numeral, a bar fill, or a colour property.
8. No numeral in the app transitions its value. Search for any tween on a number
   and it is a bug.
9. No bar fill overshoots its target width by any amount.
10. Every animation is cancellable to its end state on the next input; no
    animation gates a tap, a keystroke, or a navigation.
11. Total stagger anywhere ≤ 120ms, stride 30ms, ≤ 4 staggered items.
12. No `transition` or easing is active on an element while a pointer is down on
    it.
13. Horizontal swipe appears in exactly one component (the Deck). No other
    component binds a horizontal gesture.
14. There is no swipe-to-delete, and no destructive action reachable by gesture
    alone.
15. Exactly three `navigator.vibrate` (or equivalent) call sites exist, and none
    fires on tap-down, on an error, or on crossing over budget.
16. Nothing animates while no pointer, key or write is in flight — an idle app
    is a still app.
17. Under `prefers-reduced-motion: reduce`, no computed animation exceeds 90ms
    and no `transform` is animated, and every task completes in the same number
    of taps.
18. Named signature moments in the app: exactly three — Deck, Trace, Landing.
19. No motion dependency is added to `package.json`.
20. No screen transition, sheet or list uses a full-width horizontal slide.

---

## 10 · Notes for the orchestrator

- **Tone gate.** The Landing's over state deliberately states the fact ("£12
  past the £190 you set") and never the banned verdict word that screen 07 of
  the design handoff specifies. `TONE > METHOD`; flagging as instructed.
- **Dependency on D1.** I have specified motion, not colour. The over-state
  cross-fade, the accent underline, and the loading block's opacity range all
  need D1's palette to be judged. Nothing in here assumes dark or light.
- **Dependency on D3.** The Deck assumes the home screen resolves to *four*
  sibling cards. If D3's information architecture produces three or six, the
  mechanic survives unchanged but the peek geometry (container − 88px, 32px slivers) needs
  re-deriving. If D3 removes the home card stack entirely, signature 1 dies and
  I owe a replacement, not a patch.
- **The keystroke rule interacts with this.** The Landing is optimistic and
  fires its write once, on commit, at t=0 — one write per user action. Nothing
  in this spec writes on change, and nothing here should tempt anyone to.
- **Least confident about:** the Landing's 90ms lead-in before the chip starts
  travelling. It is right on a phone; on a slow desktop paint it may read as a
  hitch, and it is the one number here I would expect to move after real-device
  testing.

**Run `r1-motion-demo.html` on a phone. Motion cannot be reviewed from a
document, and this document is not the deliverable that matters.**
