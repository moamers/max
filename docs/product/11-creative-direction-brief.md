# Max — creative direction, motion, and UX overhaul

**Status:** plan awaiting founder approval. Nothing in here has been executed.
**Raised by:** the founder, after living with the built V1 on his phone.

---

## 1 · The founder's words, kept verbatim

These are the source of truth for this workstream. Do not paraphrase them away.

> I wasn't that convinced with the design.
>
> **1 —** it lacks creative design, somewhat looks like a nice wireframe but no
> 'soul' or unique creative direction or unique brand experience to give the UI
> its own unique life
>
> **2 —** it lacks any kind of consistent micro animation and micro interaction
> grammar. It works, but no transitions, no chareogeapgy, no liveness, no wow
> factor
>
> **3 —** too many numbers in one screen. No progressive information download;
> just everything is there. It's clean, it's not bla bla text heavy, it's not
> chart so all those rules are tick. But it's not progressively showing
> information. This can be solved creatively in conjunction with 2. For example
> (and please don't take this as a solution rather a starting point or insp if
> you wish): under the current / forecast card you only get one summary (say
> weekly) and you can see there are other cards (either showing stacked, or
> there's pagination with small labels) and you can swipe/animate between states
> and expand as you wish. That's one example
>
> I think it really needs a senior creative director expert in apps to consume
> what we've done and the original vision to see how we evolved, and help shape
> creative direction and concept, what the visual language should be,
> typography, colours, rules for combination of colours gradients no gradients
> everything. Even challenge the colours themselves
>
> I hate the logo, I hate the name; the creative director needs to think through
> those too
>
> Lastly it really needs an expert senior UI / UX design director to take this
> as a great wireframe starting point, and what the above two directors came up
> with. take a step back, and think how do I make this an experience that wows
> people? How do I make this design memorable unique and interactive? How do I
> enhance the UX by using more UX tricks and UI widgets combined with some micro
> animation / micro interaction to make the design like a living organism?
>
> I think those 3 design agents need to almost work together and collaborate and
> keep iterating on each others ideas until they reach a point where it's ready
> for me (the founder) to see

---

## 2 · The finding that reframes this work

**The build drifted from its own creative brief. It was never executed.**

`docs/product/02-creative-brief.md` — written before any code — specifies:

| The brief says | The build is |
|---|---|
| "warm, approachable, a little playful, calm" | dark, compact, precise, austere |
| "warmer, more human tones than the navy/teal that dominates fintech" | near-black ground, lime accent, red for over |
| "Typography should feel conversational and legible… not a display/editorial face" | JetBrains Mono on most numerals and labels |
| "Generous whitespace over dense data surfaces" | dense stacked cards, three-column category grids |
| "primary interface surface should be conversational and text-forward" | a figures dashboard |
| Reference points: **Monzo** (warm, playful, delightful mechanics), **Payhawk** (persistent conversational input) | neither pattern present |

So this is not "we have no creative direction." It is **"we wrote one, then built a
competent analytics dashboard instead."** That is a much more tractable starting
point, and it means the first job of the creative director is not a blank page —
it is to decide whether that original brief is still right, and then either
execute it properly or replace it deliberately.

It also explains pain point 1 precisely. A wireframe is exactly what you get when
information architecture is solved and visual language never is.

**One caveat on the name.** The brief has a rationale for "Max" —
*"maximize your benefit, even if you're the least financially engaged person
imaginable, even if all you can spare is ten pounds."* The founder is entitled to
hate it anyway, but the creative director should argue against that rationale
rather than rediscover the problem from scratch.

---

## 3 · The three directors

The founder named two roles and asked for three agents. The third is implied by
pain point 2. The mapping is clean, and each director owns exactly one pain point
so there is no ambiguity about who answers for what.

### D1 · Creative Director — *"give it a soul"*
Owns pain point 1. Brand concept and idea, visual language, typography, colour
system, the rules for combining colour (gradients / no gradients, tints, when
colour is allowed to carry meaning), light vs dark stance, iconography, **the
name, and the mark**. Explicitly invited to challenge the existing palette and
the existing brief.

**Deliverable:** a written creative direction, plus visual concepts as real
artboards — not descriptions of concepts.

### D2 · Motion & Interaction Director — *"make it live"*
Owns pain point 2. The motion grammar: a timing and easing scale, what animates
and what must never animate, screen-to-screen choreography, gesture vocabulary
(swipe, drag, long-press), state transitions, loading and empty states, haptics,
and the micro-interaction library. The point is a *system*, not a list of nice
effects — a grammar means a new screen built next year already knows how to move.

**Deliverable:** a motion spec with named tokens, plus working animated
prototypes of the transitions that matter.

### D3 · Product / UX Design Director — *"make it an experience"*
Owns pain point 3. Information architecture per screen, the progressive
disclosure ladder (what shows at rest, what one gesture away, what two), widget
selection, navigation model, and the synthesis of D1 and D2 into screens that
actually work. Takes the current build as the wireframe it is.

**Deliverable:** redesigned key screens, with the disclosure ladder stated
explicitly for each.

The founder's swipeable-summary-cards idea is logged as **inspiration, not a
solution** — his words. D3 should treat it as one candidate among several and is
free to beat it.

---

## 4 · The constraint sheet

Agents waste entire rounds when they don't know what they're allowed to touch.
This must go in every brief, at the top.

### Non-negotiable — a proposal that breaks these is rejected, not debated

| # | Constraint | Why |
|---|---|---|
| B-23 | The tone gate. Banned vocabulary is enforced in code (`src/lib/tone.ts`) | Precedence is `TONE > METHOD`. The tone constraints *are* the product |
| 5 | Every figure stays traceable — a number the user can't open is one they take on faith | The parser has misread real data twice; both were caught by making figures openable |
| 6 | The model may judge structure; it must not do arithmetic it then states | `T-2` |
| 3 | Labels are the user's own words, verbatim | Free text in, verbatim out |
| 8 | No database write from a keystroke | This took production down once |
| — | Works on phone **and** desktop web | Cross-platform constraint in the brief |
| — | Motion respects `prefers-reduced-motion`, and the app stays fully usable with motion off | Accessibility, and an anxious user may want it still |

### Open for challenge — the founder has explicitly invited these

- The entire colour palette, including whether dark-first is right at all
- Typography, including the mono numerals
- **The name** and **the mark**
- Density, layout, navigation model, and the card system
- Whether the original creative brief still stands

### The interesting one: the bar grammar

`src/components/ui/Bar.tsx` is currently doctrine — *"never compute a bar's width
or colour; magnitude lives in the number and never in bar length."* It exists so a
hard month doesn't *look* violent to someone who is already avoidant.

A creative director will collide with this immediately. It is **challengeable, but
only in writing, and only to the founder** — not quietly designed around. If the
rule goes, it goes on purpose, with the reason it was written addressed head-on.

---

## 5 · Round 0 — the context pack (my job, before any director starts)

**This is the step most likely to be skimped and most likely to decide whether
this works.** These agents cannot critique what they cannot see, and a design
agent handed a repo will read code and describe it back to you.

1. **Real screens, really rendered.** I stand up a throwaway local Postgres, seed
   a realistic month of data, run the app, and drive headless Chromium to capture
   every screen — light and dark, phone and desktop widths, plus the empty,
   loading, and error states. This harness already exists and works; I built and
   used it earlier today and can restand it in about two minutes.
2. **A written state-of-the-build**: what each screen does, what the twelve
   routes are, which primitives exist in `src/components/ui/`.
3. **The vision, the original creative brief, and the drift table in §2.**
4. **The constraint sheet in §4.**
5. **The founder's verbatim words in §1.**
6. **Reference points**, which I need from the founder (see §10).

Without 1 and 6 this produces generic design-agency output. With them it can
produce something specific to Max.

---

## 6 · How the three actually collaborate

Free-form multi-agent chat converges on mush and burns budget. Structured rounds
with artifacts at each gate work better.

**R1 · Divergence — parallel, no cross-talk.**
Each director works from the context pack alone and produces their own take.
Deliberately isolated: let them cross-talk now and they anchor on whoever speaks
first.

**R2 · Cross-critique — each reads the other two.**
Each writes a critique naming *specific* conflicts ("this palette makes the motion
spec's depth cues invisible"), not general praise. Conflict is the product of this
round.

**R3 · Convergence — one reconciled direction.**
Conflicts that can't be reconciled are escalated as a numbered decision list for
the founder. **They are not resolved silently.** This is the round where an
orchestrator matters, and it's mine.

**R4 · Make it real.**
Two or three screens — home, week, add transaction — built as an interactive,
animated prototype the founder can open on his phone. Not a slide deck, not
static mockups.

**Gate · Founder review.** Then loop R2→R4 at most twice more.

The cap is deliberate. "Keep iterating until it's ready" without a bound is how
this becomes expensive and never lands.

---

## 7 · Which model runs what

**Use different models for different directors.** Three instances of the same
model produce three variations of the same taste and then agree with each other
in R2, which wastes the entire cross-critique round. Genuine disagreement needs
genuinely different models. Suggested: Opus for D1 and D3, a different frontier
model for D2 — or rotate, and let the founder see which voice he responds to.

**Codex** has been reliable here on long, well-specified implementation runs
(the autocomplete and the LLM capture both landed working). It is the right tool
for **R4 and after** — building the locked direction into real components and
real motion on its own branch. It is the wrong tool for taste. Do not ask it to
decide the palette.

**The `design` skill** produces a multi-artboard canvas the founder can pan,
zoom, and edit directly — that is the natural output format for D1's concepts and
D3's screens, and it matches the `.dc.html` handoff convention this repo already
uses.

**Artifacts with comments** are the natural review surface for the gate: the
founder can comment on a specific thread and the agent can answer it in place.

**My job** is the context pack, orchestration, doctrine gatekeeping, escalating
conflicts instead of burying them, and keeping the four gates green.

---

## 8 · What "ready for the founder" means

The gate is not a document. It is:

1. **An interactive prototype on his phone** — 3 screens, real motion, real
   numbers, next to the current build for comparison.
2. **A one-page direction summary** — the concept in a sentence, the palette, the
   type, the motion principles.
3. **A numbered decision list** — every conflict the directors could not resolve,
   each with a recommendation. Including the name and the mark.
4. **An honest note on cost** — what this direction implies for the rebuild.

---

## 9 · Name and mark: decided at the gate, executed separately

The founder wants both rethought, and they should be. But the *rename* is a
distinct piece of work — repo, domain, Railway service, the icon and manifest
work finished this week, every doc, and the `Max` identity throughout the code.

Recommendation: **decide** the name at the gate, **schedule** the rename as its
own task after the visual direction lands. Renaming mid-overhaul means doing it
against a moving target.

---

## 10 · What I need from you before R1

Three things, and the second matters most.

1. **Is the bar grammar genuinely open?** (§4). It's the one doctrine the
   creative work will hit immediately.
2. **Two or three apps whose feel you love** — any category, not just finance.
   *"Wow" is undefined without anchors*, and this single input does more for
   output quality than anything else in this plan. The existing brief names Monzo
   and Payhawk; if those still hold, say so, and if they don't, that itself is
   useful.
3. **A budget ceiling.** Three agents over four rounds is materially more
   expensive than the feature work to date. I'd rather bound it up front than
   discover it.

Also worth deciding: is the name change in scope for this round, or parked?
