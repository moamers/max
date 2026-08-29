# R1 · UX architecture — the disclosure ladder

**D3 · Product / UX Design Director. Round 1, written without sight of D1 or D2.**
Owns pain point 3: *"too many numbers in one screen. No progressive information download."*

Everything here is a rule a reviewer can fail with a screenshot and a count. Where I
depend on motion I describe the **behaviour**, not the styling — D2 owns how it moves.

---

## 0 · The thesis, in one line

The home screen shows **nine money figures at rest**. This proposal shows **two** —
and all nine are still **one gesture** away, and all nine become **openable to the
rows that made them in two**.

Fewer visible. None less traceable. That is the whole brief, and it is achievable
because the problem was never the count.

---

## 1 · Diagnosis — why it reads as a wireframe

I counted. Currency-formatted figures visible without scrolling or gesturing:

| Screen | Money figures at rest | Distinct interactive controls | Chart forms |
|---|---|---|---|
| `01-home` | **9** | 6 | 1 (sparkline) |
| `03-week` | **9** | 5 | 4 bars |
| `06-year` | **20** (in one viewport, before the month grid) | 3 | 3 (stacked allocation bar, line chart, bars) |
| `07-add` | 1 (`£0`) | **13 controls / ~18 tap targets, all visible before you type anything** | 1 (a slider) |

### 1.1 The nine on home

`£3,027.24` · `£6,520.70` · `£9,547.94` · `£705.71` · `£1,474.29` · `£2,180` ·
`£3,767.70` · `£573` · `+£11,806.05`.

Nine figures, presented as **peers**, in five stacked containers, with no ranking
between them. The screen has no answer in it — it has evidence, and it asks the user
to do the judging. **For a person who avoids money because it feels like judgement,
handing them nine figures and no verdict does not remove the judgement; it delegates
it to them.** That is the exact labour they opened the app to avoid, and it is why
this reads as a wireframe: a wireframe is what you get when the IA is solved and
nobody decided what the screen is *for*.

Note what the nine actually are. They are not nine facts about one thing. They are:

- one **forecast** (`£3,027.24` — a guess about the future),
- two **actuals about income** (`£6,520.70` of `£9,547.94`),
- three **actuals about the weekly budget** (`£705.71` / `£1,474.29` / `£2,180`),
- two **actuals about other buckets** (`£3,767.70`, `£573`),
- one **year-to-date net** (`+£11,806.05`).

Five different subjects, four different time horizons, one guess and eight facts —
laid out as five identical cards, in one visual register. The layout asserts they
are the same kind of thing. They are not. **The screen's structure contradicts its
content, and that is what "no soul" means in IA terms.**

### 1.2 Six specific defects, each independently fixable

1. **A forecast is stated to the penny.** `£3,027.24` "spare on 30 Aug" depends
   entirely on future behaviour, yet it is rendered with the same precision as a sum
   of recorded receipts. Penny precision asserts a confidence the arithmetic does not
   have. It is also the largest, first, most prominent figure on the screen.
2. **Duplication passes for content.** `+£11,806.05` appears on home *and* twice on
   `/year`. `41.2%` appears **three times** in one `/year` viewport; `39.3%`, `16.0%`
   and `3.5%` twice each. Eight of `/year`'s twenty figures are restatements.
3. **Three chart grammars where doctrine allows one.** `Bar.tsx` is the one grammar.
   `/year` additionally has a **stacked allocation bar** where segment width *is*
   magnitude — a direct contradiction of "magnitude never lives in bar length" — plus
   a line chart, plus a sparkline on home. The one-grammar rule is already broken and
   nobody noticed, because nobody counted.
4. **Every figure is inert.** `£3,767.70` on home is not a button. To find out what it
   is made of you must navigate to `/recurring` and trust that the two screens agree.
   The parser has misread real data twice; both were caught because a figure could be
   opened. On home, today, **not one of the nine can be opened**.
5. **`/add` front-loads thirteen controls for a task that is usually one number.** Two
   segmented controls, a slider, three text fields, three category chips, a `+ label`,
   a native date input, a submit. The date input renders `mm/dd/yyyy` — US ordering in
   a sterling app — for a value that is "today" the overwhelming majority of the time.
   *(This is a live bug, not just a design opinion.)*
6. **There is no "not now" anywhere.** The brand strategy calls this **required** —
   *"the ability to turn Max down is what makes Max safe to turn on"* — and I cannot
   find a dismissal affordance on any of the four screens I was given. This is the
   single largest gap between the strategy and the build, and it is a gap of
   *absence*, so no review has ever tripped over it.

### 1.3 What is actually good, and must survive

