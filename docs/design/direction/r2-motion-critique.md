# R2 · Motion critique — D2

**Round 2 · cross-critique.** Read against `r1-ux-architecture.md` (D3),
`r1-creative-direction.md` (D1), and `r1-orchestrator-corrections.md`.

Supersedes parts of `r1-motion-grammar.md` where stated. Everything not
contradicted here stands.

---

## 1 · The home mechanic: my verdict

**The scrubber wins. THE DECK loses the home screen, and I am not going to
pretend otherwise.**

I built the founder's mechanic faithfully because that is what R1 asked for. D3
was invited to beat it and he beat it. Here is the argument, in my own terms
rather than his, because the version that convinces me is not quite the version
he wrote.

### 1.1 The real defect in THE DECK: its axis had no order

My own gesture grammar says *lateral means alternatives*. That rule is
underspecified, and the scrubber is what exposed it. A horizontal drag is a
**position along an axis**. For direct manipulation to feel like manipulation
rather than shuffling, the user must be able to answer *what is to the right of
this?* before they get there.

- THE DECK's axis was `Forecast → Weeks → Commitments → Year`. There is no
  property along which that sequence increases. It is a shuffle order. Nothing
  is to the right of Weeks; Commitments merely happens to be next.
- The scrubber's axis is `Today → Week → Month → Year`. It is **monotone in
  time distance**. What is to the right of Week is always Month, and a user
  works that out on the first drag and never has to hold it in memory again.

iMessage's photo cards — the founder's actual reference — work because photos
*are* peers and there is no wrong answer to "what's next"; browsing is the whole
activity. Money is not browsing. The user arrived with a question. An unordered
lateral gesture makes them shop through four questions to find theirs; an
ordered one lets them tune the resolution of the question they already had.

**That is the correction to my own R1 rule, and it is the strongest argument
against my own signature 1.** Lateral means *along a predictable order*, not
merely *alternatives*. THE DECK on home failed that test and I did not notice
because I was solving for the mechanic rather than for the axis.

### 1.2 The scrubber carries an informational payload; the deck's motion did not

My stated bar for a signature moment — used to justify THE LANDING in R1 — is
that the motion must carry information a static screen cannot. Applied honestly:

- THE DECK's motion (peer scale, peer opacity, pager parallax) tells you
  **that other cards exist**. The peeked edges already said that, statically.
  The motion is craft, and craft is not payload.
- The scrubber's motion tells you **the shape of your money across time**. You
  feel that your week is comfortable and your month is tight, in one gesture,
  without reading four screens. That is information that has no static form.

By my own criterion the scrubber outranks THE DECK. I have to take that.

### 1.3 Where I think D3's argument is weaker than he thinks

Two of his three points hold. The third does not carry weight.

- **"Not peers, so a carousel teaches false equivalence."** Correct, and my §1.1
  is the sharper version of it.
- **"The relationship should be the interaction."** Correct, and my §1.2 is the
  sharper version of it.
- **"It doesn't translate to desktop."** True but nearly free to fix — a pager
  plus arrow keys is a solved problem. Do not lean on this one; it is the
  weakest leg of a case that does not need it.

### 1.4 The argument he did not make, which decided it for me

**The scrubber's failure mode is soft; THE DECK's is hard.**

If drag-to-scrub tests badly, home degrades to a four-tick tap strip. It loses
its wow and loses **nothing else** — same figures, same routes, same counts, same
Rule of Four. It remains a coherent home screen.

If THE DECK tests badly, home has no structure at all: it reverts to a stack of
figures, which is the defect we were hired to fix.

A mechanic whose failure costs delight is a better bet than one whose failure
costs the screen. That, plus §1.1 and §1.2, is decisive.

### 1.5 What I am *not* conceding

THE DECK is not wrong. It is wrong **on home**. D3's placement of it at
`/week/[n]`, where Everyday / Weekend / Transport genuinely are peers of one
shape over one period, is correct and I endorse it. It is specced in §3.4.

---

