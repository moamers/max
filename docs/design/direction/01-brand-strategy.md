# Max — brand strategy (the part that survives)

**This is a strip of `docs/product/02-creative-brief.md`.** It keeps what says
*who Max is*. It deliberately drops everything that said *what Max looks like*,
because that half was written as adjectives, adjectives have no test, and an
agent handed adjectives fills the gap with the safest competent thing it knows.

**What was removed, and why — so nobody reinstates it by accident:**

| Removed | Why |
|---|---|
| The "Mood" paragraph — warm, approachable, playful, calm, generous whitespace, "friendly and optimistic rather than financial-institution serious" | Unfalsifiable. No rule here can be failed, so none of it constrained anything |
| "Charts are a last resort, not the interface" | True as written, but read as an instruction it pushes straight to a wall of text — which is not the answer either. The screen should be *neither* a chart dashboard *nor* an essay |
| Monzo and Payhawk as reference points | Not wrong, but second-hand and stale. Fresh references are being gathered from the founder |
| The rationale for the name "Max" | The name is being reconsidered. The old rationale is in the original brief if anyone wants to argue with it — it should not be treated as settled |

**Also not in this pack, on purpose:** `docs/design/handoff/*.dc.html`. That is a
pixel-final spec — every hex, "colours, type sizes, weights, spacing, radii and
interaction states are final" — and it is what produced the current look. It is
what is being replaced. Read it only to know what you are moving away from.

---

## Brand essence

**A financially savvy friend who's genuinely on your side — not a bank, not a
spreadsheet, not a lecture.**

## What Max is not

This matters as much as what it is. Max should look and sound like the opposite
of:

- A **"serious bank"** — navy suits, austere navy/grey palettes, corporate stock
  photography of handshakes.
- A **"financial wellness" app** — clinical, soft-focus, vaguely therapeutic
  corporate-wellness tone that talks *at* the user.
- A **power-user finance tool** (YNAB, Excel-with-a-UI) — dense tables, a dozen
  configuration options visible at once, charts as the primary UI surface.
- Anything that could make a financially anxious, avoidant person feel judged,
  behind, or stupid for not already having this figured out.

## Personality

If Max were a person, they'd be the friend who's genuinely good with money but
never makes you feel bad about not being — the one you text "is this normal?"
and who actually gives you a real, kind, direct answer instead of a lecture.

- **Warm, not clinical.** Talks like a person, not a compliance document.
- **Direct, not corporate.** Says the real thing plainly. No "financial wellness
  journey" euphemism.
- **Confident, not condescending.** Knows the answer, states it clearly, doesn't
  hedge everything into mush.
- **Calm, not urgent.** Never uses fear, red alert, or "act now" pressure as the
  motivator. The motivation is possibility, not anxiety.
- **Light, not heavy.** Small nudges, one at a time. Never feels like it's asking
  for more attention than the user has to give.

## Voice

| Instead of this (typical fintech voice) | Max sounds like this |
|---|---|
| "You have exceeded your grocery budget category by 23%." | "You're spending a bit more on groceries than usual — want to see where?" |
| "Complete your profile to get personalized insights." | (never asked directly — inferred over time) |
| "Congratulations! You've achieved a savings milestone!" | "That's £600 you didn't spend this year without even trying. Here's what it could grow into." |
| "Please categorize the following 14 uncategorized transactions." | (never happens) |

---

## The hard constraints

**These are the model for how the new direction should be written.** They come
from research into financial avoidance, and they are the one part of the original
brief that actually held — because every line can be *failed*. A rule that cannot
be broken cannot guide anything.

Whatever the three directors produce, it should read like this section: rules a
reviewer can check, not moods a reviewer can agree with.

### Banned vocabulary
"wasting", "should have", "overspending", "bad habit", "you failed", "you're
behind" — any word that converts information into a verdict. Enforced in code by
`src/lib/tone.ts`; a violation fails the build.

### Banned layouts
- A red or negative total as the first thing on screen. **The opening view must
  never be a judgement.**
- Unrequested "you spent £X this month" aggregates — the classic avoidance
  trigger.
- Streaks, progress bars that break, or any mechanic that punishes a missed day.
- Leaderboards, or "you spend more than N% of users" ranking.

### Required
A visible, easy way to say *"not now"* or *"don't mention that again"* — and the
design must make clear it will be honoured. **For this persona, the ability to
turn Max down is what makes Max safe to turn on.**

### On comparison
Comparison is always **calibration**, never **ranking**. "That's normal for a
household like yours" is the design target. Anything resembling a scoreboard is
prohibited.

---

## One constraint that is a fact, not a preference

Every screen works on a phone **and** a desktop browser. The app ships web-first.
The real-world context is phone-in-hand — checking on spending is a standing-up
moment, not a sit-down-at-a-desk one — but desktop must not break.