The hierarchy inside `03-week` is correct: one big answer, its qualifier in small
type, then the parts. The sentence under the hero (*"1 week to go. Spend the weekly
budget that's left and this is where August lands."*) is the best copy in the build —
it explains the assumption behind a forecast, which is exactly what a traceable
estimate needs. The bar's late-warming ramp is a genuinely humane decision. Keep all
three.

---

## 2 · The disclosure ladder, as a stated rule

> ### The Rule of Four
>
> **At rest, on any screen, on any viewport: at most one headline money figure and at
> most three supporting money figures. Four total. No exceptions.**
>
> **Test:** screenshot the screen in its resting state — no scroll, no gesture, no
> hover. Count currency-formatted strings. Five fails.

Companion clauses, each separately failable:

- **4a · One voice.** At most one figure per screen may be set larger than 24px. Four
  figures at 44px is four headlines, which is the same defect in a smaller costume.
- **4b · One guess.** At most one of the four may be an estimate. A screen of
  projections is a screen you cannot act on.
- **4c · Desktop may not show more.** The desktop layout at rest may not display more
  money figures than the phone layout of the same route. Extra width buys *space*, not
  *density*. This clause exists because "we have room now" is how every calm phone
  app becomes a dashboard on desktop.
- **4d · Input is not a figure.** The value you are currently typing (`£0` on `/add`)
  does not count against the cap. It is not information; it is your own hand.
- **4e · Counts are not figures, and one per row.** "14 bills", "3 days left",
  "wk 4 of 4" do not count against the cap, because they carry no valence. But at most
  one per row, or the row becomes a table.

### Why four, and not three or seven

Not Miller's number — that is folklore and has no place in a rule that must be failed
in review. Three real defences:

1. **Four is one subject.** A headline plus three qualifiers is *one thing being
   described*: the amount, what it is measured against, over what period, compared to
   what. A fifth figure is necessarily a **second subject**, and a second subject
   forces the reader to triage before they can read. Triage is the moment an avoidant
   user closes the app. The cap is not about clutter; it is about **keeping the screen
   to one question**.
2. **Four fits without compression.** At 390px, a 48–56px headline, a 15px qualifier
   line, a plain-language sentence, and one action fit above the fold with room to
   breathe. Five requires shrinking the headline or dropping the sentence, and the
   sentence is what makes the figure honest.
3. **It binds.** Every screen in the current build fails it: home 9, week 9, year 20.
   A rule that the existing product already passes is not a rule.

### The ladder itself

| Rung | What is there | Cost to reach | Example |
|---|---|---|---|
| **L0 · At rest** | ≤4 money figures, ≤1 sentence, ≤1 primary action | free | Home: `£245.68 left` · `of £545` |
| **L1 · One gesture** | Any figure that used to be at rest on this screen | one drag, one swipe, or one tap | Month horizon; the Recurring stub |
| **L2 · Two gestures** | **The rows that compose any figure** — the tape | tap a figure, then a row | `£3,767.70` → 14 bills → one bill |
| **L3 · Three gestures** | The single transaction record, editable | — | `/transaction/[id]` |
| **Never** | Anything at L4 | — | If it takes four, the IA is wrong. Move it. |

**Hard ceiling: nothing in this app is more than three gestures from rest.** Failable
by walking every route.

### The counter-rule, which is the actually hard half

Progressive disclosure decays into progressive concealment the moment the user cannot
tell that something exists. So:

> ### The Stub Rule
>
> **Every figure removed from rest must leave a visible, labelled trace of its own
> existence at rest.**
>
> **Test:** for any figure not shown at rest, point at the specific pixels on the
> resting screen that tell the user it exists. If you cannot point at them, it is
> concealed, and the change is rejected.

A stub is a **label**, and optionally a **count** — never the figure. `Recurring ·
14 bills` is a stub. A hamburger menu is not a stub. A card that is entirely
off-screen until you swipe is not a stub. The peeked *edge* of a card, with its label
readable, is a stub.

> ### The Document Rule
>
> **The Rule of Four governs pixels, not the DOM.** Every one of the nine figures stays
> in the document and in the accessibility tree at all times, whether or not it is
> painted.
>
> **Test:** disable CSS. All nine figures are present and labelled. A screen reader
> user is never subject to progressive disclosure — for them, peeked content is
> simply content.

These three rules together are the deliverable. Everything below is their application.

---

## 3 · Home, redesigned

### 3.1 The move: one figure, four horizons

The current home shows four time horizons — today, this week, this month, this year —
as **four separate objects** (a segmented control, a weeks card, two bucket cards, a
year strip). They are not four things. They are **one question at four distances**:
*how much room do I have?*

So home becomes **one figure with a scope you move.**

```
┌──────────────────────────────────────────────┐
│  August                          29 Aug   ⌾  │   ← swipe header L/R = change month
│                                              │
│                                              │
│         £245.68 left                         │   ← THE figure  (money figure 1)
│         of £545 this week · 3 days           │   ← qualifier   (money figure 2)
│                                              │
│         You've got room for the weekend.     │   ← one sentence, ≤12 words
│                                              │
│   ·Today·  ━━Week━━  ·Month·  ·Year·         │   ← the horizon. Drag or tap.
│                                              │
│                        See this week  →      │   ← exactly one "go deeper"
└──────────────────────────────────────────────┘

   The rest of August                              ← the ledger. Labels only.
   ├ Weeks          4 weeks
   ├ Recurring      14 bills
   └ One-offs       3 things
```

**Two money figures at rest.** Down from nine.

**The horizon** is a continuous scrubber, not a segmented control. Drag horizontally
anywhere on the card and the scope moves; release and it settles to the nearest tick.
The figure re-counts to its new value as you drag, driven by drag position, reversible
mid-gesture. Tap a tick to jump. On desktop: click a tick, or arrow-keys when the card
has focus.

What each horizon shows (all inside the Rule of Four):

| Horizon | Headline | Qualifier | Sentence | Go deeper → |
|---|---|---|---|---|
| **Today** | `£38.20 left today` | `of £78` | what's already recorded today | today's rows |
| **Week** *(default)* | `£245.68 left` | `of £545 this week · 3 days` | plain, forward-facing | `/week/[n]` |
| **Month** | `about £3,030 spare on 30 Aug` | `£6,520 of £9,547 income used` | *"assumes the rest of the weekly budget is spent"* | the ledger below |
| **Year** | `+£11,806.05 kept` | `of £28,643.82 earned` | plain | `/year` |

The **Month** horizon sits at exactly four figures. That is deliberate — it
demonstrates the cap has teeth, and it is the reason the cap is four and not three.

**The horizon is also the app's table of contents.** Each scope exposes exactly one
"go deeper" affordance, and those four affordances are the only four consumption
routes in the product. A user who understands the scrubber understands the whole app.
That is the structural payoff, and it is why this beats a carousel.

### 3.2 Why this beats the founder's swipe-cards — stated explicitly, as asked

The founder proposed: *"under the current/forecast card you only get one summary (say
weekly) and you can see there are other cards… you can swipe/animate between states."*

