# Delegating Max work to an outside agent

*A ready-to-paste prompt, and which tasks can safely run at the same time.*

---

## 1 · What can run in parallel

Parallel work is safe when two agents never write the same file. The table below
groups tasks by that rule, not by how big they are.

| Batch | Task | Owns (writes) | Reads only |
|---|---|---|---|
| **1** | **A · Goals (11) + Income (12)** | `src/app/goals/**`, `src/app/income/**`, `src/components/goals/**` | `store.ts`, `queries/` |
| **1** | **B · Recurring (05) + One-offs (06)** | `src/app/recurring/**`, `src/app/one-offs/**`, `src/components/money/**` | `store.ts`, `queries/` |
| **1** | **C · Export to spreadsheet** | `src/lib/export/**`, `src/app/api/export/**` | `parser.ts`, `store.ts`, `queries/` |
| **2** | **D · Import (01)** | `src/app/import/**`, `src/components/import/**`, **`src/lib/store.ts`**, `src/lib/parser.ts` | — |
| **2** | **E · Year round-up (07)** | `src/app/year/**`, `src/components/year/**`, `src/lib/queries/year.ts` + `index.ts` | `store.ts` |
| **3** | **F · Loose ends** | `src/components/menu/**`, `src/components/ui/Button.tsx`, `src/app/layout.tsx`, `src/lib/store.ts`, `src/lib/queries/` | — |

**Three at once in batch 1.** A, B and C write into completely separate
directories and only *read* the shared data layer, so they cannot collide.

**Why D and E wait.** Import has to start populating `periods.start_date` /
`end_date`, which means editing `src/lib/store.ts` — a file batch 1 reads. Let
batch 1 land first so nobody rebases onto a moving data layer. D and E are safe
together because Import owns `store.ts` and Year owns `queries/`.

**Why F is alone.** It touches `Button`, `layout.tsx` and `store.ts` — files
everything else depends on. Cheap, but it will conflict with anything running.

### Reasoning effort per task

Raise effort where a wrong answer is **expensive and hard to spot**; lower it
where the spec is precise and the output is visibly right or wrong. Labels vary
by product — map these onto whatever scale yours offers.

| Task | Effort | Why |
|---|---|---|
| **A** Goals + Income | Medium | Precisely specified, backend exists, mistakes are visible on screen. The only judgement is surfacing which tier an income figure came from. |
| **B** Recurring + One-offs | Medium | Same, with one trap: screen 05's share bar is *not* the budget bar. If effort is cheap, go High — that distinction is easy to miss and looks fine when wrong. |
| **C** Export | **High / max** | No design to follow, round-trip correctness, real money, and a parser with a history of confident wrong answers. |
| **D** Import | **High** | The "lines I couldn't place" step is real interaction design, and it edits `store.ts` and `parser.ts`. |
| **E** Year round-up | Medium | Well specified; the empty-state judgement is the only soft part. |
| **F** Loose ends | Medium, **High** for the delete | Mostly mechanical, but step 1 writes a destructive mutation against real financial data. |

> **Consider keeping C (Export) in-house.** It has no design to follow, its
> acceptance test is *parse → export → parse again yields identical data*, and
> this parser has produced wrong numbers on real data twice. It is the task
> where a confident-but-wrong result is hardest to spot.

---

## 2 · The prompt

Paste the block below, then append **one** task brief from §3.

````
You are contributing to Max, a personal finance web app. Repo:
https://github.com/moamers/max

## Branching — read carefully
`main` is 27 commits STALE. Do not branch from it and do not target it.
Branch from `claude/budget-app-spending-insights-i5fnch`, which is the real
trunk:

    git fetch origin
    git checkout -b codex/<short-task-name> origin/claude/budget-app-spending-insights-i5fnch

Commit your work, push your branch, and tell me the exact branch name when you
are done. Do not open a pull request.

## Read these first, in this order
1. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/AGENTS.md
   — the rules every change must follow. Non-negotiable.
2. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/product/08-contributor-guide.md
   — what is built, what is next, and five traps that have already cost real
   time. Section 3 is the one that saves you.
3. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/design/handoff/README.md
   — the design specification. Copy in it is final; use it verbatim.
4. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/product/07-v1-delivery-plan.md
   — the data model (§2) and the pinned route map (§3a). Match the routes
   exactly; other screens already link to them.
5. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/00-open-decisions.md
   — every unresolved question and two real parser defects worth understanding.

Doctrines live in
https://github.com/moamers/max/tree/claude/budget-app-spending-insights-i5fnch/docs/principles
— skim, and consult when a choice feels arbitrary.

## Context rules — these matter
- **Do NOT open the two `.dc.html` files whole.** They are ~117KB each and will
  consume your context before you write a line. `grep` them for a specific
  value the design README doesn't give. `support.js` is prototype runtime, not
  design — ignore it entirely.
- This is **Next.js 16** and it differs from your training data. Read the
  relevant guide in `node_modules/next/dist/docs/` before writing App Router,
  font, form or Server Action code. `proxy.ts` replaces `middleware.ts`.
- Use the existing primitives in `src/components/ui/`. Do not build parallel
  versions. `Bar` already implements the chart grammar — never compute a bar's
  width or colour yourself.
- Every exported function in `src/lib/store.ts` takes a branded `UserId` first.
  Never add an unscoped variant.
- Do not apply database migrations. Write `.sql` into `drizzle/` with the next
  ordinal number and say so in your report.
- No new npm dependencies without justifying it explicitly.

## Definition of done
All four must be clean before you push:

    npx tsc --noEmit
    npm run lint
    npx vitest run
    npm run build

Add tests for anything with real logic.

## Stay in your lane
Only write the files your task lists as owned. If you need a change elsewhere,
put it in your report instead of making it — other agents are working in
parallel in this repo, branched from the same commit, and none of you can see
each other's work.

In particular: there is a money and date formatting helper at
`src/components/home/format.ts` (formatGBP, formatSignedGBP, moneyState,
moneyToneColor and others). Read it and import from it if useful, but do NOT
move, rename or refactor it — another agent depends on its current location. If
it is missing something you need, add a local helper in your own directory and
say so in your report. The same goes for anything else already shared: use it
where it is, or work beside it. Do not promote, relocate or "tidy" a file that
is not yours.

## Report back
Short and blunt: the branch name, what you built, what you deviated from and
why, any file outside your ownership you touched, and — most importantly —
anything you are NOT confident is correct. An overstated report is treated as a
defect; this code handles someone's real money. "I could not verify X against
real data" is a good line in a report, not a gap.

## Your task
[paste one brief from below]
````

---

## 3 · Task briefs

### A · Goals (11) and Income by month (12)
```
Build screens 11 (Budget goals) and 12 (Income by month) from the design README.

Routes: /goals and /income — already linked from Home, so match exactly.
Own: src/app/goals/**, src/app/income/**, src/components/goals/**

The backend already exists — do not write SQL. Use listGoals, setGoal,
getDefaultMonthlyIncome, setDefaultMonthlyIncome, setIncomeForPeriod from
src/lib/store.ts, and incomeForPeriod from src/lib/queries/.

Screen 11 is deliberately numbers only — no charts. Its weekly total is derived
and never editable.

incomeForPeriod returns a `source` field saying which tier the number came from
(an explicit override, what the import read, or the user's default). Surface
that rather than flattening it — a figure the user cannot trace is one they have
to take on faith.

Why this task matters: no goals exist yet, so every bar in the app currently has
no target and the weeks section on Home cannot be judged. Done means setting a
goal visibly changes the bars on Home.
```

