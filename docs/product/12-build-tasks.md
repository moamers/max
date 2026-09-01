# Build tasks — navigation, recurring, and periods by default

Three tasks raised by the founder, split by how much thinking they need before
anyone writes code. **Task A is ready to delegate. Task B is built apart from
its forward half, and Task C's open decision was overtaken by the founder — see
the notes at the head of each.**

None of these are design-direction work. The design overhaul (`docs/design/direction/`)
is a separate, unlanded workstream — see the note at the end of Task A.

---

## The sequence

*Written 2026-09-01, after the founder stopped a Codex run mid-flight to get the
order straight first. Nothing was lost — `codex/bottom-nav-pill` never reached
the remote.*

Six tasks were accumulating in parallel and three of them touch the same files.
This is the order they should be done in, and the reason each step blocks the
next. **Every step here is a real dependency, not a preference** — doing them
out of order means writing something twice.

### The spine

| # | Task | Who | Why it is here and not elsewhere |
|---|------|-----|----------------------------------|
| 1 | **Type scale** (Codex's Q2 answer) | Claude | Touches **33 files**. Everything built after it inherits the scale; anything built before it gets rewritten in the pass. It is the floor, so it goes first. |
| 2 | **Task D — month view** | Claude | Restructures `HomeScreen`. After the scale so it is written in it; before the nav and the motion because both of those land on whatever structure this leaves behind. |
| 3 | **Tasks A + F — nav pill and `/settings`** | **Codex** | Bounded, fully specified, and the natural place to bring Codex back in. Lands on D's final structure, so its clearance padding is measured against the real thing. |
| 4 | **Task E — motion** | Claude | Animates the finished structure. Last of the UI work by necessity: animating something that is about to be restructured is work thrown away. |

**A and F are now one task, not two.** A leaves a hamburger in `HomeScreen` and
F removes it; shipped separately there is a window where home has two routes to
the same place. They were only split because Codex was mid-run.

### The parallel track

These touch `src/lib/` and nothing else, so they can run at any point without
colliding with the spine:

- **`G-3`** — the parser checks its own arithmetic against the totals the sheet
  states for itself. This is the one that would have caught `F-3` on day one,
  and it turns "are the numbers still right?" into something the app answers
  rather than something the founder checks against a spreadsheet.
- **`G-1`** — ingest carries no year, so cross-year comparison is impossible.
- **#42** — delete the `probe@example.com` account from production.

### Folded in, no longer separate items

Each of these lives in a file some step above already opens. Tracking them
separately is how a to-do list grows without the work growing:

- **Legacy colour aliases** (`--cyan-ink`, `--amber-ink`, `--attention-ink`,
  `--bar-over`) → into step 1, which is already editing all 33 of those files.
- **The two hardcoded durations** (`CaptureButton`'s 160ms, `ImportScreen`'s
  fade) → into step 4.
- **`Checkbox` and `StatusPill` missing from `/styleguide`** → into step 1.

### Waiting on the founder

Not blocking the spine, but each blocks something:

| Item | Blocks |
|---|---|
| **`C-2`** — rotate the Supabase password and Expo token, both exposed in a chat transcript | Nothing technical. It is a live credential exposure and the oldest open item on the register. |
| **`G-5`** — is "change this bill and every month after" wanted? | Whether Task B's forward half is ever built. Cheapest to answer before a third month of copies exists. |
| **A real workbook with yellow highlighting** | Calibrating the import thresholds against actual data instead of an agent's judgement. |
| **`A-7`** — "Overspent": the design says it, the tone gate bans it | A documented exception, or the gate wins permanently. Current behaviour follows the gate. |

---

# Task A — floating bottom navigation · SPECCED · step 3, with Task F

## The brief, in the founder's words

> Can you explore a bottom navigation floating pill style like iOS glass style?
> Then we could be 'home' and 'current week' and 'calendar' which shows the
> months. We can add other quick links if you see relevant. As long as it can
> look the same as iPhone?

Reference supplied: Instagram's floating pill on iOS — a translucent, heavily
rounded bar hovering above the content, blurring what passes beneath it.

## One decision already made, so the task is unblocked

The UX director's proposed model (`r1-ux-architecture.md` §5.2) is
**hub-and-spoke**: *"Home is the only place; everything else is a layer over
it."* A tab bar implies co-equal top-level destinations, which is the opposite
claim.

**Resolution: build it as a shortcut pill, not a tab bar.** Concretely — every
item navigates to a route, and nothing maintains its own independent history
stack. That is what the founder actually described (home / current week /
calendar are shortcuts, not parallel worlds), and it stays compatible with the
sheets-over-home model if that direction is adopted later. If the pill is later
removed, nothing else has to be rebuilt.

## Prompt for Codex

*Refreshed 2026-09-01. The previous version predated the Ravel rename, the
two-theme brand kit, the motion scale and three of the routes; every fact below
was re-checked against the tree at that date.*

> **Branch:** create and push `codex/bottom-nav-pill`. Push it to the remote and
> confirm it exists there before you consider the task done. If you cannot
> determine which branch to base on, **ask rather than guess** — do not push to
> `claude/budget-app-spending-insights-i5fnch`, which auto-deploys.
>
> Read `AGENTS.md` and `docs/product/08-contributor-guide.md` first. The tone
> constraints and doctrines there are the product, not style advice.
>
> **Task.** Add a floating bottom navigation pill to Ravel, a personal-finance
> web app for people who avoid looking at money. Style it like iOS's translucent
> glass bars (Instagram's iOS tab bar is the founder's reference): it hovers
> above the content rather than sitting in a fixed chrome band.
>
> ⚠️ **Codex began this task against the EARLIER item set** (Home / This week /
> Calendar, no Settings, hamburger untouched). The revision below arrived after
> it started, so what lands on `codex/bottom-nav-pill` will not match this
> section. The founder's call: let it finish, then apply the change as a
> follow-up rather than interrupting a run mid-flight. Retitling and
> re-pointing three links is minutes of work; the menu-becomes-a-screen half is
> the part with real scope, and is written up as Task F below.
>
> **Items, left to right** (revised by the founder 2026-09-01 after seeing the
> motion prototype — this supersedes the Home / This week / Calendar set in the
> brief above):
> 1. **Week** → `/week/<currentWeekNumber>?period=<selectedPeriodId>`
> 2. **Month** → `/?period=<selectedPeriodId>` (home *is* the month view)
> 3. **Year** → `/year?period=<selectedPeriodId>`
> 4. **Settings** → `/settings`
>
> Do not add further items.
>
> **The hamburger goes, and the menu becomes a screen.** Today the menu is a
> drawer: `src/components/home/HomeScreen.tsx` holds `menuOpen` state, opens it
> from a `HamburgerIcon` `IconButton`, and renders `<Menu>` over the page. The
> founder's instruction is that "Settings" is a nav destination instead. So:
> move `src/components/menu/Menu.tsx` behind a real `/settings` route, delete
> the hamburger and its state from `HomeScreen`, and keep every control the menu
> currently carries — including "Clear data", which is a destructive action and
> must keep its existing two-step confirmation exactly as it is.
>
> This is an IA change, not just a new component, so it is the part most likely
> to have consequences you did not expect. Two in particular: `/settings` has no
> period, and every other route carries one — decide whether it takes
> `?period=` for the trip back and say why; and the menu currently receives
> `periodCount` and `brand` as props from a screen that has already loaded them,
> which a standalone route will have to fetch for itself. Do not let that fetch
> happen on every render of the pill.
>
> **It is a shortcut pill, not a tab bar.** Every item navigates to a route and
> nothing maintains its own history stack. The app's model is hub-and-spoke —
> home is the only place, everything else is a layer over it — and a tab bar
> would make the opposite claim. Build it so that removing it later breaks
> nothing else.
>
> **Non-negotiable — the period must travel.** Every link carries `?period=`. A
> navigation that drops it silently sends the user to a different month; that
> was a real bug (#49) and is guarded by
> `src/lib/__tests__/period-travels-with-the-link.test.ts`. Use the helpers in
> `src/lib/routes.ts` (`periodHome()`, `transactionHome()`, `sheetParent()`)
> rather than building URLs by hand, and extend that guard to cover the nav.
>
> **"This week" means the current week of the *selected* period**, not today's
> calendar week. If the selected period is a past or future month it is that
> period's live week, or week 1 when today falls outside it. Get this wrong and
> the control lies about where it is taking you.
>
> **The FAB collides with you.** `src/app/week/[weekNumber]/WeekView.tsx:138`
> renders one at `position: fixed; right: 20; bottom: 20; zIndex: 7`. Resolve it
> deliberately — lift it above the pill, or fold "add" into the pill — and say
> which you chose and why. They must not overlap.
>
> **Clearance, and it is not page padding.** These screens are
> `position: fixed; inset: 0` flex columns with an inner scrolling region, so
> bottom clearance belongs on the *scroller*, not the page:
> `src/components/home/HomeScreen.tsx:44`, `src/components/year/YearView.tsx:185`
> (currently `padding: "18px 20px 40px"`), and
> `src/app/week/[weekNumber]/WeekView.tsx:85` (already `8px 20px 108px` for FAB
> clearance). Audit every scrolling screen rather than assuming those three:
> the full route list is `/`, `/add`, `/goals`, `/import`, `/income`,
> `/one-offs`, `/recurring`, `/review`, `/start-month`, `/transaction/[id]`,
> `/week/[weekNumber]`, `/year` (plus `/login`, `/signup`, `/styleguide`).
>
> **Colour: read the tokens, never a literal.** The palette lives in
> `src/app/brand-tokens.css`, which is the only place a colour is decided.
> There are **two themes** (`quiet-voltage`, `butter-static`), each with light
> and dark, driven by `data-theme` and `data-mode` on `<html>` (see
> `src/app/layout.tsx`). `data-mode` has **three** states, not two: an explicit
> choice wins, and when the attribute is absent the OS preference decides in CSS
> alone. Your pill must be correct in all four theme/mode combinations and in the
> un-stamped state. Use `--surface`, `--hairline-*`, `--text-*`, `--lime-fill`
> and friends; `--radius-pill` is the shape token.
>
> **Motion: use the scale, do not invent durations.** `src/app/globals.css`
> defines five steps — `--motion-instant` (90ms), `--motion-quick` (140ms),
> `--motion-standard` (220ms), `--motion-deliberate` (320ms), `--motion-scene`
> (480ms) — plus `--motion-stagger` and `--ease-standard` / `--ease-enter` /
> `--ease-exit`. Reduced motion is clamped at the token level, so if you use the
> tokens it is already handled; if you hardcode a duration you have broken it.
>
> **iOS glass, done properly:**
> - `backdrop-filter: blur(20px) saturate(180%)` **with** the `-webkit-` prefix.
> - A solid fallback under `@supports not (backdrop-filter: blur(1px))`, built
>   from the theme tokens — the bar must stay legible where blur is
>   unsupported, never become transparent.
> - `padding-bottom: env(safe-area-inset-bottom)` so it clears the home
>   indicator. Say how you verified this; a simulator width is not a check.
>
> **Accessibility:** real `<a>` elements, not divs with handlers. Visible focus
> states, `aria-current="page"` on the active item, hit targets of at least
> 44x44px, fully operable by keyboard. Labels are words, not icons alone.
>
> **Constraints from `AGENTS.md` that bite here:**
> - No new dependencies.
> - This is navigation only. **It must not write to the database** — not on
>   render, not on press. A source scan already asserts no screen writes on
>   render; do not be the first.
> - Use the primitives in `src/components/ui/` and extend one rather than
>   building a parallel version. `Bar.tsx` owns the one chart grammar; never
>   compute a bar's width or colour anywhere else.
> - Any user-facing string must pass the tone gate in `src/lib/tone.ts`. Run it
>   over your copy.
> - Read `node_modules/next/dist/docs/` before writing App Router code. This is
>   Next.js 16 and `proxy.ts` replaces `middleware.ts`; it differs from your
>   training data.
>
> **The four gates must all be clean:** `npx tsc --noEmit`, `npm run lint`,
> `npx vitest run`, `npm run build`. There are currently 1072 passing tests; do
> not reduce that number.
>
> **Report:** what you built, what you deviated from and why, any file outside
> your task's ownership you touched, and — most importantly — anything you are
> not confident is correct. An overstated report is worse than a gap. Say
> explicitly how you resolved the FAB collision, which screens you added
> clearance to, and how you checked the safe-area inset.


---

# Task B — recurring carry across months · BUILT (backward half)

> **Built.** `createPeriod` carries the previous month's recurring in behind the
> button that creates the month, and `/recurring` offers the same copy from its
> empty state. Copied rows are `pending`, the copy is refused for a month that
> already holds any recurring row, and the whole thing is one multi-row insert.
> **Not built:** `series_id` and the forward push described under "Added by the
> founder" below — nothing in the shipped carry uses either, and an unapplied
> column on an auto-deploying branch breaks every insert until a human runs the
> migration. Tracked as `G-5` in `docs/00-open-decisions.md`.


## The brief, in the founder's words

> the recurring are technically amounts that happen every month. So when you
> open a new month they need to be replicated rather than start from 0. And the
> recurring screen almost should be by default a copy of previous months, that
> you can amend in each month or leave as is (without affecting previous or
> future for now). By default they should be left pending state. We might have
> to customise the copy/change logic so it should he designed technically in an
> extensible way but we should start with a simple logic for now and complicate
> later

## The one thing that must not be got wrong

**Replication happens when a period is created, never when one is opened.**

"When you open a new month" is the natural way to say it, but implementing it
literally means a database write on page load. That is the failure this project
has already had once — typing a three-digit target queued three writes and
eighteen queries in a second and took production down — and it is why
`src/lib/__tests__/no-write-per-keystroke.test.ts` exists. The `/add` work in
#46 held the same line: opening a screen must never create a period.

So: `createPeriod()` gains replication, behind the same button press that
already creates the month. Opening `/recurring` stays a pure read.

## The design

**Copy rows, don't compute a template.** The founder's requirement — *amend in
each month without affecting previous or future* — is exactly the behaviour of
ordinary independent rows. A template that renders derived rows would make
per-month amendment the hard case rather than the default.

**What gets copied.** From the most recent period *before* the new one that has
any recurring rows (not necessarily the immediately preceding one, which may be
empty): `merchant`, `note`, `amount`, `category`, `label`.

**What gets reset:**
- `pending = true` — the founder asked for this explicitly. A copied bill is a
  prediction, not a fact, until it is confirmed.
- `needs_attention = false`, `attention_reason = null` — an unresolved flag is
  about a specific past import, and carrying it forward would manufacture alarm.
  Note the DB already enforces `NOT (pending AND needs_attention)`.
- `occurred_on` — shifted to the same relative day in the new period, or set
  null if that falls outside it.
- `raw_import = null` — the copy did not come from a file, and provenance must
  not lie (doctrine 5).

**Idempotent.** `createPeriod` is already idempotent on
`(user_id, start_date, end_date)`. Replication must be too: only replicate when
the target period has **zero** recurring rows. Creating the same month twice
must never double the bills.

**Deletion propagates naturally.** Because each month copies from the previous
one, deleting a bill this month means it is simply absent next month. No
tombstone needed.

## The extensibility hook, built now because it is nearly free

Add a nullable `series_id uuid` to `transactions`, stamped on every copy and
inherited by subsequent copies. It does nothing today.

It is what makes *"change the rent from March onwards"* possible later without a
data migration — the alternative is matching on merchant text, which breaks the
moment someone renames a row, and which would violate doctrine 3 (labels are the
user's own words; never normalise them to match).

**This needs a migration.** Per `AGENTS.md` non-negotiable 7: write
`drizzle/0007_transaction_series.sql` with the next ordinal, carry existing rows
across rather than rebuilding them, and **a human applies it.** Do not apply it.

## Added by the founder: pushing a *new* recurring forward

> add that if the users creates a new recurring transaction. It should ask
> whether it needs to he inserted in future months (assuming periods have been
> created) or not

This is the first **forward** write in the feature. Everything above is
backward-looking — a new month reaches back and copies what the last one had.
This reaches forward from one action into months that already exist.

**It brings `series_id` forward from groundwork to load-bearing.** The rows
written into future months are siblings of the one being created, and stamping
them at insert is what makes a later "remove this from the months ahead"
possible without matching on merchant text. Build it in this task, not later.

### Where the question is asked

On `/add`, inline, only when `kind === "recurring"` **and at least one period
starts after the current one.** With no future periods there is exactly one
possible answer, and a question with one answer is noise.

It is part of the Add form, not a confirmation step after saving. A second step
after the write is a second chance to lose it.

### What it says

Name the consequence with a number, not a category — the user should never have
to work out what "future months" means for them:

> **Also add this to the 2 later months** — September and October

**Default it on.** The user has already chosen the *recurring* kind, which is
the claim that this happens every month; defaulting off would make them say so
twice. But the copy must state the scope plainly, because the default writes to
more than one month.

### The rows it writes

Same rules as replication above: `pending = true` in every future month (a bill
that has not happened yet is a prediction), `needs_attention = false`,
`raw_import = null`, `occurred_on` shifted to the same relative day or null.
The row in the *current* month is exactly what the user typed — the choices they
made are not overridden by the propagation rule.

### Timing — say it out loud, per AGENTS.md

**One user action. One server action. One database transaction. N+1 rows.**

Two things this must not become:

1. **N round trips.** Use a single multi-row insert inside
   `db.transaction(...)`, the way `createPeriod` already does. A loop of inserts
   over the network is the mistake `store.ts` was rewritten to avoid.
2. **N revalidations.** Writing to five months must still revalidate the
   *routes* once — `/`, `/recurring`, `/year` — not once per row. Revalidating
   `/` re-runs the home screen's queries, and doing that in a loop is precisely
   what took production down before. Collect the affected paths into a `Set`
   and revalidate each once.

### The asymmetry to state in the report, not paper over

**Creating** a recurring can now reach forward. **Editing** one still changes
only its own month. That will feel inconsistent the first time a rent rise is
typed into a month that has ten copies ahead of it.

That is the right place to stop for now — the founder asked to start simple —
but it is the next thing this feature will need, and `series_id` is what will
make it a small change rather than a rewrite. Do not build it in this task.

## Open decision

**Nothing blocking** — the above is implementable as specified. The one thing to
confirm is whether a copied bill should be `pending` (as the founder said) even
when the same bill was confirmed every month for the last year. Recommendation:
**yes, keep it simple and pending**, as asked. Auto-confirming a bill that has
not been seen on a statement would be the app asserting a fact it does not have.

---

# Task C — periods created by default · SUPERSEDED BY THE FOUNDER

> **The decision table below is moot.** The founder resolved it directly:
>
> > "for non created months a user should be allowed to click and see empty
> > month state screen which shows the create month message/button with check to
> > copy recurring I described earlier by default checked"
>
> So **nothing is pre-created** — not a rolling window, not a year. A month that
> does not exist yet is navigable: tapping its tile in the month picker opens
> `/start-month`, which shows what that month would cover and offers to start
> it, with the copy-recurring checkbox ticked. Creation stays lazy and on the
> press, which is also what keeps the "opening a screen must never write" line
> intact. The rest of this section is kept for the reasoning about the past,
> which still holds and is now enforced server-side.


## The brief, in the founder's words

> I'm thinking about simplifying the experience. A new usr won't understand the
> week periods. Just create them by default (considering 2 for recurring so we
> don't start each month from 0) not all the year but all months in the year in
> the future not the past, because the past might mess up numbers if the
> spendings aren't included.

The instinct is right and the reasoning about the past is correct: back-filling
months with no transactions would render a year of £0 spending as though it were
real, which is a number the user cannot trace back to anything.

## What already exists

`proposeFirstPeriod()` (built for #46) picks the first Monday of the current
month, falls back to the current week before that Monday, and rolls forward if
that period has already ended. `proposeNextPeriod()` chains from any period's
end date. Periods are always whole Monday-to-Sunday weeks, 4 or 5 of them, ending
nearest a month boundary — **not calendar months.** So "all months in the year"
means chaining `proposeNextPeriod` until the chain passes 31 December.

## The decision, and why it is not just a number

Creating N months ahead also replicates Task B's recurring into all N. That is
roughly ten rows per month. The consequence is not storage — it is **editing**.

> Rent goes up in March. With twelve months created, that is ten months of
> copies to correct by hand.

So the choice is really between two packages:

| | **Rolling window — recommended** | **Full year ahead** |
|---|---|---|
| Create | current + next 2, extended when you enter the last | every period to 31 Dec |
| Recurring rows | ~30 | ~120 |
| A bill changes mid-year | edit 1–2 months | edit up to 10 |
| Needs "apply to this and later months" | not yet | **immediately, in this task** |
| Matches "start with a simple logic for now" | yes | no |
| Year screen shows future months | as not-yet-started | as created and empty |

**Note the founder's addition to Task B shifts this slightly.** Now that a *new*
recurring can be pushed into every future month in one action, the full-year
option is less painful than it was — creating bills forward is solved. What is
still unsolved is *editing* an existing one across months, which is where the
ten-months-by-hand problem actually lives.

**Recommendation: the rolling window.** It satisfies both stated goals — a new
user is never faced with an empty app, and recurring never start from zero —
without forcing the propagation feature the founder explicitly wanted to defer.
Full-year does not merely create more rows; it makes *"change this and every
month after"* mandatory on day one.

**If the founder prefers the full year anyway, that is fine — but the
propagation feature comes with it**, and Task B grows accordingly.

## Either way

- **Still a button press, never a page-load write.** Whichever window is chosen,
  the periods are created by an explicit action — first import, or the "start a
  month" control already built for #46. Extending the window as the user moves
  forward is also a press, not a side effect of rendering.
- **Never create periods in the past.** The founder's reasoning holds.
- **Idempotent.** Running it twice creates nothing new.
- Blocked by Task B, since creation is what triggers replication.

---

## Sequencing

**A** is independent and can start now. **B** must land before **C**, because
creating a month is what replicates the bills into it.


---

# Task D — the month view opens into one thing at a time · SPECCED · step 2

## The brief, in the founder's words

> On "month" view, the default should be one-offs not weekly. There must be a
> way to tie the selected card at the top to the detailed view. The "selected"
> card has to have another style, that is visually linked to the below view.
> Each week can be opened not just the last one. Each line is a card/link in
> itself. "Add one" "see them" — remove this BS.

> It should open on one-offs and one-offs transactions under it. When you click
> recurring it'd be recurring under it, when you click weeks it'd be weeks under
> it.

And, from the original design pain points:

> Too many numbers in one screen. No progressive information download.

## What home does today

A single vertical stack in `src/components/home/HomeScreen.tsx`: header,
`HeroCard`, an optional `RolloverPrompt`, `WeeksCard` (an inline expander that
lists every week of the month at once), then a **Recurring** card and a
**One-offs** card that are both `Link`s *away* to `/recurring` and `/one-offs`,
then `YearStrip`.

So the three things are currently three different interaction models: one
expands in place, two navigate away. That is the "too many numbers, no
progressive disclosure" complaint in structural form — the weeks card dumps
every week's figures on the screen whether or not anyone asked.

## The design

**Three cards, one detail region.** One-offs · Recurring · Weeks, in that
order, as a selectable set. Exactly one is selected; the region beneath it
shows that selection's rows and nothing else. **One-offs is selected on open.**

**The selected card is visually joined to the region below it.** Not merely
highlighted — the two must read as one shape. Losing the join is how the
prototype ended up showing "one-offs" selected while weeks were listed
underneath, which is worse than no selection at all because it lies.

**Every week is openable, not just the current one**, and each week is its own
card that links to `/week/<n>?period=<id>`. Today `WeeksCard` gives the last
week special treatment; that goes.

**Cut the invitational microcopy.** "Add one →", "See them →", "Totals →" are
gone. A card that is tappable should look tappable; a row does not need to ask.

## Decisions to make, not to guess

- **Does the inline region replace `/recurring` and `/one-offs`, or preview
  them?** Both routes exist and are reachable from elsewhere. Recommendation:
  the region shows the rows in full and the routes stay as deep links, so
  nothing breaks and there is one fewer hop. Say which you chose.
- **Where does the hero's own figure sit** once the month has a selected
  section — it is the month's headline, not one-offs'. It should not move.
- **Selection is view state, not a preference.** It must not be written to the
  database, and it must not be a route change either: a scope switch is not a
  new page.

## Constraints

- `AGENTS.md` rule 8 — nothing here writes on a keystroke or on a tap.
- The tone gate applies to every string that survives the microcopy cull.
- Use the existing primitives; `Bar.tsx` still owns the one chart grammar.

---

# Task E — motion, in the build rather than a prototype · SPECCED · step 4

## The correction

The prototype was built as a fresh design carrying motion. What was asked for
was motion carrying **the existing app**. The founder's verdict — "looks like a
wireframe", "far from the current app", "don't change the IA" of the year and
transaction screens — is all one point: the components are fixed, and the
interaction layer goes on top of them.

The four moments themselves are accepted ("all good re animation types"). The
objection is execution: *"they're laggy, I'm not impressed, they need to be
flawless in build."*

## Two defects diagnosed in the prototype, both real

Neither is an artefact of it being a prototype, and both would ship into the
app if the timings were copied across.

**1 · The headline cross-dissolve is double vision.** `morph()` fades the
outgoing ghost out across 0–62% of a 320ms travel while the incoming ghost
fades in from 24% — a 121ms window with both painted, superimposed, at
different scales. That reads as a morph only when the figure is *the same
number*. Week→Month shares £245.68, so it works. Week→Year shares nothing,
falls back to headline-to-headline, and cross-dissolves £245.68 into
£11,806.05 — two different numbers on top of each other.

> **Rule: a shared-element transition requires a shared element.** Morph only
> on an exact key match. Where the figures differ, hand off hard — the old one
> is gone before the new one arrives — with no overlap window at all.

**2 · The two views paint on top of each other.** `.view.leaving` is
`position:absolute; top:0`, so the outgoing view sits exactly over the
incoming one. Outgoing cards fade over 220ms with up to 90ms of stagger,
finishing at 310ms; incoming cards begin at 140ms. That is ~170ms of genuine
double-painting, and any jank stretches it.

> **Rule: out finishes before in starts.** No overlap between an exit and the
> entrance that replaces it, at either end of the stagger.

## Flawless in build means these are measured, not asserted

- Animate `transform` and `opacity` only. Anything that animates layout —
  height, top, width — is a bug, not a slow path.
- Every moment must hold 60fps on a real phone, not a desktop browser at
  desktop width. Measure it; do not eyeball it.
- No animation may gate a tap: any input finishes what is in flight to its end
  state on the next frame.
- Durations come from the five-step scale in `globals.css`. Reduced motion is
  clamped at the token level, so using the tokens handles it and hardcoding a
  duration breaks it.
- Verify against the real screens with the real data, and show screenshots
  before merging — the founder's own suggested process, and the one that
  worked for the status colours.

---

# Task F — the menu becomes a screen · SPECCED · step 3, with Task A

Split out of Task A because it is an IA change rather than a control. The
hamburger goes; `Settings` becomes a nav destination.

`src/components/menu/Menu.tsx` is currently a drawer rendered over home, with
`menuOpen` state and a `HamburgerIcon` in `HomeScreen`. It moves behind a real
`/settings` route. Everything it carries comes with it — including **Clear
data**, which is destructive and keeps its two-step confirmation exactly as it
is.

Two things to decide rather than discover: `/settings` is the only route with
no period, and every other route carries one, so decide whether it takes
`?period=` for the trip back; and `Menu` today receives `periodCount` and
`brand` as props from a screen that had already loaded them, which a standalone
route has to fetch for itself.