**He is right about the mechanic and wrong about the location, and I am moving it one
level down rather than dropping it.**

A carousel is the correct widget for **peers**: items of the same shape, same period,
same grammar, where "next" is meaningful. On home the candidates are not peers —
Weeks, Recurring and One-offs are structurally different things (in-play, already
decided, exceptional), across different horizons. Swiping between them teaches a false
equivalence, and it keeps the hero as a permanently-loud second zone above the deck, so
the screen still has two competing centres.

Three further costs of the home carousel:

- **It hides the relationship.** The four horizons are the *same question* at different
  distances. A carousel presents them as four unrelated answers. The scrubber makes the
  relationship the interaction — you feel the number change as the horizon moves.
- **It doesn't translate to desktop.** Horizontal pagination on a 1280px viewport needs
  a second, parallel affordance. A scope scrubber is one control that is a tick-strip on
  both.
- **It costs one of three signature moments** on something that is a container, not an
  idea.

**Where the swipe-cards idea does belong: `/week/[n]`,** where the three categories
genuinely *are* peers. See §4.1. Both of the founder's independent arrivals at
peek-don't-navigate (R3 in the taste doc) are honoured — the mechanic survives, it just
moves to the level where the content is actually a set.

### 3.3 The ledger — how the other seven figures stay visible-as-existing

Below the horizon, one section: **"The rest of August."** Three rows, **label and count
only, no money figures**. This is the Stub Rule made concrete: the user can see
Recurring exists and that it contains 14 bills, without being told a total they did not
ask for. *(This also satisfies the "no unrequested aggregates" ban more literally than
the current build does — today, `£3,767.70` is shouted at you unbidden.)*

Tap a row → its sheet opens with the total as its headline. **One gesture.**

### 3.4 The complete accounting

Every figure that is on home today, and what it costs now:

