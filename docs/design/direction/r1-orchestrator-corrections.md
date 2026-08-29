# Corrections to R1 claims, before the cross-critique

Each R1 escalation was checked against source. Two were wrong, and both errors
are load-bearing — they need correcting before R2 or a director will critique a
premise that does not exist.

## Correction 1 — the bar colour ramp IS specified, and the founder asked for it

**The creative director wrote:** *"The lime→amber→orange ramp visible on the
week-screen bars fails the bar doctrine's stated intent ('magnitude must not
shout') and does not appear to be specified by it."*

**Wrong on both counts.** `src/components/ui/bar-grammar.ts` specifies it in
detail, and records the reasoning:

> **DEVIATION FROM THE HANDOFF, at the founder's request:** the fill is a ramp
> rather than flat grey. The gradient is painted across the *track*, and the
> fill reveals the left part of it — so the colour at any point means "this much
> of the budget", and a half-full bar is entirely calm because it has not
> reached the warm stops yet.
>
> The stops sit deliberately late (calm to 70%, warming through 85%, warm at the
> end). This app is for people who feel judged by money apps, so a bar that
> reddens early would be the product working against itself.

The ramp does not encode a verdict. It encodes **fraction of budget** — the same
quantity the fill width already encodes, in a second channel. Magnitude does not
shout, because a bar cannot exceed 100% and the warm stops arrive late by
design. This *serves* the doctrine's intent rather than breaking it.

**Two consequences for R2:**

1. Part of D1's case for "chromatic abstention — colour never encodes valence"
   rests on the ramp being an unsanctioned accident. It is not. The argument may
   still be right, but it must be re-made against a rule that was deliberate.
2. **The founder personally requested this behaviour.** D1's proposal to delete
   all colour valence — and to replace the red over-state with a hatched ink
   fill — therefore reverses a specific, considered founder decision. That is an
   escalation, not an orchestrator call. It goes on the R3 decision list with
   this history attached, so he is reversing himself knowingly or not at all.

D1's *first* escalation was correctly flagged and is genuinely open: a palette
with no red cannot have a red over-state, so something has to give. That is the
real conflict, and it is his to settle.

## Correction 2 — the US date format is a harness artifact

Covered in `r1-build-defects-found.md`. `<input type="date">` renders in the
*browser's* locale; the screenshots were captured in a US-locale headless
Chromium. Not an app defect.

**Standing caveat for all directors:** anything locale-sensitive in
`screens/*.png` is an artifact of the capture environment, not the product.

## What was confirmed

- The second bar grammar in `YearView.tsx` (segment width = magnitude) is real
  and unsanctioned.
- The required "not now" affordance genuinely does not exist anywhere in `src/`.

---

*Recorded before R2 so the cross-critique argues with the build as it is, not as
it was assumed to be.*
