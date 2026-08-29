# What the founder's references actually say

Gathered 2026-08-29, in his words, with the rules derived from them. **The
derived rules are the point** — a reference nobody can fail is just a mood board
by another name.

## The four references, verbatim

| App | What he said |
|---|---|
| **Monzo** | "not the look and feel, but its practical and direct no gimmicks to get in the way of UX. makes me think I don't want a busy design just a few signature pieces (animations / interactions / visual)" |
| **iMessage** | "I like how fluid it is, and esp the photo cards when you upload multiple photos and how you can swipe without opening the pics" |
| **Airbnb** | "overall nice app design" |
| **Trading 212** | "practical and direct but least preferable" |

## The synthesis

**Trading 212 is where Max is now.** Practical, direct, functional — and the one
he likes least. That is the whole complaint in a single data point: *functional
is not enough, and he can already tell.*

**Monzo's directness plus Airbnb's craft is where he wants to be. iMessage is the
interaction model.**

Note what he did **not** say about Monzo: the look. He explicitly took directness
and rejected the aesthetic. Nobody should return a Monzo pastiche.

## The rules these produce

### R1 · The motion budget — at most three signature moments in the whole app

From *"I don't want a busy design just a few signature pieces."* This is the
sharpest constraint we have, and it inverts the obvious reading of pain point 2.
"No micro-animation grammar" does **not** mean "animate everything."

- **Default: motion is invisible and functional.** It orients you — where did
  this come from, where did it go. You should not notice it.
- **Signature: a small fixed number of crafted moments.** Three. Not "a few
  dozen delightful touches."
- **The test:** if you cannot name every signature moment on one hand without
  checking, there are too many. A director who ships fifteen delightful
  micro-interactions has failed this brief, not over-delivered on it.

### R2 · Nothing decorative may sit between the user and the task

From *"no gimmicks to get in the way of UX."* Any animation that delays an
action, any flourish that must finish before a tap registers, is out. Motion
runs alongside interaction, never in front of it.

**The test:** every animation must be interruptible, and the app must be fully
usable with motion disabled entirely.

### R3 · Peek, don't navigate

From the iMessage photo cards — *"you can swipe without opening the pics."*

This is the **second** time he has arrived at this pattern independently: his
original pain point 3 proposed swiping between summary cards under the forecast
card. Two unprompted arrivals at the same mechanic is the strongest taste signal
in this document.

Content that is currently a separate screen, or a number stacked on the home
screen, should be reachable **in place** — peeked, swiped, expanded — without a
navigation event. This is also the most direct answer to "too many numbers on one
screen": the numbers do not have to leave, they have to *stop being simultaneous*.

**Candidate for signature moment #1**, and the obvious thing to prototype first.

### R4 · Craft is the differentiator, not features

From Airbnb. Max has no photography, so what transfers is not the imagery: it is
**generous space, confident typographic hierarchy, and cards that feel like
objects rather than containers.** The current build has containers.

## An observation for the Creative Director, not a conclusion

**Three of his four references are light-first apps.** Monzo, iMessage and
Airbnb are all experienced by most people as light; Trading 212 — the one he
likes least — is the dark one. The original creative brief also asked for
"warmer, more human tones than the navy/teal that dominates fintech."

Max is dark-first, and light was implemented as a 1:1 palette remap of the dark
theme rather than designed on its own terms.

This is not proof that dark is wrong. It is enough of a signal that **"is dark
the right default?" must be answered explicitly and argued, not inherited.**