| Old figure | Now lives | Gestures from rest |
|---|---|---|
| `£3,027.24` forecast | Month horizon (rounded, "about £3,030") | **1** |
| `£6,520.70` spent | Month horizon qualifier | **1** |
| `£9,547.94` income | Month horizon qualifier | **1** |
| `£705.71` weeks left | Weeks sheet headline | **1** |
| `£1,474.29` spent | Weeks sheet qualifier | **1** |
| `£2,180` weekly budget | Weeks sheet qualifier | **1** |
| `£3,767.70` recurring | Recurring sheet headline | **1** |
| `£573` one-offs | One-offs sheet headline | **1** |
| `+£11,806.05` net | Year horizon | **1** |

**Nine at rest → two at rest. All nine still one gesture away. All nine gain a tape
they never had.** Net traceability goes *up* while visible density drops 78%.

### 3.5 What appears unprompted, and how to turn it off

Only two things may ever appear on home that the user did not ask for:

1. **A "needs a look" stub** — the parser flagged a row. `1 thing to look at` as a
   fourth ledger row. No figure, no colour alarm.
2. **A rollover prompt** at period boundaries (already exists in the build).

Both carry **the hush**, visible at rest, no gesture required:

```
   1 thing to look at                    Not now ▾
                                         ├ Not now        (back in a week)
                                         └ Don't mention this again
```

Choosing "Not now" collapses the row and replaces it, in the same space, with
`Back on 5 Sep.` — the literal date, held for ~4 seconds, then gone. **The proof of
honouring is a date, not a reassurance.** "Don't mention this again" collapses it with
`Hushed. It's in Setup if you want it back.` Hushed items are listed, in the user's own
labels, in the Setup sheet — nothing is destroyed, and the user can see they weren't
lied to.

---

## 4 · `/week/[n]` and `/add`

### 4.1 `/week/[n]` — the drill-down, and where the swipe-deck lives

Currently 9 money figures and 4 bars. Target: 4 and 1.

```
┌──────────────────────────────────────────────┐
│  ⌄                        August · week 3    │   ← drag down to dismiss
│                                              │
│  17 – 23 Aug                                 │
│  £245.68 left                                │   ← figure 1
│  of £545 · 3 days                            │   ← figure 2
│                                              │
│  ┌────────────────────────────────┐┐┐        │   ← the deck. Live card open,
│  │ Weekend                        ││|        │     siblings peeked at the edge
│  │ £29.21 left      of £190       ││|        │   ← figures 3 and 4
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░      ││|        │   ← the ONE bar
│  │ 6 things this week             ││|        │
│  └────────────────────────────────┘┘┘        │
│      Everyday   ● ● ●   Transport            │   ← labels of the peeked siblings
└──────────────────────────────────────────────┘
```

**Four figures, one bar.** The deck holds the three categories; the **live** one — the
one you're currently spending in, else the one you last touched — is open. Siblings are
peeked as stacked edges **with their labels readable**: Stub Rule satisfied.
Swipe/drag between them; the bar and figures cross-fade. Weeks change by horizontal
swipe on the header, or by the deck's own edge at week boundaries.

**One constraint I hit and have to respect, and it is worth stating because it nearly
broke the design:** I wanted the three categories as label + bar with no figures, which
would have got the screen to two. **That is illegal.** Doctrine says magnitude lives in
the number; a bar with no number makes the bar carry the magnitude. So:

> **A bar may never be rendered without its figure adjacent.** The bar is an
> ornament on a number, never a substitute for one. Failable by grep: every `<Bar>`
> has a sibling currency string.

This is why the deck exists. Three categories × 2 figures = 6, over cap. One open
category = 2, at cap with the headline pair. The disclosure mechanic here is not a
preference; it is the *only* way to hold both the Rule of Four and the bar doctrine at
once.

**Rows, not a grid.** `6 things this week` is a stub. Tap it → the transaction list for
that category. Tap either figure → its tape.

**When spend exceeds budget:**

> **State both figures and no adjective.** `£627.30 recorded · £545 set`. Never a word
> that names it. This resolves the `Screen 07 "Overspent"` conflict flagged in
> `AGENTS.md` — precedence is `TONE > METHOD`, the gate wins, and stating both numbers
> is *more* informative than the banned word was, not less.

### 4.2 `/add` — thirteen controls become one

This is the most-used interaction in the app and currently the most expensive screen in
it. Redesign as three states inside one sheet.

**State 1 — a number, and nothing else.**

```
┌──────────────────────────────────────────────┐
│  ⌄                                           │
│                                              │
│                  £0                          │   ← input, not a figure (rule 4d)
│                                              │
│              [ 1 ] [ 2 ] [ 3 ]               │
│              [ 4 ] [ 5 ] [ 6 ]               │
│              [ 7 ] [ 8 ] [ 9 ]               │
│              [ . ] [ 0 ] [ ⌫ ]               │
└──────────────────────────────────────────────┘
```

