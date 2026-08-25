# Max — contributor guide

*For someone joining this build cold — a person or an agent. Start here, then
read [`AGENTS.md`](../../AGENTS.md) for the rules that apply to every change.*

---

## 1 · What this is, in one minute

Max is a personal finance app for the **financially avoidant** — people who
aren't bad with money but avoid looking at it, because every budgeting app makes
looking feel like being marked. The founder is building it for a real household
(his own) and the bar for V1 is blunt:

> **He stops opening his spreadsheet and uses Max instead.**

That bar drives everything. Insight and comparison are deliberately *later*
(V2) — because insight on partial data is a failure mode this project has
already hit, and the data stays partial until Max is where he actually records.
So V1 is **parity plus capture**: read his sheet, let him record in the app,
give him targets, and let him export back out.

**Read in this order:**

| | |
|---|---|
| 1 | [`docs/product/01-product-vision.md`](./01-product-vision.md) — who it's for and why |
| 2 | [`docs/design/handoff/README.md`](../design/handoff/README.md) — **the specification.** 12 screens, both themes, final copy |
| 3 | [`docs/product/07-v1-delivery-plan.md`](./07-v1-delivery-plan.md) — the data model and the pinned route map |
| 4 | [`docs/00-open-decisions.md`](../00-open-decisions.md) — every unresolved thing, including two parser defects worth understanding |
| 5 | [`docs/principles/`](../principles/) — the doctrines. Skim; consult when a choice feels arbitrary |

**Don't read** the two `.dc.html` prototypes whole (~117KB each). `grep` them
for exact values the README doesn't give.

---

## 2 · Where the build actually is

| Area | State |
|---|---|
| Accounts, sessions, per-user isolation | ✅ Done, verified against production |
| Design system, both themes, `/styleguide` | ✅ Done |
| Data model (`transactions`, `goals`, `income_months`) | ✅ Done, migrations applied |
| Parser (spreadsheet → data) | ✅ Works on real data, after two defect fixes |
| **02** Home · **09** Month picker · **10** Menu | ✅ Built |
| **03** Week · **04** Transaction · **08** Add | ✅ Built |
| **01** Import | ❌ Not built |
| **05** Recurring · **06** One-offs | ❌ Not built |
| **11** Goals · **12** Income by month | ❌ Not built |
| **07** Year round-up | ❌ Not built (last, cuttable) |
| Export back to the spreadsheet template | ❌ Not built |

### Architecture in ten lines

```
src/lib/parser.ts          .xlsx → ParsedPeriod        (pure, heavily tested)
src/lib/workbook-mapping.ts structure detection        (emits a plan; code applies it)
src/lib/transactions.ts    the kind/category vocabulary (single source of truth)
src/lib/schema.ts          Drizzle tables
src/lib/store.ts           all reads/writes, UserId-scoped
src/lib/queries/           aggregates the screens render
src/lib/auth.ts            scrypt hashing, branded UserId
src/lib/session.ts         requireUser() — the auth boundary
src/components/ui/         design primitives (incl. Bar — the one chart grammar)
src/app/                   routes; each screen is a route (see §3a of the plan)
```