## 2 · The numerals-never-tween collision, resolved

D3 writes that the figure **"re-counts to its new value as you drag."** Read as
a tween, that is a head-on collision with my rule 8 and I would refuse it. It
does not have to be read that way, and the distinction is not a loophole — it is
the actual reason rule 8 exists.

### 2.1 Why the old rule was stated wrong

R1 rule 8 — *"no numeral transitions its value"* — is a **proxy** for the real
rule, and a proxy that cannot explain why a bar fill is allowed to move for
480ms while a numeral may not move for 400ms. Both display intermediate values.
If I cannot say why one is honest and one is a lie, the rule is folklore.

The discriminator is **precision**.

### 2.2 The rule, restated

> ### Rule 8 (restated) · Nothing may display a value more precisely than that
> value is known at the instant it is displayed.
>
> **A numeral is precise to its last digit.** It therefore has no honest
> intermediate state: every frame it paints is a specific claim. `£1,637.42`
> on the way from £245.68 to £3,030 is true of nothing. **Numerals cut.
> Always — whether driven by a clock or by a finger.**
>
> **An analogue indicator is precise only to its own read resolution.** A bar
> fill or a scrub position read mid-travel says *"somewhere between"*, which is
> what is actually true while it travels. It may therefore move continuously —
> **but never outside the interval between the two true values**, which is why
> overshoot on a fill stays banned. Overshoot is not a transition; it is a claim
> that was never true, retracted four frames later.

Three consequences, all of which fall out of one rule instead of three:

1. Count-ups: still banned. Clock-driven, numeral, fabricated intermediates.
2. The scrub: **the figure never tweens.** See §2.3.
3. The Landing's 480ms fill settle: legal, and now for a stated reason rather
   than by exception.

### 2.3 What the scrubber's figure actually does

The scrubber's **position is continuous. Its value is a step function of
position.** There is no £ figure at "1.4 horizons" because there is no question
at 1.4 horizons.

At every instant of the drag, the figure displayed is **the true figure of the
nearest horizon**, complete with its own label, qualifier, sentence and
go-deeper affordance. Crossing a detent midpoint swaps the whole block, at once.

So D3 is right on two of his three clauses and wrong on the verb:

| D3's clause | Verdict |
|---|---|
| "driven by drag position" | **Yes.** Position drives it directly. |
| "reversible mid-gesture" | **Yes.** Drag back and the previous block returns. |
| "the figure re-counts" | **No. It re-states.** |

It does not count up. It **cuts to a different true answer**, and the reason it
feels continuous is that *something* is tracking the finger 1:1 — the indicator,
not the number. This is a **detented control, not a slider**: you feel the
detents, and the readout is always a real setting.

**The rule is not bent, and nothing here is an exception.** If it had needed
bending I would have said so, because a rule bent once without announcement is a
rule that is gone.

---

## 3 · The revised three signature moments

| # | Name | Lives | Status |
|---|---|---|---|
| 1 | **THE SCRUB** | home, the horizon strip | **new** — replaces THE DECK's slot |
| 2 | **THE TAPE** | any money figure, anywhere | renamed from THE TRACE; mechanic unchanged |
| 3 | **THE LANDING** | `/add` commit | unchanged |

**Cut: THE DECK.** It survives at `/week/[n]` as a component with a full motion
spec (§3.4). It does not hold a signature slot and it does not get a haptic.

**Why the deck loses the slot even though it survives.** A signature moment is
something a user *describes to another person*. "You slide one number through
today, this week, this month, this year" — describable. "Any number opens into
what made it" — describable. "You type an amount and watch it land on the bar it
belongs to" — describable. "The categories are cards you can swipe between" is
not describable; every phone user has swiped a carousel. Its craft is quality,
not signature. Naming it would spend a third of the budget on a container.

This maps 1:1 onto D3's rule 23 (*horizon scrub, tape open, add settle*), so the
two documents now name the same three things.

---

### 3.1 THE SCRUB — full spec