**Zero money figures. One control.** Down from thirteen. On desktop: a focused numeric
field, type-and-enter; the keypad is not rendered.

**State 2 — the sentence, on the first digit.**

```
│         £12.40  ·  Everyday  ·  today   + name it?   │
│                                                      │
│                  [ Add it ]              ⌄ more      │
```

Everything else in the form becomes **an editable sentence made of chips**, with
inferred defaults: last-used category, today, weekly bucket, Final. Each chip expands
**in place** into its options — never a new screen, never a native date input. The date
chip offers `Today · Yesterday · pick a day`; `mm/dd/yyyy` dies.

`⌄ more` holds Pending / Needs a look / note / extra label. Four controls behind one
chip, because they are used rarely and their presence at rest is what makes the current
screen feel like a form you have to complete.

**Common case: type the amount, tap Add it. Two interactions.**

**State 3 — the consequence.** The sheet leaves immediately on tap. Behind it, home's
week figure settles from `£245.68` to `£233.28`, and the new row arrives in the ledger
with a marker that decays over a few seconds. **Non-blocking and interruptible** — you
can start another add mid-settle (taste-doc R2: nothing decorative between the user and
the task).

**On writes — the question `AGENTS.md` demands an explicit answer to.** The write fires
**once**, on "Add it". **One write, one revalidation, per added transaction.** Nothing
in the sentence-chip editing touches the database — chip state is local until confirm.
The keypad is local state; the name autocomplete is a read against an already-loaded
list, not a query per keystroke. There is no controlled input in this flow whose
`onChange` reaches a server action, and no `useDebouncedCommit()` is needed because
nothing commits before confirm. This flow cannot reproduce the keystroke incident
because it has no per-keystroke path at all.

---

## 5 · Navigation model

### 5.1 Three axes, and nothing else

| Axis | Gesture | Changes |
|---|---|---|
| **Depth** | tap to open, drag down / Esc / back to close | which layer you are in |
| **Lateral** | horizontal swipe, or arrow keys | the sibling *within* the current layer — month on home, week in the week sheet, year on `/year` |
| **Scope** | drag the horizon | the time distance of the one figure on home |

Lateral never changes layer. Depth never changes sibling. That separation is the whole
model, and it is why you cannot get lost: **there is only one way back, and it always
works.**

### 5.2 Home is the only place; everything else is a layer over it

Routes stay exactly as they are — they are the seam between workstreams and they are
deep-linkable, shareable and desktop-correct. What changes is **presentation**: a route
below `/` renders as a **sheet over home** on phone, and as a **right-hand rail beside
the home spine** on desktop. Same URL, same component, same data.

| Route | Layer | Opened by | Presents as |
|---|---|---|---|
| `/` | root | — | the spine |
| `/week/[n]` | 1 | Week horizon → "See this week", or the Weeks stub | sheet / rail |
| `/recurring` | 1 | Recurring stub | sheet / rail |
| `/one-offs` | 1 | One-offs stub | sheet / rail |
| `/year` | 1 | Year horizon → "See the year" | sheet / rail |
| `/add` | 1 | the one persistent action | sheet / centred panel |
| `/goals` | 1 | Setup, **and** from any budget's tape ("where this came from") | sheet / rail |
| `/income` | 1 | Setup, **and** from the Month horizon's tape | sheet / rail |
| `/import` | 1 | Setup | sheet / rail |
| `/review` | 1 | Setup, **and** the "needs a look" stub | sheet / rail |
| `/transaction/[id]` | 2 | any tape row, any list row | sheet over sheet / inline in rail |
| **the tape** | 2 | any money figure, anywhere | sheet over sheet / inline in rail |

Rules:

- **Depth cap: two layers.** A third open replaces the second rather than stacking.
- **One gesture to rest, from anywhere.** Drag down or Esc from any depth returns to
  home. Failable by walking every route.
- **The layer beneath stays visible** (dimmed, slightly receded). You never lose your
  place, which is the entire reason for sheets over pages — it is the iMessage feel the
  founder named.
- **The hamburger dies.** It contained the navigation; navigation is now the horizon
  and the stubs. A single account affordance in the header opens **Setup** (income,
  goals, import, review, hushed items, theme). Setup is configuration, not consumption,
  and does not belong in the daily loop.
- **Back-button parity.** Browser back closes a layer; it never skips two.

### 5.3 Desktop

One centred spine, max ~560px — the *same* spine, not a re-layout. Layers open as a
right rail (~460px) beside it, so on desktop you see home and one sheet at once. That
is a genuine desktop affordance without breaking clause 4c: **the rail counts as a
separate screen for the Rule of Four, and home does not gain a single figure from the
extra width.** No multi-column dashboard. Ever. The temptation to fill 1280px with the
nine figures we just removed is the most likely way this design dies in
implementation, and 4c exists specifically to catch it in review.

