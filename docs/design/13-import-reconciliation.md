# Screen 01 addendum — what happens to rows Max isn't sure about

*Written because the handoff's "2 I couldn't place" works for 2 and collapses at 40.*

---

## The problem

The design shows unplaced rows as inline cards with three category chips each.
That is fine when there are two. On a real workbook there could be forty, and a
queue of forty questions is a data-entry chore — which is the thing this product
exists not to be. The promise is *"the mental load is almost zero, you don't have
to label shit."* A reconciliation queue breaks that promise on first contact.

But the opposite failure is worse: silently guessing. This parser has produced
wrong numbers on real data twice (`F-1`, `F-3`), and both times a silent
judgement about someone's money was the bug.

## The rule

**Import never blocks, never throws anything away, and never asks a question it
can answer with a stated assumption.**

Four principles, in precedence order:

1. **Nothing is discarded.** Every row lands somewhere. The design's own copy —
   *"1,284 lines. Nothing thrown away."* — is a promise, not a headline.
2. **Show the assumption, don't ask the question.** A row Max is unsure about
   gets placed with its best guess and a stated reason. The user confirms or
   changes; they are never presented with an empty field to fill.
3. **Skip is a first-class action.** Skipping leaves the assumption standing and
   the marker visible. It is not an error state and must not be styled as one.
4. **Uncertainty stays visible and traceable** (`B-8`). An assumed row is marked
   wherever it appears, and can always be opened to see *why* it landed there.

## What that means in the data

Add to `transactions`:

| Column | Purpose |
|---|---|
| `assumed` (boolean, default false) | Max placed this by fallback, not by evidence |
| `assumption` (text, nullable) | Why, in the user's language: *"No week tab, so I put it in week 1"* |

**Do not reuse `pending` for this.** `pending` means *the amount isn't final yet*
and is amber in the design. Placement uncertainty is a different claim, and
overloading one flag would make both meaningless. Two uncertainties, two markers.

## What that means on screen

**Import result (screen 01, state 3)** — unchanged in shape. Counts, the label
chips, and then:

- 0 assumed → nothing extra. Silence is the reward for a clean import.
- 1–5 assumed → the design's inline cards, exactly as drawn.
- 6+ assumed → **one** line instead: *"12 I placed by guessing."* with a quiet
  link to review, and the lime **Continue** button still primary. Continue is
  always the prominent action. Reviewing is always optional.

**A review screen** (`/review`) for the 6+ case. One card at a time, showing the
whole row — merchant, amount, date, note, and the raw imported string — with
Max's placement already selected and its reason stated. Three actions: **Confirm**,
**Change**, **Skip**. Plus **Skip all**, which is not hidden.

**Everywhere else.** An assumed row carries a small marker in any list it appears
in, and opening it shows the assumption. That is the safety net: a user who
skipped everything at import still meets the uncertainty later, in context, at a
moment when they care about that particular figure.

## Questions that are about the file, not a row

If Max cannot tell **what period a workbook covers**, that is one question about
one file — not N questions about N rows. Ask it once, on the reading screen,
with Max's best guess pre-filled from the filename. Never let a file-level
unknown become a per-row interrogation (`B-6`, one question).

## What "couldn't import" looks like

There is no such state, by design. A row that cannot be understood at all still
lands: as a one-off, at its stated amount, with `assumed = true` and an
assumption saying plainly that Max could not read where it belonged. A user can
find it, fix it, or ignore it. **Refusing to import something is a decision the
user should get to make, not one made for them.**
