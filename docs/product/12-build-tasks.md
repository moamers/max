# Build tasks — navigation, recurring, and periods by default

Three tasks raised by the founder, split by how much thinking they need before
anyone writes code. **Task A is ready to delegate. Tasks B and C are specced
here and still need one decision each.**

None of these are design-direction work. The design overhaul (`docs/design/direction/`)
is a separate, unlanded workstream — see the note at the end of Task A.

---

# Task A — floating bottom navigation · READY FOR CODEX

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

> **Branch:** create and push `codex/bottom-nav-pill`. Push the branch to the
> remote and confirm it exists there before you consider the task done. If you
> cannot determine which branch to base on, **ask rather than guess** — do not
> push to `claude/budget-app-spending-insights-i5fnch`, which auto-deploys.
>
> **Task.** Add a floating bottom navigation pill to the Max web app, styled
> like iOS's translucent glass bars (see Instagram's iOS tab bar). It hovers
> above the content rather than sitting in a fixed chrome band.
>
> **Items, left to right:**
> 1. **Home** → `/?period=<selectedPeriodId>`
> 2. **This week** → `/week/<currentWeekNumber>?period=<selectedPeriodId>`
> 3. **Calendar** → `/year?period=<selectedPeriodId>` (the year screen already
>    lists every month and each row already links back to `/?period=N`)
>
> Do not add further items without saying so in your report and justifying each.
>
> **Non-negotiable — the period must travel.** Every link must carry
> `?period=`. A navigation that drops it silently sends the user to a different
> month, which was a real bug (#49) and is guarded by
> `src/lib/__tests__/period-travels-with-the-link.test.ts`. Use the helpers in
> `src/lib/routes.ts` — `periodHome()`, `transactionHome()` — rather than
> building URLs by hand. Extend that guard test to cover the nav.
>
> **"This week" means the current week of the *selected* period**, not today's
> calendar week. If the selected period is a past or future month, it is that
> period's live week, or week 1 when today falls outside it. Get this wrong and
> the control lies.
>
> **The FAB collides with you.** `src/app/week/[weekNumber]/WeekView.tsx` renders
> a FAB at `position: fixed; right: 20; bottom: 20`. Resolve it deliberately —
> either lift the FAB above the pill or fold "add" into the pill — and say which
> you chose and why. Do not let them overlap.
>
> **Clearance.** Screens that scroll need bottom padding so the pill never
> covers the last row. `WeekView` already uses `padding: "8px 20px 108px"` for
> FAB clearance; audit every scrolling screen rather than assuming.
>
> **iOS glass, done properly:**
> - `backdrop-filter: blur(20px) saturate(180%)` **with** the `-webkit-` prefix.
> - A solid fallback via `@supports not (backdrop-filter: blur(1px))` — the bar
>   must stay legible where blur is unsupported, never become transparent.
> - `padding-bottom: env(safe-area-inset-bottom)` so it clears the home
>   indicator. Test on a real iPhone, not just a simulator width.
> - It must work in **both themes** — this app is dark by default and light
>   follows `prefers-color-scheme`. Use the existing CSS custom properties in
>   `src/app/globals.css`; do not introduce literal colours.
>
> **Accessibility:** real `<a>` elements (not divs with handlers), visible focus
> states, `aria-current="page"` on the active item, and a hit target of at least
> 44×44px. It must be fully operable by keyboard.
>
> **Constraints from `AGENTS.md` that apply here:**
> - No new dependencies.
> - This is navigation only. **It must not write to the database.**
> - Use the existing primitives in `src/components/ui/`; extend one rather than
>   building a parallel version.
> - Read `node_modules/next/dist/docs/` before writing App Router code — this
>   is Next.js 16 and `proxy.ts` replaces `middleware.ts`.
>
> **The four gates must all be clean:** `npx tsc --noEmit`, `npm run lint`,
> `npx vitest run`, `npm run build`.
>
> **Report:** what you built, anything you deviated from and why, any file
> outside your task's ownership you touched, and anything you are not confident
> is correct. Say explicitly how you resolved the FAB collision and how you
> verified the safe-area inset.

---

# Task B — recurring carry across months · SPECCED, ONE DECISION OPEN

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

# Task C — periods created by default · SPECCED, ONE REAL DECISION

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
