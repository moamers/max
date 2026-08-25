# Delegating Max work to an outside agent

*The prompt to paste, the briefs to paste after it, and which can run together.*

---

## 1 · What is left

**Two tasks remain and they run in parallel. Paste the prompt in §2, then ONE
brief from §3.**

| Task | Effort | Runs with | Owns (writes) |
|---|---|---|---|
| **D · Import + period rollover** | High | C | `app/import`, `components/import`, `app/review`, **`src/lib/store.ts`**, **`src/lib/parser.ts`**, `src/lib/periods.ts`, `drizzle/` |
| **C · Export + year CSV** | High / max | D | `src/lib/export/**`, `src/app/api/export/**` |
| F · Loose ends | Medium | *nothing* | `components/menu`, `ui/Button.tsx`, `app/layout.tsx`, **`src/lib/store.ts`** |

**D and C are safe together.** They never write the same file. But they share a
seam git cannot police: export's round-trip test is written against
`parseWorkbook`'s output, and import owns that file. Both briefs carry the rule —
import may *add* to that output's shape but never rename, remove or restructure
it; export reads the parser and never modifies it.

**F waits until both are merged.** It writes `store.ts` (which D owns), plus
`Button` and `layout.tsx` which everything depends on, and it deletes
`/dashboard`, which is only safe once its delete control has a replacement.

### Already delivered
A · Goals + Income · B · Recurring + One-offs · E · Year round-up ·
G · Empty states + period consolidation. Their briefs are in git history if
needed.

---

## 2 · The prompt

Paste the block below, then append **one** task brief from §3.

````
You are contributing to Max, a personal finance web app. Repo:
https://github.com/moamers/max

## Branching — read carefully
Branch from **`v1/integration`**. That is the base for all V1 work.

    git fetch origin
    git checkout -b codex/<short-task-name> origin/v1/integration

Commit your work, push your branch, and tell me the exact branch name when you
are done. Do not open a pull request.

**Do not push to any branch other than your own**, and never to
`claude/budget-app-spending-insights-i5fnch` — that branch is wired to
automatic deployment, and pushing to it ships unreviewed code and burns build
credit. `main` is stale; ignore it entirely.

A note on git, because this went wrong once: a branch moving forward to include
your commit is a **fast-forward**, which is normal and loses nothing. Do not
diagnose it as damage and do not propose a force-push to "repair" it. If
something about the repository state looks wrong, describe what you observe and
stop — do not rewrite history.

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

**Run D and C as two separate agent sessions, at the same time.** Each session
gets the prompt from §2 followed by **one** brief from below — D in one, C in
the other.

Never put both briefs into a single session. An agent given two tasks
interleaves them, and the ownership boundary that makes running them together
safe stops meaning anything.

### Task D · Import (screen 01) + period rollover
```
Build screen 01 (Import), its reconciliation model, and automatic period
rollover.

Route: /import. Own: src/app/import/**, src/components/import/**,
src/app/review/**, src/lib/store.ts, src/lib/parser.ts, src/lib/periods.ts (new),
drizzle/<next>.sql

READ FIRST — these two are the specification, not background:
  docs/design/13-import-reconciliation.md
  docs/design/15-attention-and-periods.md
They override the handoff README where they disagree with it.

There is currently NO file-upload UI anywhere in the app. The old one was
replaced by the new Home. Both the menu and the empty state link to /import,
which does not exist, so a new account cannot get data in at all. This task is
what makes the app usable.

1 · THE IMPORT SCREEN — three states per the handoff README screen 01. The
    prototype fakes progress on timers; use real parse progress. Backend exists:
    POST /api/upload and parseWorkbook.

2 · THE THIRD TRANSACTION STATE. Add to transactions:
      needs_attention boolean NOT NULL DEFAULT false
      attention_reason text
      CHECK (NOT (pending AND needs_attention))
    Screen 04's Final|Pending control becomes three-way:
    Final | Pending | Needs a look. Mutually exclusive.
    Colours are in 15-attention-and-periods.md §1. Add them as tokens in
    globals.css alongside the existing amber — you own that addition for this
    task only.

3 · RECONCILIATION. Import never blocks, never discards, never asks a question
    it can answer with a stated assumption. Uncertain rows land with Max's best
    guess and a plain-English reason in attention_reason. 0 assumed → say
    nothing. 1–5 → the handoff's inline cards. 6+ → one line plus a quiet link
    to /review, with Continue still the primary button. /review sweeps them one
    card at a time: Confirm, Change, Skip, and Skip all. A row Max cannot read
    at all still lands, as a one-off, flagged.

4 · PERIOD DATES. Populate periods.start_date and end_date on import. They are
    still null, so date logic falls back to parsing the label.

5 · PERIOD ROLLOVER (src/lib/periods.ts, pure and unit-tested). Weeks run
    Monday to Sunday, always. A period is 4 or 5 whole weeks, starts the Monday
    after the previous ends, and ends on the Sunday nearest the 1st of a month.
    That rule reproduces 11 of the founder's 12 real periods — it is a proposal
    shown with an adjustable end date, never applied silently. When today passes
    the current period's end, the next period becomes the default view.

6 · MONTH MARKERS. On the month picker, a period holding any needs-a-look row
    gets a dot in the needs-a-look colour. Pending rows do NOT get a dot. No
    counts, no badge numbers.

RUNNING IN PARALLEL WITH EXPORT — read this. Another agent is building the
export path against parseWorkbook's output at the same time as you. You own
src/lib/parser.ts, so you can change it; but DO NOT CHANGE THE SHAPE of what
parseWorkbook returns. Adding a field is fine. Renaming, removing or
restructuring one is not, because their round-trip test is written against it
and git will not catch a semantic break. If you believe the shape has to change,
say so in your report and leave it alone.

Do not apply the migration. Write the .sql and say so in your report.
```