**Anatomy.** A four-tick strip low on the hero card, within thumb reach:
`Today · Week · Month · Year`. One indicator. Above it, the figure block
(display figure, qualifier, sentence, one go-deeper affordance) which is
replaced wholesale per scope.

**Geometry** (390px viewport, 16px gutters → 358px content):

| Property | Value | Why |
|---|---|---|
| Tick centres | 12.5% / 37.5% / 62.5% / 87.5% of content | even, no end-hugging |
| Detent pitch | **89px** | 358 ÷ 4 |
| Total travel | 268px | a deliberate sweep, ~70% of screen width |
| Tap target | 89 × 44px minimum | every tick tappable at rest |
| Drag gain | **1.0** | no gain needed at this pitch; a flick is 89px |
| Rubber band past the ends | **0.35×** | same constant as the deck |
| Hysteresis deadband | **±5px** around each midpoint | prevents boundary flicker |

**Two drag zones, one mechanic.**

- **On the strip: absolute.** Touch maps directly to strip position. This makes
  tap-to-jump the degenerate case of the drag rather than a second mechanic.
- **On the card band below the sentence: relative.** Drag from anywhere in that
  band, 1:1, 89px per detent. Preserves the "under your thumb" feel without
  stealing the header band.

**Deviation from D3, stated:** he says *drag horizontally anywhere on the card*.
I am narrowing it. The header band on home already carries a horizontal gesture
in his model (month change). Two horizontal axes in one y-band is unresolvable
for the user and unresolvable for the hit-testing. See the recommendation in §6.2.

**Tracking (pointer down).** `transition: none`. The indicator follows 1:1. Its
width interpolates continuously between the two adjacent labels' widths off a
single normalised progress value — the same one-source-of-truth discipline as
the deck. Nothing else on the screen moves.

**Settle (release).**

- Commit to the **next** detent in the direction of travel if
  `|velocity| > 0.35 px/ms`; otherwise settle to the **nearest** detent.
  **Never more than one detent per flick** — momentum across a four-position
  control is a nuisance, not a feature.
- Indicator animates `--d-move` (220) / `--e-standard`.
  **Not `--d-travel`:** nothing crosses a boundary; this is within-screen
  movement. Correcting my own R1 table, which listed "a deck snap" under travel.
- **`--e-settle` is banned here.** An overshooting indicator points at a scope
  other than the one displayed, for four frames. New failable rule: *the
  indicator may never point at a scope other than the one being displayed.*

**The figure, during and after.**

- On each detent crossing the **entire figure block cross-fades as one unit**:
  `opacity` only, `--d-tick` (140), no translate, no scale, no size change.
- **Left-anchored.** With `tabular-nums` (D1 rule 15) the glyph pitch is
  constant, so a left-anchored block only ever changes its right edge. Centred,
  every scope change would jitter the whole line.
- If a second crossing occurs mid-fade, the in-flight fade **cancels to its end
  state** and the new one starts (rule 10, interruptibility).
- Above `0.8 px/ms` the cross-fade is **suppressed entirely and the block cuts.**
  Cutting is always legal for a numeral; the fade is a courtesy, not a
  requirement.
- After settle: nothing further animates. No emphasis pulse, no highlight.

**Haptics.** One light selection tick **per detent crossing** — at most three in
a sweep, coalesced to no more than one per 80ms. This is a change of state, not
a touch, so it satisfies the R1 haptic principle; but it does break the letter
of R1's *"at most one per user action"*, so that rule is restated in §7.

**Reduced motion.** The gesture survives whole — a finger dragging a control is
direct manipulation, not motion, and removing it removes a feature.
Tracking stays 1:1. On release the indicator **jumps**. The figure block cuts
with no cross-fade. Tap and keyboard are unaffected. Same taps, same content.

