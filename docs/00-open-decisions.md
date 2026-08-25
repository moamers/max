# Max — Open Decisions, Actions & Watch Items

*The single register for everything unresolved. If a concern is raised in conversation and matters, it belongs here — not in a chat log.*

**Convention.** Every item has an owner, a trigger (when it must be resolved by), and a consequence (what breaks if it isn't). Items move to [Resolved](#resolved) with a date and the decision, never deleted.

> ✅ **`F-1` / `F-2` fixed** (2026-08-14) and **`F-3` fixed** (2026-08-17) — see [Resolved](#resolved). The mis-parsed rows from the original upload are still in the database and need replacing with a fresh upload ([`G-2`](#follow-ups-from-f-3)).
> 🔑 **Needs the founder:** [`C-2`](#c--housekeeping) — rotate the Supabase password and Expo token, both exposed in a chat transcript.

---

## A · Decisions only the founder can make

These need a human point of view, not more research. None are urgent today; all get expensive if left until the triggering moment arrives.

| # | Decision | Trigger | Consequence of deciding late |
|---|---|---|---|
| **A-1** | **Household or individual?** Shared context (a child's birthday, a family holiday, a joint envelope) is either modelled at household level or duplicated per person. | **Before the memory layer ships (V2).** | Migrating accumulated memory into a different ownership shape is painful and touches every record. |
| **A-2** | **Is manual/file capture a permanent tier or a bridge to bank connection?** | Before V4 (bank connections). | Determines whether ingestion is a first-class product surface deserving real investment, or scaffolding. Competitive research says it's the strongest wedge against three Open-Banking-gated rivals — leaning permanent. |
| **A-3** | **Monetisation direction:** subscription, embed/acquire, or something else. Not the price — the shape. | Before V3 build starts. | Shapes which V2/V3 features are worth building. Mint and Money Dashboard both died of this, with loyal users. Note `R-4`/`R-5` close off the third industry-standard path (attached credit/referral revenue) by choice. |
| **A-4** | **What does "done" look like for V1?** Currently: one real person outside the founder's head uses it twice, unprompted. | Now-ish. | Without a stated bar, V1 expands indefinitely. |
| **A-5** | **Is V1's setup burden acceptable for a second user?** V1 asks for weekly per-category targets and monthly income. For the founder this is parity — his spreadsheet already holds them. For anyone else it is an onboarding form, which is the thing the Product Vision argues hardest against. Options: import them from the uploaded sheet (it already states its own budgets), infer them from history, or accept the form for V1 and fix it in V2. | Before a second person is given the app. | The "near-zero mental load" promise is the product. A setup form is the most likely way to break it without noticing, because the founder will never feel it. |
| **A-6** | **Does a month picker make sense when a "month" is a pay period?** Screen 09 draws a Jan–Dec grid; the real data is arbitrary labelled periods like "Jun 30th – Aug 3rd", which start in one calendar month and end in another. Current behaviour buckets a period by the month its start date falls in. | Before a second period lands in the same calendar month, or a user's pay cycle stops tracking months. | The picker silently hides or mis-files a period. It is the navigation control for the whole app, so a wrong answer is invisible until data goes missing from view. |
| **A-7** | **The design says "Overspent"; the tone gate bans it.** Screen 07 specifies red + "Overspent" for a negative year position. `src/lib/tone.ts` rejects the word, and `AGENTS.md` claimed the design's copy already passed the gate — it does not. Current behaviour follows the gate: the number is red and factual, with no verdict word. | Now — it is a live disagreement between two documents both described as final. | Recommendation: **keep the gate.** "Overspent" is precisely the judgement-laden vocabulary this product exists to avoid; a single word carrying a verdict is how a tool starts feeling like being marked. If the design is right and the gate is too blunt here, the gate needs a documented exception rather than a quiet override. |
| **A-8** | **Nothing in Max can create a period except an import.** Periods only exist because a spreadsheet was uploaded. The moment the founder stops keeping the sheet — which is the entire V1 bar — there is no way for next month to begin. Related: he aligns periods loosely to a card cycle ending the 8th, deliberately imprecise, 4–5 weeks with a few days' slack. | **Before V1 can actually be used for a second period.** This is a hole in "replaces my spreadsheet", not a nice-to-have. | Max becomes a viewer for spreadsheets he has stopped making. Options: roll a new period automatically from the observed cycle, offer it and let him confirm, or ask once at setup. Inferring from the periods already imported is preferred over asking — the start dates cluster, and a question at setup is the labelling tax the vision argues against ([`A-5`](#a--decisions-only-the-founder-can-make)). |
---

## B · Blocking checks

Small pieces of work that gate a feature. Cheap now, expensive as surprises.

| # | Check | Blocks | Effort |
|---|---|---|---|
| **B-1** | **Open the ONS Family Spending workbooks and enumerate which cross-tabs actually exist** (region × composition × income). | The entire peer-comparison feature. | ~1 hour |
| **B-2** | Confirm whether Family Spending is exposed on the ONS beta API or is publication-attached XLSX only. | Ingestion design for benchmarks. | ~15 min |
| **B-3** | Price the AISP agency route with at least two aggregators (TrueLayer, Yapily, Plaid, Tink). Public sources don't publish figures. | V4 planning and any funding conversation. | A few emails |

> **B-1 is the most consequential unknown in the product.** ONS publishes region and household composition as *separate* dimensions. If the cross-tab doesn't exist — and it probably doesn't — the flagship claim has to be phrased as two composed statements rather than one ([T-5](./principles/03-technical-principles.md)). Better to know before building the feature than after.

---

## C · Housekeeping

| # | Item | Owner | Status |
|---|---|---|---|
| **C-1** | Delete the synthetic test periods from the live database. | Agent | ✅ Done 2026-08-13 (ids 5, 6). Real data from `Jun 30th - Aug 3rd.xlsx` retained. |
| **C-2** | Rotate the Supabase database password and the Expo access token — both were shared in a chat transcript. | Founder | Open |
| **C-3** | Automated doctrine checks ([T-12](./principles/03-technical-principles.md)). | Agent | 🟡 Partial — 21 tests cover B-23, B-20, B-8, B-24 and F-1 regression. Still to do once the relevant features exist: B-6 one-question, R-16 Article 9 filter, B-25 suppression list, T-9 shared-core imports. |

---

## D · Professional review triggers

**Nothing here needs a lawyer today.** These are trigger points, not a backlog. Each names the event that starts the clock.

| # | Review | Triggered by | Why |
|---|---|---|---|
| **D-1** | **Privacy specialist + DPIA** | Before the memory layer ships (V2) | The Article 9 special-category inference problem ([R-16](./principles/02-ethics-and-red-lines.md)) is the single largest legal exposure in the design. Large-scale financial data + profiling + AI + vulnerability signals makes a DPIA effectively mandatory. |
| **D-2** | **Compliance review of user-facing copy** | Before any output that pairs the user's personal circumstances with a course of action on money | The FCA's advice/guidance boundary is a set of analogies, not a bright line. Borderline copy needs a human read. |
| **D-3** | **Financial promotions review** | Before signing *any* affiliate or referral arrangement | Currently prohibited by [R-5](./principles/02-ethics-and-red-lines.md), so this trigger should never fire. If the red line is ever revisited, this review is a precondition, not a follow-up. |
| **D-4** | **Data licensing check with UK Data Service** | Only if survey *microdata* is used (published ONS workbooks are OGL v3.0 and fine as-is) | EUL/Secure Access microdata terms likely restrict commercial use. |
| **D-5** | **AISP agency contract review** | Before signing with an aggregator | The principal will push Consumer Duty and vulnerability obligations down contractually. Worth knowing what's being accepted. |

---

## E · Regulatory & competitive watch

Things that could change underneath us. Reviewed periodically, not acted on now.

| # | Watch item | Why it matters |
|---|---|---|
| **E-1** | **FCA targeted support regime** (COBS 9B, live 6 April 2026). Currently scoped to **pensions and investments only** — Max sits outside it. | If scope broadens toward cash/budgeting guidance, Max's position changes materially. |
| **E-2** | **FCA consultation on simplifying advice rules** (signalled for 2026). | Could move the boundary Max is deliberately staying clear of. |
| **E-3** | **ICO guidance on agentic AI.** Early thinking published Jan 2026 (explicitly not formal guidance); flags opaque multi-agent data flows as the core risk. | Formal guidance would likely bear directly on the memory layer. |
| **E-4** | **Cleo's UK monetisation.** Relaunched 5 Feb 2026, waitlisted, currently selling nothing in the UK. | The clearest measurable signal that the timing window is closing. |
| **E-5** | **ChatGPT Finances / Lloyds assistant rollout.** | Platform-level commoditisation risk — the Jasper failure mode. |

---

## 🔴 F · Live defects

| # | Defect | Impact |
|---|---|---|
| **F-1** | **The parser treats every worksheet as a separate pay period.** The real file (`Jun 30th - Aug 3rd.xlsx`) is **one pay period per file**, with a `Month summary` tab (bills + extras) plus one tab per week (`Week 1`…`Week 5`, each holding grocery/transport/weekend). The parser produced **six periods from one**. | **Critical — the dashboard output is meaningless on real data.** Income (£2,285) attaches only to the summary tab, so all five week-tabs show £0 income and a negative net position. Self-benchmarking compares weeks against a month summary. |
| **F-2** | `week_number` is always `1` on weekly tabs. It's derived from counting repeated section headers *within* a sheet; a per-week tab has only one `Grocery` block, so every week is week 1. | Weekly rhythm and leak detection (the core diagnostic in [D-1](./architecture/01-data-model.md)) cannot work. |
| **F-3** ✅ | **The parser read rows end-to-end, ignoring column boundaries.** The summary tab has two independent blocks side by side — line items on the left (description, note, amount, tag), a running summary panel on the right (budgets, totals, salary) — separated by an empty column. Reading across the gap let the panel contaminate the item block. Fixed 2026-08-17; see [Resolved](#resolved). | **Critical.** Three wrong figures on the founder's own file: income read as £2,285 (that's the *rent* — "Salary GBP 6,647.94" sits in the panel on the same row, and the first number left-to-right won); bills read as £416 across 5 rows instead of £3,745.33 across 21 (a panel "GBP budgetted" tripped the end-of-block rule); and panel text became line-item tags ("GBP left", "All transport"). |

**What is NOT broken — verified against real data:** label-anchored line-item parsing works well. Descriptions, notes (including split amounts like `"12.99 + 34.29 + 16.5"`), values and free-text tags all came through correctly. The `fam-uk` tag spanning a family visit is exactly the exception-marker pattern [D-3](./architecture/01-data-model.md) describes — the data model's central bet is validated by the founder's own real file.

**Required fix.** The model needs the two-level hierarchy the real spreadsheet already uses:

```
FILE  = one pay period          (e.g. Jun 30th – Aug 3rd)
  ├── Month summary tab         → period-level bills + extras + income
  └── Week N tab  × 5           → that week's grocery / weekend / transport
```

Today's schema is flat (one `periods` row, with `week_number` on line items), which *can* express this — the parser simply has to map a **workbook** to one period and **tabs** to weeks, rather than mapping each tab to its own period. Tab-name parsing (`Week (\d+)`, `Month summary`) is the obvious route, with a fallback for files that don't follow the convention.

> **This outranks everything in the V0 plan.** It is the first contact between the product and real data, and the product got it wrong. Fix before any narrative-sentence work — the sentences would otherwise describe a fiction.

---

## Follow-ups from `F-3`

| # | Item | Why it matters |
|---|---|---|
| **G-1** | **Ingest has no year.** Period labels are day-and-month only ("Jun 30th - Aug 3rd"). The year was briefly inferred from the upload date and was wrong on the very first real file — a 2025 workbook uploaded in 2026. The dashboard now shows no year at all. The Drive folder structure (year folders) is the obvious source. | Cross-year comparison ("last August vs this August") is impossible until periods carry a year. |
| **G-2** | **Re-upload the real file.** The database still holds the `F-3` figures: income £2,285 (actually rent), bills £416 across 5 rows (actually £3,745.33 across 21). | Every number on the live dashboard is wrong until the file is parsed again. |
| **G-3** | **Budget rows are captured but unused.** The sheet states its own budgets ("GBP 100 budgeted", "GBP 260 budgeted p.w.") and its own totals. Those are the user's stated intent and a free correctness check on the parser. | A parser that can compare its arithmetic to the sheet's own totals catches its next `F-3` itself, rather than waiting for someone to read a dashboard and squint. |
| **G-4** | **A sheet round-trip loses the recurring group.** The V1 model splits recurring spend into Housing / Childcare / Bills / Subscriptions; the founder's template keeps one flat bills list. Re-file rent under Housing, export, re-import, and it returns as `bills`. The mapping is one-to-one forward and four-to-one back — total, but lossy. | Export is the escape hatch and the honesty test. It must not present a round-trip as lossless when it isn't. Options: accept and say so in the export UI, add a column to the template, or carry the group in the label. Pinned by a test so it can't be discovered by accident later. |
---

## Resolved

| Date | Decision |
|---|---|
| 2026-08 | **Frontend: responsive web first, React Native later.** Expo/Expo Go proved too fragile to iterate on (SDK version lag, tunnel/proxy failures). `mobile/` is parked, not deleted; [T-9](./principles/03-technical-principles.md) keeps it cheap to revive. |
| 2026-08 | **Database: Postgres on Supabase**, over Turso and plain Postgres, for the bundled auth and row-level security that will be needed once bank data is involved. |
| 2026-08 | **Backend hosting: Railway.** Persistent process, so no serverless connection-pooling constraints. |
| 2026-08 | **No credit, no referral revenue** ([R-4](./principles/02-ethics-and-red-lines.md), [R-5](./principles/02-ethics-and-red-lines.md)) — closes the industry-standard monetisation path by choice, which is why A-3 matters. |
| 2026-08 | **"Coaching without them knowing" split:** unobtrusive retained ([B-5](./principles/01-agent-behaviour.md)), covert rejected ([R-9](./principles/02-ethics-and-red-lines.md)). Transparent nudges perform no worse, so concealment buys nothing. |
| 2026-08-14 | **`F-1` / `F-2` fixed** via a workbook mapping layer (`src/lib/workbook-mapping.ts`) rather than a hardcoded rule for one layout. Structure detection emits an inspectable plan; deterministic code applies it. Verified: one period instead of six, week numbers 1–5 instead of all 1, weekly totals matching the real file exactly. Legacy sheet-per-period files still parse via the fallback strategy. |
| 2026-08-14 | **`T-2` amended to "LLM as compiler, not interpreter."** The model may judge structure and meaning; it must not compute a figure it then states, and structural judgement must be emitted as a reusable plan rather than re-derived per read. Rationale is the asymmetry between recoverable structural errors and silent arithmetic ones, plus reproducibility and testability. |
| 2026-08-14 | **V0 iteration 1 shipped** — narrative-first dashboard, deterministic sentence generation (`src/lib/narrative.ts`), code-enforced tone gate (`src/lib/tone.ts`), delete-your-data control (R-19), and the first 21 automated doctrine tests. Notable outcome: on real data the naive headline would have been a ~£4,000 deficit; the doctrine turned that into a question about whether recorded income is complete, which is both safer and more likely correct. |
| 2026-08-17 | **`F-3` fixed — the parser now respects column boundaries.** The item block's right edge is derived from the sheet (the first column that is empty top to bottom, searched from the first column holding a number) rather than hardcoded, so a sheet with no gap keeps its full width and legacy single-block sheets don't regress. Income is read from the figure *adjacent* to its label and summed across labelled money-in rows, with the components stored so the total stays traceable. Verified against a faithful reconstruction of the real summary tab: bills £3,745.33 and outgoings £9,667.11, both matching the figures the sheet states for itself, and income £9,547.94 reproducing the sheet's own "−£119.17 left". |
| 2026-08-17 | **The dashboard shows no year.** Inferring it from the upload date was wrong on the first real file (a 2025 workbook uploaded in 2026). A day and month the user can check beats a year the app guessed; the year returns when ingest carries one ([G-1](#follow-ups-from-f-3)). |
| 2026-08-17 | **Percentage-of-income framing dropped in favour of amounts.** The tiles showed 148.8% and −177.4% — percentages of a number that turned out to be the rent. Amounts are legible without a denominator, and a percentage of the wrong number is worse than no percentage. |
| 2026-08-14 | **Transactions clarified as constituents, not irrelevant** — the week is the atom, transactions are the particles. Detail is never required to supply, never wasted when supplied. Merchant identity is load-bearing for the savvy pillar ([D-9](./architecture/01-data-model.md)); user labels are their vocabulary and must not be normalised ([D-10](./architecture/01-data-model.md)). |
