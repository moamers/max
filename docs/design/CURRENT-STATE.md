# Max as it actually is — a handoff for a designer

This is a snapshot of the shipped app, taken so a redesign can start from what
exists rather than from a description of it. It says which parts are
load-bearing — enforced by a test, or holding up a promise the product makes —
and which are simply what an agent typed on the day. **The second list is much
longer than the first, and everything on it is free to throw away.**

Written after a run of single-issue fixes left the app worse as a whole. Each
fix was correct in isolation and none was ever judged against the screen it
sat on. That is the failure this document is meant to prevent repeating:
here is the whole surface, in one place, at once.

## The captures

`docs/design/current-state/` — every product screen at **440 × 956 CSS px,
DPR 3**, which is the founder's own device, measured off a screenshot. Both
light and dark, in the default theme (quiet-voltage).

```
01-home            04-settings        07-add            10-income        13-start-month
02-week            05-recurring       08-transaction    11-import        14-login
03-year            06-one-offs        09-goals          12-review        15-signup
```

The dark N badge at the bottom-left of every capture is Next's dev-mode
indicator, not part of the app.

---

## Load-bearing: enforced in code

Changing any of these breaks a test. That is deliberate — each one is a
promise the product makes that a redesign should not quietly undo.

**The tone gate.** `src/lib/tone.ts` rejects a banned vocabulary in
user-facing copy: *overspending, waste, should have, bad habit, behind,
failed, too much*. The product is for people who avoid looking at money
because it feels like judgement, so this is the product, not a style
preference. Note the standing conflict: the original design handoff specifies
the word "Overspent" on screen 07 and the gate bans it. **The gate wins** —
state the fact without the verdict word.

**Labels are the user's own words.** Never normalised, lowercased,
autocorrected, or mapped onto an internal vocabulary. Free text in, verbatim
out.

**One bar, one grammar.** `src/components/ui/bar-grammar.ts`. The track is the
budget; the fill is spend; the empty remainder is never coloured; past the
target the *whole* fill turns over-colour at 100% width. Bar length never
carries the size of an overspend — that lives in the number. The approach
ramp added at the founder's request (flat until 72% of the track, then turning
toward the over colour) is painted in *track* coordinates so a bar at 10% is
flat. Anything that computes a percentage to decide a bar's width or colour is
doing it wrong.

**Four statuses, ordered, colour never the sole carrier.**
`src/components/ui/StatusPill.tsx`. settled → pending → review → over, each
with a tint, a graphic and an ink derived in `brand-tokens.css`. Every pill
carries the state **in words**, plus a dot, plus a ring whose weight rises
with emphasis (0/1/1/2px) — so the ordering survives for someone who cannot
distinguish the hues, and "over target" stays ahead of "settled" even though
its pink is visually softer than the settled green. Deliberately absent: red,
warning triangles, exclamation marks.

**Every colour is decided in `src/app/brand-tokens.css`, and nowhere else.**
`brand-token-contrast.test.ts` holds 146 assertions — 4.5:1 for text, 3:1 for
graphics, across every theme and mode, plus perceptual separation between the
four statuses. It can only see tokens. A colour written into a component is a
colour nobody checks, and that is exactly how a control once shipped
white-on-white.

**Eight type steps and nothing between them.** `--type-micro` through
`--type-figure`. The app previously had 28 hardcoded sizes across 285 usages;
`no-hardcoded-type.test.ts` now fails on any numeric `fontSize` in a
component.

**Five motion durations and three easings.** All clamp to 1ms under
`prefers-reduced-motion` at the token level, so reduced motion is handled once
rather than per component. Durations must be read with `motionToken()` — CSS
minification turns `320ms` into `.32s` and `parseFloat` reads that as a third
of a millisecond, which shipped two invisible animations before it was caught.

**A figure the user can't trace is a figure they have to take on faith.**
Every number should be openable to the rows behind it. The parser has misread
real data twice, and both times it was caught by opening a figure, not by
reading code.

## Load-bearing: structural

Not tested, but changing them is a refactor rather than a redesign.

**Six theme combinations, not two.** quiet-voltage and butter-static, each in
light, dark, and follow-the-OS (which is a third state, resolved in CSS with
no JavaScript). Every colour decision has to work six times. butter-static is
the awkward one: it has no amber of its own, so that hue is mixed from two
others.

**Hub and spoke, not tabs.** Home *is* the month view; everything else is a
layer over it. The bottom pill is a shortcut bar, not a tab bar — nothing in
it holds state or keeps a history stack, and deleting it would leave every
screen working. A real tab bar would claim co-equal top-level worlds, which is
the opposite of the model.

**Every scope screen is a fixed, full-viewport frame with an inner scroller.**
That is why the nav is fixed, why bottom clearance is applied to the scroller
rather than the page, and why the fold's transition works the way it does.

**Screens link to each other by route, never by importing each other's
components.** The route map is pinned in
`docs/product/07-v1-delivery-plan.md §3a`.

---

## Free: change at will

Nothing below is tested, specified, or defended. It is what accumulated.

- **Every spacing number in a component.** There is a `--space-*` scale and it
  is barely used; the screens are full of inline `gap: 22`, `padding: 20`,
  `gap: 26`, `gap: 30`. No two screens agree.
- **Card radii.** `--radius-card-sm`, `-lg`, `-hero`, `-row`, `-field` are
  applied by whichever felt right per screen.
- **The hero gradient** on home — its colours, angle and whether it should
  exist at all.
- **The One-offs · Recurring · Weeks tile row** and its pointer/tab treatment,
  which the founder has already said reads as tabs rather than cards.
- **The year screen's KPI grid** and the "where income went" stacked bar.
- **Wordmark placement.** Inline beside the month on home, standalone on
  settings, absent elsewhere.
- **The nav pill's shape, glass and geometry.** Currently 56px tall, floating
  44px off the bottom, 82% surface with a 24px blur and a lit top rim.
- **All iconography.**
- **The bar's height in each context.**
- **The whole shape of every form** — `/add`, `/goals`, `/income`.
- **Empty states and their copy** (subject to the tone gate).

## Things visibly wrong in the captures

Observations from the screenshots, not fixed, listed so they are not mistaken
for intent:

- **`/add` renders `mm/dd/yyyy`** — a US date format in a GBP app for a London
  user. That is the native date input picking up a locale nobody chose.
- **Three different ways back.** A circled chevron on `/week`, `/recurring`
  and `/add`; a plain back arrow on `/year`; and `/week` is additionally a
  full-screen sheet with its own dismiss.
- **Two typefaces for the same job.** Home and year set their big figure in
  Newsreader; `/week` sets its headline in Libre Franklin at display size.
- **The status-bar colour on a real device is butter-static's yellow** while
  the app is in the lilac theme. Source not found — the manifest's
  `theme_color` is purple.

## The one thing worth keeping in mind

The constraint that makes this product different from every other budgeting
app is that it is for people who feel judged by money. That shows up as the
tone gate, as the absence of red and alarms, as magnitude living in numbers
rather than in bar length, and as "needs a look" meaning *the app could not
place this row*, never *you did something wrong*. A redesign can change
everything above it and still be Max. Change that, and it is a different
product.