**Desktop and keyboard.** The strip is an **APG tablist**: four `role="tab"`s,
roving tabindex, automatic activation. `←`/`→` move one scope; `Home`/`End` jump
to Today / Year. Arrow-key changes use the same 220ms indicator move and the
same 140ms block fade. **`role="slider"` is wrong** — there are four discrete
settings, not a range, and a slider announcement would lie to a screen reader.
On a finger it is a detented control; on a keyboard it is a tab strip; it is one
component with honest semantics for both.

**Amendment I need from D3 (his rule 7).** A tablist keeps the three inactive
scope panels in the **document** but `hidden`, i.e. out of the accessibility
tree. His rule 7 asks for all figures in the accessibility tree at all times.
For this control that is the *less* accessible option — a screen-reader user
would hear four competing figures instead of a named four-tab control. Rule 7
should be narrowed to **presence in the document**, with the tape (§3.3) as the
mechanism that makes any figure reachable. This is his call; I am flagging it,
not making it.

### 3.2 THE SCRUB — how I prove or kill it

D3 calls this his highest-risk element and asks for a prototype. I own motion
prototypes and I can settle it. What I would build: the strip alone, real
figures, on a real phone — no chrome, no routes. Half a day.

**Pre-registered test, five people from the persona, phone in hand, no
instruction:**

1. **Discovery.** Does the user drag, unprompted, within 60 seconds?
2. **Predictability.** After one use: *"what's to the right of Month?"*
3. **The step-cut.** Does the discrete cut read as correct, or do they hunt at
   the boundary — a second drag attempt at a midpoint means the hysteresis is
   wrong, which is a tuning fix, not a kill.

**Kill criteria, agreed in advance so nobody argues after the fact:**

- **Fewer than 3/5 can state the axis order after one use** → the ordered-axis
  argument in §1.1 collapses, the scrubber loses its signature slot, and the
  third slot returns to THE DECK at `/week/[n]`. The budget stays at three
  either way.
- **Fewer than 3/5 ever drag, but ≥3/5 can state the order** → the *scope
  control* is right and the *drag* is decoration. Home ships the tap strip, the
  drag stays as an enhancement, and the third signature slot returns to THE
  DECK. This is the soft failure of §1.4 and it costs no function.

### 3.3 THE TAPE — unified with D3's mechanic, and renamed

**They are the same mechanic.** Same trigger (touch a figure), same purpose
(doctrine 5), same role-split — his *"the label navigates, the figure opens
itself"* is my two-axis grammar stated better than I stated it. The only
difference is **presentation**: my inline unfold versus his layer-2 sheet.

**I take his name; he takes my presentation.** "Tape" is the better word — it is
a till roll, which is exactly what the thing is, and a founder can say it.

**The presentation must be inline, and this is a structural argument, not a
preference:**

1. **A sheet re-states the figure at its top.** That is a duplicated number, the
   exact defect D3 spends §1.2 attacking. Inline, the original figure *is* the
   header of its own tape — and pointing at the real number on the real screen
   is a stronger proof than showing a copy of it on a new surface.
2. **It is what makes his own depth cap survivable.** As a sheet:
   figure-inside-a-sheet → tape = layer 2 → tap a row → `/transaction/[id]` =
   **layer 3**, which breaks his rule 10 (depth never exceeds two). Inline, the
   tape consumes no layer, so a tape row opening a transaction is layer +1 and
   the cap holds everywhere with no special cases.
3. Gesture count *falls*: home figure → tape (1) → row → transaction (2). Better
   against his rule 8, not worse.

Motion is unchanged from R1 §3 (underline draws `--d-tick`; height 0→auto
`--d-travel`/`--e-standard`; rows `--d-move`/`--e-enter` at 30ms stride capped
at 4; fold one step down with `--e-exit`; the figure itself never animates).

### 3.4 THE DECK at `/week/[n]` — geometry re-derived for three peers

Three peers, not four, and no wrap-around. Wrapping in a 3-set makes "next"
ambiguous, and there is no cyclic meaning to Everyday → Weekend → Transport.