### Task C · Export to spreadsheet + year round-up CSV
```
Build export: regenerate the founder's monthly workbook from Max's data, plus a
year round-up CSV.

Own: src/lib/export/**, src/app/api/export/**
Triggered from the menu. There is no design for this.

READ FIRST — this is the specification:
  docs/design/14-export-spec.md
Two REAL templates are committed at docs/design/templates/ (a 4-week and a
5-week period). Open them with exceljs and read their structure. They are the
spec; nothing describes them better than they do.

THE CENTRAL RULE: those templates are formula-driven, not value-driven. Week
totals pull from the week tabs, the summary sums the blocks, the grand total
sums those. So export writes LINE ITEMS AND FORMULAS, never computed totals.
This is doctrine T-2 — the system must not do arithmetic it then states as
fact — and it means the spreadsheet checks Max's numbers rather than
inheriting them.

GENERATE, DO NOT FILL. Do not open a template and write into its cells. Their
formula ranges are fixed and hand-maintained (grocery is C2:C23, so a 30-row
week would silently fall outside its own total) and inconsistent between tabs.
Generate a fresh workbook matching the LAYOUT, sized to the real data, with
formulas written to match the ranges you actually emit.

COLUMN LAYOUT — read 14-export-spec.md carefully here. Line items live in
columns A–D; a summary panel lives in G–H; COLUMN F IS EMPTY TOP TO BOTTOM and
is what separates them. Reading across that gap is what caused defect F-3,
where a rent line was read as salary. Reproduce the gap exactly.

Emit as many week tabs as the period actually has. 4 vs 5 weeks is not two
templates; it is one generator.

THE ACCEPTANCE TEST IS THE DELIVERABLE:
    parse(workbook) → export → parse(export) must equal the original parse
Automated, with exceljs, over the committed templates. Not a nice-to-have.

Also state the G-4 limitation in the export UI: a round trip loses the
recurring group, because the sheet has one flat bills list and Max has four.
Do not imply a lossless round trip.

RUNNING IN PARALLEL WITH IMPORT — read this. Another agent owns
src/lib/parser.ts and src/lib/store.ts and is editing them while you work. They
have been told not to change the shape of parseWorkbook's output, only to add to
it. So: read from the parser, never modify it, and if your round-trip test needs
a change there, put it in your report rather than making it. Do not touch
src/lib/store.ts at all.

YEAR CSV: one row per period. The columns and maths are in 14-export-spec.md
§ "The year round-up export" — they were reverse-engineered from the founder's
own aggregates sheet and verified to the penny across all 12 of his periods.
Reproduce exactly. A period with unknown income leaves its percentage columns
EMPTY, not zero.
```

---

## 4 · After D and C are merged

### Task F · Make it safe to hand over — LAST, run alone
```
Five jobs. All of them are about the app being safe to give to someone else.

Own: src/components/menu/**, src/components/ui/Button.tsx, src/app/layout.tsx,
src/app/dashboard/** (delete), src/lib/store.ts, src/lib/auth.ts,
src/app/api/auth/login/route.ts, src/components/home/EmptyState.tsx

1 · CLEAR DATA — build it. The menu already shows a red "Clear data" row that
    does nothing. It is a test-reset escape hatch: if an import or export goes
    wrong, the founder wipes everything and starts again from a fresh import.
    That is its whole purpose — it is not a GDPR feature and does not need to
    be clever.
      - A new store function scoped by UserId that deletes all of that user's
        periods. transactions, budgets and period_summaries cascade from
        periods, so one delete is enough — verify that in the schema first.
      - Do NOT delete the user account or their goals and income settings. The
        point is to re-import, not to start a new life.
      - A confirmation step that states plainly what will be removed and how
        many periods that is. Typed confirmation is overkill; a two-step
        "Clear data → Yes, clear everything" is right.
      - R-19: the user must be able to delete their own records without a
        console. This is that.

2 · RETIRE THE OLD DASHBOARD. Delete src/app/dashboard/** and the
    "Max | Upload | Dashboard | Styleguide" nav in src/app/layout.tsx. Do this
    only AFTER job 1 — /dashboard currently holds the only working delete
    control. Keep /styleguide, but it does not need a nav link.

3 · LOGIN RATE LIMITING on POST /api/auth/login. Nothing exists. In-memory
    per-IP-and-email throttling is enough for now; say in your report that it
    resets on deploy and does not span instances.

4 · BUTTON href MODE. Give Button an href prop that renders an anchor styled
    identically, and use it in EmptyState.tsx, which hand-styles a lime pill
    because a <button> inside an <a> is invalid HTML.

5 · IMPORT PROGRESS. The bar maps upload bytes to 0-88% then sits still while
    the server parses, because ExcelJS parsing is not streamable. Do not fake
    the remaining 12%. Change the label instead so the pause reads as a stage
    rather than a stall — e.g. "Reading your file…" once the upload completes.

Do not apply any migration you write.
```