---

## 6 · Widget inventory

### 6.1 Introduced

| Widget | What it is for | Where |
|---|---|---|
| **Horizon scrubber** | One figure, four time scopes, dragged. Replaces four separate objects and doubles as the app's table of contents | home |
| **The tape** | Provenance sheet: any figure → the rows that made it, in the user's own labels, each openable | every screen |
| **Peek deck** | Peers, one open, siblings peeked with labels readable. The founder's mechanic, at the level where the content is a set | `/week/[n]`, `/recurring`, `/one-offs` |
| **Stub row** | Label + count, never a figure. Proves a thing exists without asserting its total | the home ledger |
| **Sheet stack** | Depth without a navigation event; the layer beneath stays visible | every route below `/` |
| **Hush control** | Two-level dismissal with a stated return date | anything unprompted |
| **Sentence editor** | Inferred fields as tappable chips forming a readable sentence, expanding in place | `/add`, `/transaction/[id]` |
| **Keypad-first amount** | The one control on `/add` state 1 | `/add` |
| **Calibration band** *(provisional — see §8.3)* | Your own previous weeks as a positional range behind the current figure. Never a rank | `/week/[n]` |

### 6.2 Retained

`Bar` (unchanged grammar, now with the never-without-its-figure clause) · `Sheet` ·
`Card` (re-scoped: cards become objects that open, not containers that stack) ·
`Chip` · `FAB` (promoted to the single global action) · `NumericField` (desktop
`/add`) · `JustChanged` (this is exactly the §4.2 state-3 marker — it already exists) ·
`Row` · `Accordion` (Setup only) · `Scrim` · `IconButton` · `Button`.

### 6.3 Dies

| Dies | Why |
|---|---|
| `Today / End of month` segmented control on the hero | Subsumed by the horizon, which has four scopes instead of two |
| The three summary cards as always-open figure rows | Become stubs; their figures become sheet headlines |
| `YearStrip` sparkline on home | The year is a horizon on the same figure; the sparkline moves into `/year` |
| `+£11,806.05` on home at rest | An unrequested aggregate, duplicated on `/year`, and the most avoidance-triggering figure on the screen. **Flagged for the founder in §8.3** |
| `/year`'s stacked allocation bar | A second bar grammar in which width *is* magnitude. Replaced by four rows with figures |
| `/year`'s duplicated figures | Net position twice → once. `41.2%` three times → once. Eight of twenty figures deleted outright |
| The hamburger | Contained the navigation; there is no navigation left to contain |
| The native `mm/dd/yyyy` date input | Wrong locale, and three fields of friction for a value that is nearly always "today" |
| `Final / Pending / Needs a look` at rest on `/add` | Moves behind `⌄ more`; default Final |
| The amount slider on `/add` | A slider cannot express £12.40. It was never the right control for currency |
| Three-column category grids | Become the peek deck |

---

## 7 · Traceability — the hard part

The brief's sharpest tension: **fewer numbers visible, none of them less traceable.**
Four mechanisms, in order of importance.

### 7.1 The tape — every figure is a door

> **No money figure in this app is inert.** Every one is an interactive element that
> opens its own tape.

The tape shows, top to bottom:

1. **The figure**, as displayed.
2. **The operator, in words** — "£545 you set, minus 4 things recorded".
3. **The rows**, in the user's **verbatim labels** (doctrine 3 — free text in, verbatim
   out), with date and amount. Each row opens `/transaction/[id]`.
4. **Where the other term came from** — a budget links to `/goals`, an income figure
   links to `/income`. A budget the user cannot trace is as opaque as a total.
5. **For an estimate: the assumption, in words**, and no row list — because there are no
   rows yet. *"Assumes the rest of this month's weekly budget is spent."*

One mechanism, learned once, works everywhere. **This is strictly more traceable than
today**, where the nine home figures are all dead ends.

**The gesture, on both platforms.** Splitting tap targets by role, consistently:

> **The label navigates. The figure opens itself.**

Tap `Recurring` → the recurring sheet. Tap `£3,767.70` → its tape. Same rule on every
row in the app, so there is never a question about what a tap will do. On desktop:
click, with a dotted baseline on hover marking every figure as openable. No long-press,
no hover-only affordance, no gesture a touch user cannot perform.

### 7.2 Precision is a provenance signal

> **A figure that is a sum of recorded rows is displayed exactly. A figure that depends
> on future behaviour is rounded to the nearest £10 and prefixed "about".**

