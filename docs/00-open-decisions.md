# Max — Open Decisions, Actions & Watch Items

*The single register for everything unresolved. If a concern is raised in conversation and matters, it belongs here — not in a chat log.*

**Convention.** Every item has an owner, a trigger (when it must be resolved by), and a consequence (what breaks if it isn't). Items move to [Resolved](#resolved) with a date and the decision, never deleted.

> ✅ **`F-1` / `F-2` fixed** (2026-08-14) — see [Resolved](#resolved). The mis-parsed rows from the original upload are still in the database and need replacing with a fresh upload.
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
| 2026-08-14 | **Transactions clarified as constituents, not irrelevant** — the week is the atom, transactions are the particles. Detail is never required to supply, never wasted when supplied. Merchant identity is load-bearing for the savvy pillar ([D-9](./architecture/01-data-model.md)); user labels are their vocabulary and must not be normalised ([D-10](./architecture/01-data-model.md)). |