### B · Recurring (05) and One-offs (06)
```
Build screens 05 (Recurring) and 06 (One-offs) from the design README.

Routes: /recurring and /one-offs — already linked from Home, so match exactly.
Own: src/app/recurring/**, src/app/one-offs/**, src/components/money/**

Backend exists: recurringForPeriod and oneOffsForPeriod in src/lib/queries/.

Neither screen has budget bars — there are no targets for recurring or one-off
spend, and inventing one would break the chart grammar. Screen 05 uses a
proportional SHARE bar in a grey ramp, which is a different thing from the
budget bar; read that part of the README carefully.

One-offs leads with what is left of genuinely spare money, and its rows carry
the user's own free-text labels — never normalise, lowercase or remap a label.

Rows on both screens open the transaction editor at /transaction/[id], which
already exists. Link to it; do not import its components.
```

### C · Export to the founder's spreadsheet template
```
Build export: regenerate the user's monthly workbook from their data in Max.

Own: src/lib/export/**, src/app/api/export/**
There is no design for this — it is a download, triggered from the menu.

Target shape (read src/lib/parser.ts, which documents the layout it reads):
a "Month summary" tab holding bills, extras and a right-hand summary panel with
income, plus one tab per week holding that week's grocery / weekend / transport.

The acceptance test IS the deliverable: parse a workbook, export it, parse the
export again, and the data must be identical. Write that as an automated test
using exceljs, which is already a dependency.

Two things you must not paper over:
- A round trip LOSES the recurring group. Four recurring categories collapse
  into the template's single bills block, because that is all the sheet has.
  See G-4 in docs/00-open-decisions.md. Say so; do not imply losslessness.
- The summary tab has two independent column blocks separated by an empty
  column. Reading across that gap is what caused defect F-3, where rent was
  read as salary. Your export must reproduce that layout faithfully.
```

### D · Import (01) — batch 2
```
Build screen 01 (Import), all three states: invite, reading, result.

Route: /import. Own: src/app/import/**, src/components/import/**,
src/lib/store.ts, src/lib/parser.ts

Backend exists: POST /api/upload and parseWorkbook in src/lib/parser.ts.

The prototype fakes progress on timers — replace with real parse progress.

The "lines I couldn't place" step is the most important part of this screen. It
is where the parser's uncertainty becomes visible to the user instead of being
guessed at silently. Silent guesses about someone's money are the expensive bug
in this codebase — read the F-1 and F-3 entries in docs/00-open-decisions.md
before designing that interaction.

Also finish here: populate periods.start_date and periods.end_date on import.
They are still null, so date logic falls back to parsing the label, which infers
a year that may be wrong.
```

### E · Year round-up (07) — batch 2
```
Build screen 07 (Year round-up) from the design README.

Route: /year. Own: src/app/year/**, src/components/year/**,
src/lib/queries/year.ts and its export line in src/lib/queries/index.ts

Three logical groups per the README: net position, where income went (one
stacked 100% share bar plus four tiles), and month by month.

Note the share bar here is a proportional share, not a budget bar — do not use
the budget-bar grammar for it.

This screen is parity with the Aggregates tab of the founder's spreadsheet, but
it needs a year of data to say anything. If there is only one period, show an
honest empty state rather than a chart of one point.
```

### F · Loose ends — batch 3, run alone
```
Own: src/components/menu/**, src/components/ui/Button.tsx, src/app/layout.tsx,
src/lib/store.ts, src/lib/queries/

1. Wire or remove "Clear data" in the menu. It currently looks destructive and
   does nothing. R-19 says a user must be able to delete their own records
   without a console. If you wire it, scope the mutation by UserId and add a
   confirm step.
2. Then delete src/app/dashboard/** and the "Max | Upload | Dashboard |
   Styleguide" nav in layout.tsx. Do this ONLY after step 1 — /dashboard
   currently holds the only working delete control.
3. Move src/app/(home)/lib/period-meta.ts into src/lib/queries/ and update its
   importers. It was written where it was needed rather than where it belongs.
4. Give Button an href mode that renders an anchor, and use it in
   src/components/home/EmptyState.tsx, which hand-styles a lime pill because a
   <button> inside an <a> is invalid HTML.
5. Add rate limiting to POST /api/auth/login.
```