`£245.68 left` is a fact. `about £3,030 spare` is a projection. The **shape of the
number tells you which**, before you read a word — and the current build's
`£3,027.24 forecast` was quietly lying about its own confidence to two decimal places.
This costs nothing, removes visual noise, and is failable: grep for a forecast rendered
with pence.

### 7.3 Peeked is not hidden

The Document Rule (§2) is an engineering instruction, not a nicety. Peeked deck
siblings, closed stubs and non-active horizons stay in the DOM and the accessibility
tree. Consequences: in-page find works, screen readers read all nine figures, and
`prefers-reduced-motion` users get the full content with no transitions at all and lose
nothing. **Test: load home with CSS disabled — all nine figures present and labelled.**

### 7.4 A flag can never be disclosed away

A "needs a look" row is the one output of a parser that has been wrong twice. It surfaces
at rest, as a stub, on home, always. It can be hushed by the user — never by the layout.

---

## 8 · What makes this memorable, and what is merely tidy

The founder asked for wow. Here is my honest split. **Three things here are memorable.
Most of this document is not, and pretending otherwise would waste his time.**

### 8.1 Memorable — the three a person would show a friend

**1 · The horizon scrub.** One number that lives under your thumb across today, this
week, this month, this year. Every other finance app makes you navigate to a different
screen for a different period; here the periods are a *dimension of the same figure*,
and the relationship between them becomes something you can feel. The sentence
*"there's only one number on the home screen and you slide it through time"* is the
kind of thing a person repeats.

**2 · The tape.** Press any number, anywhere, and it opens into exactly what made it,
in your own words, down to the individual receipt. *"You can tap any number and it opens"*
is a sentence people say out loud, and for the sceptical friend — the one who thinks
these apps make numbers up — it is the entire pitch in one gesture. It is also the only
idea here that is simultaneously the wow moment and the compliance mechanism for
constraint 5. **If only one thing from this document survives R2, it should be this
one.**

**3 · Two-tap add, with a visible consequence.** Type £12.40, tap Add. The sheet is gone
before the animation starts, and the week figure you were looking at settles to its new
value with the new row arriving beneath it. Capture is faster than any budgeting app I
know of, and — the part that matters — **the thing you were looking at visibly
changes because of what you did.** That is what "living organism" means concretely:
not decoration, but consequence. Fastest capture wins the daily habit; visible
consequence wins the second week.

Those three are also exactly three, which is what the taste doc's **R1 motion budget**
allows. So this hands D2 a closed set: *the horizon scrub, the tape open, the add
settle.* Nothing else in this architecture asks for a signature moment.

### 8.2 Merely tidy — worth doing, not worth showing anyone

Said plainly so nobody oversells it in R3:

- **The sheet stack and the depth model.** Good craft. Completely invisible when it
  works. Nobody has ever shown a friend a sheet.
- **The desktop rail.** Competent. Prevents a regression. Not an idea.
- **Killing the hamburger, the stacked cards, the sparkline, the slider.** Subtraction.
  The screen gets better; nothing gets memorable.
- **Deduplicating `/year`.** A correctness fix. Deleting eight of twenty figures is the
  single biggest density win in this document and it is worth precisely zero wow.
- **The hush.** Ethically load-bearing — the brand strategy calls it the thing that
  makes Max safe to turn on — and it is *not* a wow. Its one small memorable pixel is
  the proof line: `Back on 5 Sep.` A date, not a reassurance. That is the moment a
  user learns Max does not nag, and it is worth a great deal, but it is not what gets
  shown to a friend.
- **Rounded-vs-exact.** I like it a lot and most users will never consciously notice it.
  It is a trust mechanism operating below awareness, not a feature.
- **The Rule of Four itself.** A review instrument. Invisible in the product.

### 8.3 Honest risks, and one decision for the founder

- **The horizon can become a hidden control.** If the ticks don't read as interactive,
  three of four scopes are concealed and the Stub Rule is broken by execution rather
  than by design. Mitigations: ticks labelled and tappable at rest, active one marked,
  a one-time hint on first run. **This needs prototyping before R3; it is the single
  highest-risk element here.**
- **A wrong inferred default on `/add` is worse than a slow form.** Two-tap add guesses
  the category. A wrong guess that the user doesn't notice corrupts their data and their
  trust in it. The sentence is always visible above the button, which is the mitigation,
  but this needs testing with a real person, not reasoning.