**The data model in one breath.** A `period` is a pay period (e.g. "Jun 30th –
Aug 3rd"), not a calendar month. It owns `transactions`, each with a `kind`
(`weekly` | `recurring` | `one_off`), a `category` (weekly: everyday/weekend/
transport; recurring: housing/childcare/bills/subscriptions; one-off: none), a
free-text `label`, and a `pending` flag. `goals` hold weekly per-category
targets; `income_months` hold per-period income overrides.

---

## 3 · Traps that have already bitten

Read these before writing code. Each cost real time or real wrong numbers.

1. **The parser has misread real data twice.** `F-1`: every worksheet treated as
   its own pay period, so one file became six. `F-3`: rows read end-to-end
   across column boundaries, so a summary panel on the right of the sheet
   contaminated the line items on the left — income came out as £2,285, which
   was actually the *rent*, and the bills list was cut off sixteen rows early.
   Both were found by making a figure openable, not by reading code.
   **Lesson: silent judgement about someone's money is the expensive bug here.**

2. **A sheet round-trip loses the recurring group** (`G-4`). Four recurring
   categories collapse into the template's single bills block. The mapping is
   one-to-one forward, four-to-one back. Export must not claim a lossless
   round-trip.

3. **The month picker assumes calendar months; the data holds pay periods**
   (`A-6`). A period starts in one month and ends in another.

4. **The design is a 393×852 phone frame.** Its sheets and scrim assume a
   positioned ancestor of exactly that size. `HomeScreen` works around this with
   `position: fixed; inset: 0` and an internal scroll region.

5. **`/dashboard` is the *old* pre-design page** and still exists because it
   holds the only working delete control. The designed home is `/`. Don't
   develop against `/dashboard`.

---

## 4 · The work queue

Each brief is self-contained. Do them roughly in order — 4.1 unblocks the most.

### 4.1 · Goals (11) and Income by month (12) — **start here**
**Why first:** every bar in the app needs a target, and no targets exist. Until
this ships, Home looks emptier than the design and the weeks section can't be
judged.

- **Spec:** handoff README screens 11 and 12. Screen 11 is deliberately
  *numbers only, no charts*.
- **Routes:** `/goals`, `/income` (pinned — Home already links to them).
- **Backend already exists:** `listGoals`, `setGoal`, `getDefaultMonthlyIncome`,
  `setDefaultMonthlyIncome`, `setIncomeForPeriod` in `src/lib/store.ts`, and
  `incomeForPeriod` in `src/lib/queries/`. Don't write SQL.
- **Own:** `src/app/goals/**`, `src/app/income/**`, `src/components/goals/**`.
- **Note:** `incomeForPeriod` returns a `source` field saying which tier the
  figure came from (explicit override → what the import read → user default).
  Surface that; don't flatten it.
- **Done:** four gates green; setting a goal changes the bars on Home.

### 4.2 · Recurring (05) and One-offs (06)
- **Spec:** handoff README screens 05 and 06. Neither has budget bars — there
  are no targets for them, and inventing one would break the chart grammar.
  Screen 05 uses a *proportional share* bar in a grey ramp, which is a different
  thing; read that section carefully.
- **Routes:** `/recurring`, `/one-offs`.
- **Backend exists:** `recurringForPeriod`, `oneOffsForPeriod`.
- **Own:** `src/app/recurring/**`, `src/app/one-offs/**`, `src/components/money/**`.

### 4.3 · Import (01)
- **Spec:** handoff README screen 01, three states (invite → reading → result).
- **Route:** `/import`. **Backend exists:** `POST /api/upload`, `parseWorkbook`.
- The prototype fakes progress on timers — replace with real parse progress.
- The "lines I couldn't place" step is the important one: it is where the
  parser's uncertainty becomes visible instead of being guessed at.
- **Also finish here:** populate `periods.start_date` / `end_date` on import.
  They are still null, so date logic falls back to parsing the label.

### 4.4 · Export to the spreadsheet template — **highest risk, most valuable**
- No design exists; this is the founder's escape hatch and his honesty test.
- **Target shape:** regenerate his monthly workbook — a `Month summary` tab
  (bills + extras + income panel) plus one tab per week (grocery / weekend /
  transport). `src/lib/parser.ts` documents the layout it reads, including the
  two-block column structure that caused `F-3`.
- **Acceptance test:** *parse → export → parse again yields identical data.*
  Treat that as the deliverable, not a nice-to-have.
- Must state the `G-4` limitation rather than implying a lossless round-trip.
- **Own:** `src/lib/export/**`, `src/app/api/export/**`.

### 4.5 · Year round-up (07)
Last, and cuttable. Parity with the spreadsheet's Aggregates tab, but it needs a
year of data to say anything.

### 4.6 · Loose ends worth picking up
- **Wire or remove "Clear data"** in the menu. It currently looks destructive
  and does nothing. `R-19` says a user must be able to delete their own records
  without a console. Then `/dashboard` and the dev nav in `layout.tsx` can go.
- **Move `src/app/(home)/lib/period-meta.ts` into `src/lib/queries/`.** Nothing
  in the query layer lists a user's periods; that read was written where it was
  needed rather than where it belongs.
- **Auth hardening** before anyone outside the founder gets the link: no login
  rate limiting yet.
- **Give `Button` an `href` mode.** `EmptyState` hand-styles a lime pill because
  a `<button>` inside an `<a>` is invalid HTML.

---

## 5 · How work comes back

The founder delegates a brief, then asks a reviewing agent to check it. Expect
review against:

1. **The four gates**, run fresh — not taken on trust.
2. **Scope**: files touched outside the brief's ownership.
3. **The non-negotiables** in `AGENTS.md` — especially `UserId` scoping, bar
   grammar, labels verbatim, tone gate.
4. **Honesty of the report.** Overstated confidence is treated as a defect. If
   something is untested against real data, say so — "I could not run this
   migration against the live database" is a *good* line in a report.
5. **Numbers against the founder's own sheet.** It states its own totals; they
   are the check. Bills £3,745.33 and outgoings £9,667.11 for the sample period.

Anything unresolved goes into [`docs/00-open-decisions.md`](../00-open-decisions.md)
with an owner, a trigger and a consequence — not into a chat log.