| Property | R1 (4 cards, home) | R2 (3 cards, `/week/[n]`) |
|---|---|---|
| Card width | content − 88 | **content − 80** → 278px at 358 |
| Gap | 12px | 12px |
| Peek each side | ~32px | **28px** |
| Peer scale | −0.06/unit, clamp 1 | **0.94**, clamp 1 unit |
| Peer opacity | −0.45/unit | **1.0 → 0.85** — see §4.5 |
| Wrap | n/a | **none**; rubber-band 0.35× at both ends |
| Commit | \|v\|>0.35 px/ms or \|dx\|>28% | unchanged (28% of 278 = 78px) |
| Snap / return | `--d-travel` / `--d-move` | unchanged |
| Pager parallax | 0.4× | unchanged |
| Haptic | light tick on commit | **none** — see §7 |

Two things the move to three forces, both improvements:

- **Card width is constant in every position, including the ends.** The bar
  track is the budget; if the track's physical length changed with deck
  position, the same bar would read differently in different positions. At the
  ends the empty side shows gutter — the card does **not** expand to fill it.
  This is a doctrine constraint, not an aesthetic one.
- **The pager satisfies the Stub Rule, not the peek.** With no wrap, the end
  positions peek only one sibling, so peeked edges cannot be the thing that
  proves all three exist. The label row beneath carries all three labels at all
  times. **The peek is depth; the pager is the index.** That is cleaner than my
  R1 arrangement, where the two jobs were confused.

**Does it still earn a signature slot at that depth? No.** It earns existence.
Answered in §3.

---

## 4 · Conflicts with D1

Numbered so they can be cited and closed.

**4.1 · The display figure must hold four string lengths at one size.**
The scrubber puts `£38.20`, `£245.68`, `about £3,030` and `+£11,806.05` through
the same display slot. D1 already doubts Instrument Serif at 56px on a 390px
viewport for nine glyphs; the Year scope is eleven. **Re-fitting the size per
scope is type animating, which my rule 7 bans**, so there is exactly one legal
resolution: **one display size, set by the longest scope, constant across all
four.** This is a hard constraint the scrubber creates on his §5.3 and it
strengthens his own case for the Fraunces escape hatch. *His call, my
constraint.*

**4.2 · The hatch over-state is more motion-legal than a colour ramp — but it
must never move.** Cross-fading between two hues passes through intermediate
hues that mean nothing. A `paper` stripe layer fading in over a solid `ink` fill
is opacity only, monotone, and lands exactly on my `--d-tick` cross-fade at the
end of the Landing's settle. **I prefer his hatch to a colour change.** Two
requirements: the hatch is a **static background on the fill element**, never
animated in position (no marching ants, ever), and its 1.5px/3px pitch must
resolve to whole device pixels at DPR 2 and 3 — a 45° pattern at that pitch on a
6px-tall bar will crawl and moiré on any subpixel movement, and the fill *is*
moving for 480ms before the hatch appears.