- **The calibration band is the riskiest widget in this document.** *"A normal week for
  you is £180–£260"* is calibration, not ranking — it compares the user only to
  themselves and there is no other party in it. But it can still read as a standard
  being held to. **Recommendation: build it, ship it off by default, make it hushable,
  and put it to the founder as its own decision.** If in doubt, cut it — everything else
  here works without it.
- **Removing `+£11,806.05` from home is a founder decision, not mine.** It is an
  unrequested aggregate, duplicated on `/year`, and by my reading the most
  avoidance-triggering figure on the screen. It may also be the figure he considers the
  payoff of the entire product. It is one gesture away in my design, not gone. **Escalate
  to the R3 decision list.**
- **The peek deck has a real accessibility cost.** The Document Rule mitigates it; it
  does not erase it. Needs a screen-reader pass, not an assumption.

---

## 9 · The failable rules

Numbered so R2 can cite them. Every one can be failed by a screenshot, a count, a grep,
or a walk of the routes.

**Density**

1. At rest, any screen shows at most **four money figures**. Screenshot, count currency
   strings, five fails.
2. At most **one** money figure per screen is set larger than 24px.
3. At most **one** of the four at rest is an estimate.
4. The desktop layout of a route shows **no more** money figures at rest than its phone
   layout.
5. Counts and dates don't count against rule 1, but at most **one per row**.

**Disclosure, not concealment**

6. Every figure removed from rest leaves a **labelled stub** at rest. If you cannot
   point at the pixels, it is concealed and the change is rejected.
7. All figures stay in the **DOM and the accessibility tree** whether painted or not.
   Test: CSS off, all nine home figures present and labelled.
8. Nothing is more than **three gestures** from rest. Walk every route.
9. From any depth, **one gesture returns to rest**. Drag down, Esc, or back.
10. **Depth never exceeds two layers.** A third open replaces the second.

**Traceability**

11. **No money figure is inert.** Every one opens its own tape. Grep: every rendered
    currency string is inside an interactive element.
12. **The label navigates; the figure opens itself.** No exceptions, on any row, on any
    screen.
13. A tape shows the operator **in words**, the composing rows in the user's **verbatim
    labels**, and a link to where any non-transaction term (a budget, an income) was set.
14. **Exact means recorded; rounded means estimated.** A figure summed from rows is
    displayed to the penny. A figure depending on future behaviour is rounded to £10 and
    prefixed "about", and its tape states its assumption. Grep: no forecast rendered
    with pence.
15. A **"needs a look"** flag always surfaces at rest. It may be hushed by the user,
    never by the layout.

**Tone and safety**

16. **No element in the top 40% of the first paint uses the over/negative colour role.**
    Screenshot test. The opening view is never a judgement.
17. Where spend exceeds budget, the screen **states both figures and no adjective**
    (`£627.30 recorded · £545 set`). No word names it.
18. Anything Max raises unprompted carries a **hush affordance visible at rest**, with
    two levels, and the "not now" confirmation **states the return date**.
19. Hushed items are **listed and restorable** in Setup. Nothing is destroyed silently.
20. Comparison shows the user only against **their own history**, is off by default, and
    is hushable. No cohort, no percentile, no rank.

**Grammar**

21. **A `<Bar>` never renders without its figure adjacent.** Grep: every `<Bar>` has a
    sibling currency string.
22. **One bar grammar in the whole app.** No second width-carries-magnitude widget —
    the `/year` stacked allocation bar is deleted, not ported.
23. **At most three signature motion moments** in the product. They are: the horizon
    scrub, the tape open, the add settle. Any fourth requires deleting one.
24. Every motion is **interruptible**, and with motion disabled entirely the app loses
    **no information and no affordance**.

**Writes**

25. **`/add` performs exactly one database write, on confirm.** No control in the flow
    writes on change. There is no per-keystroke path.

---

## 10 · What I need from D1 and D2 (R2 inputs)

- **D1:** the horizon ticks need a resting state that reads as interactive without an
  icon. Peeked deck edges need a material that says "there is a card behind this",
  which is a shadow/edge/elevation decision, not an IA one. And the light-vs-dark
  question matters here more than usual: **rule 16 (no negative colour in the top 40%)
  is much harder to hold on a near-black ground**, where a single lime or red figure is
  the only lit object on the screen.
- **D2:** three signature moments, named and closed, in rule 23. The horizon scrub is
  the one that must be prototyped first — it is the highest-risk element in this
  document, and if drag-to-scrub doesn't feel right, the home screen falls back to a
  four-tick tap control and loses most of its wow.
- **Open conflict I can already see:** if D1 proposes a light default and D2 proposes
  depth-based sheet transitions, the "layer beneath stays visible" model needs a
  non-shadow depth cue. Flagging early rather than discovering it in R3.