**4.3 · The bar ramp is not a motion problem, and I am not a party to that
fight.** As implemented (per the orchestrator's correction) the gradient is
painted across the **track** and revealed by a moving mask. **Nothing tweens** —
it is a static texture progressively uncovered, structurally identical to the
hatch. My token system is therefore indifferent to whether the ramp survives.
**One real consequence:** with the ramp, the fill visibly warms *during* the
480ms settle, which contradicts my R1 Landing rule that colour changes only at
the end. I accept the warming, because at every frame the colour is a true
statement of the fraction then displayed — it is revealed, not animated. If the
ramp is deleted, nothing in my spec changes.

**4.4 · Two 2px underlines will collide.** The scrub indicator sits under a
*label*; the tape's press underline sits under a *figure*. Under D3's rule —
labels navigate, figures open — they are already a distinguished pair, but at 2px
in the same weight they will read as the same object. **I need two materials
from D1**: my recommendation is indicator = 2px `ink` on the strip baseline,
tape underline = 2px `clay` hugging the figure. That also settles 4.5.

**4.5 · Clay rationing vs my affordances, and one budget question.** Home wants
the scrub indicator, the go-deeper affordance, and a transient tape underline —
three clay elements against his cap of two. Resolution: **the scrub indicator is
`ink`, not clay.** It marks state, not action; clay is for "touch this". That
leaves the go-deeper affordance plus one in reserve. **Open question for him:**
does a momentary *pressed* state count against a cap that is "countable in a
screenshot"? I say no — it exists only while a finger is down. Needs his ruling.

**4.6 · On paper, depth is a hairline, not an opacity — and this revises my own
deck spec.** `paper #F2EEE6` and `card #FFFCF6` differ by roughly 4% luminance.
A peeked sibling at my R1 opacity 0.55 would be very nearly invisible against
the ground: the Stub Rule would be broken by the palette. Opacity-as-depth is a
dark-ground affordance and D1 is right that light is the harder, better call —
so I am changing my number, not asking him to change his. **Peer opacity range
compresses from 0.45 to 0.15 (1.0 → 0.85), and the peek is carried by a 1px
`rule` hairline plus his single shadow token at 14px radius.** This is also the
direct answer to D3's ask of D1 for "a material that says there is a card behind
this."

**4.7 · The loading block has no token.** My R1 loading state is a flat block
breathing opacity 0.45 ↔ 0.7. On paper that needs a fill: proposal is `rule`
(`#E0D8C8`) breathing **0.6 ↔ 1.0**, which keeps the amplitude and puts the
block inside his three-hue rule. Needs ratification; minor.

**4.8 · One of D3's rules is deleted by D1's system, and that is fine.** D3's
rule 16 — *no element in the top 40% of first paint uses the over/negative
colour role* — is vacuous under chromatic abstention, because there is no
negative colour role. Two independent systems agreeing to that degree is
evidence they are compatible. Noting it so nobody re-litigates a dead rule.

---

## 5 · What I concede

1. **The scrubber beats THE DECK on home.** My signature 1 dies in its stated
   location. I was first; he was right.
2. **My "lateral means alternatives" rule was underspecified.** It needed *along
   a predictable order*, and the omission is what let me build a shuffle and
   call it a grammar.
3. **THE DECK loses its signature slot and its haptic**, and survives as an
   ordinary component. The founder arrived at this mechanic twice, and two
   directors are now demoting it — see §6.3.
4. **His name beats mine.** THE TRACE becomes THE TAPE.
5. **R1 rule 8 was stated as a proxy and could not defend itself.** §2.2 is what
   it should have said in the first place, and the fact that a cross-critique
   was needed to find that out is the argument for having one.
6. **My R1 peer-opacity number was designed on an assumed dark ground** and
   would have failed on paper. §4.6.
7. **My R1 duration table was wrong about the snap.** A detent settle is `move`,
   not `travel`. Nothing crosses a boundary.
8. **His §4.1 rule — a bar never renders without its figure adjacent — is a rule
   I should have written and did not**, and it constrains me directly: in the
   Landing, the figure and the bar disagree for 480ms. That is correct and it
   stays, but only in one direction. **The figure cuts first (t=410) and the bar
   then travels to meet it (410–890). Never the reverse.** The truth leads; the
   illustration follows. Added as a rule in §7.

---

## 6 · Unresolvable — founder decisions

Three. Each with my recommendation.

**6.1 · Does home ship the drag, or a tap strip?**
Genuinely undecidable from a document; it is a device question. **Recommendation:
build both, ship the tap strip as the floor and the drag as an enhancement on
top of it, and hold to the pre-registered kill criteria in §3.2.** The founder
should know that home is a good screen either way, and that we are not betting
the home screen on an unproven gesture.

**6.2 · One horizontal axis per screen, or two?**
D3's navigation model gives home two: scope on the strip, month on the header.
`/week/[n]` likewise: category in the deck, week on the header.
**Recommendation: one per screen.** Home's is scope; month change becomes a tap
on "August" opening a picker. Two ordered horizontal axes on one screen means
the user must know which band they are in before they know what a drag does, and
that is precisely the kind of thing this persona will not learn. It costs D3 a
gesture and buys an unambiguous screen. This changes his §5.1, so it is not
mine to decide.

**6.3 · THE DECK is being demoted, and the founder proposed it twice.**
It moves off home (D3), and it loses its signature slot (me). Both are, I
believe, correct. But this is his own twice-arrived-at mechanic and the strongest
taste signal in the pack, so he must reverse himself **knowingly or not at all**
— the same standard the orchestrator applied to the bar ramp.
**Recommendation: accept the demotion.** The mechanic is not lost; it is placed
where its content is actually a set. If he overrules and wants the deck on home,
the honest consequence is that the scrubber cannot also live there, and the
ordered-axis argument in §1.1 goes unanswered.

---

## 7 · Revised failable rules

Only the ones that changed. Everything else in `r1-motion-grammar.md` §9 stands.

**Rule 8 — restated.** *Nothing may display a value more precisely than that
value is known at the instant it is displayed.* Numerals cut, always, whether
driven by a clock or by a finger. An analogue indicator may travel between two
true values and may never leave that interval.
*Fails:* any numeral tween; any fill overshoot; any interpolated figure on the
scrubber.

**Rule 9 — folded into rule 8.** No longer a separate assertion.

**Rule 13 — replaced.** *A horizontal gesture always means movement along an
ordered axis, and no screen binds more than one such axis within the same
y-band.*
*Fails:* two horizontal handlers active in one band; any horizontal gesture
whose axis a user cannot order. (R1's "exactly one component binds horizontal"
is dead — there are now at least two, the scrub and the deck.)

**Rule 15 — restated.** *A haptic marks a change of state, never a touch. At
most one per state change, and never more than one per 80ms. Exactly three call
sites exist: the scrub's detent crossing, the tape's open, the landing's touch
down.*
*Fails:* a haptic on tap-down, on an error, on crossing over budget, on a deck
commit, or anything on a timer.

**Rule 18 — restated.** *Named signature moments: exactly three — **THE SCRUB**,
**THE TAPE**, **THE LANDING**.* THE DECK is a component, not a signature.

**Rule 20 — unchanged but clarified.** No full-width horizontal slide. D3's
desktop right rail is not full-width and is permitted.

**New rule 26.** *A scope indicator may never point at a scope other than the one
being displayed.* Bans `--e-settle` and any overshoot on the scrubber.

**New rule 27.** *Where a figure and its bar both change, the figure cuts first
and the bar travels to meet it. Never the reverse, never simultaneous.*
*Fails:* any frame in which the bar has reached a value the figure has not yet
stated.

**New rule 28.** *A texture that encodes a state — the hatch, the ramp — is
painted statically and revealed by geometry. It is never animated in position
and never cross-faded between hues.*

**New rule 29.** *The display figure's size is constant across every state of the
scrubber.* Type never resizes to fit its content.

---

## 8 · Report

**Adjudicated:** the scrubber wins home; THE DECK moves to `/week/[n]` and is
demoted from signature to component. Budget holds at three: THE SCRUB, THE TAPE,
THE LANDING.

**Resolved:** the numerals collision, by finding that my R1 rule was a proxy for
a precision rule that covers count-ups, the scrub and the bar settle in one
statement. Nothing was bent.

**Unified:** THE TRACE and the tape are one mechanic. His name, my inline
presentation — and the inline form is what keeps his own two-layer depth cap
intact, which is the reason, not a preference.

**Least confident about:** the 89px detent pitch. It is derived from a 390px
viewport rather than from a thumb, and it is the number I most expect to move
after §3.2's device test. Second: whether a cross-fading figure block reads as
*a different answer* rather than *the same answer changing*, which is the whole
premise of §2.3 and cannot be settled from a document.

**Not confident either way:** §6.2. I believe one horizontal axis per screen is
right, but I am proposing the removal of a gesture from another director's
navigation model on a judgement I have not tested.

**Outside my ownership:** nothing modified. `src/` untouched, no git commands,
one file created.
