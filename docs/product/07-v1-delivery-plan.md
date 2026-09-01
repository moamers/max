# Max V1 — Delivery Plan

*Companion to the [Roadmap](./04-roadmap.md) and the [design handoff](../design/handoff/README.md). The roadmap says what V1 is and why; this says how it gets built, in what order, and who owns which file.*

**The bar:** the founder stops opening the spreadsheet. Not "understands a sentence" — *records a full pay period in Max instead.*

---

## 1 · What is being built

The twelve screens in the design handoff, plus two things the design doesn't cover because they aren't visual:

| | Why it's in V1 |
|---|---|
| **Accounts and per-user isolation** | The app can't be handed to a friend to test while every row is global. Blocks everything else. |
| **Export to the founder's own spreadsheet template** | The escape hatch, and the honesty test — if Max can't reproduce the sheet it read, it hasn't understood it. It is also the strongest available regression check on the parser, which has now been wrong twice on real data (`F-1`, `F-3`). |

Screen 07 (year round-up) is in scope but sequenced last: it is parity with the Aggregates tab, it needs a year of data to say anything, and it is the first thing to cut if V1 runs long.

---

## 2 · The data model V1 needs

This is the contract every agent builds against. **No agent may change it unilaterally** — raise it instead.

Today's model is period-boxed with five hardcoded `section` values. The design needs calendar months, weeks inside them, three *kinds* of spend, per-category weekly targets, month-by-month income, and a pending flag. The migration below reaches that without throwing away a row.

### Tables

- **`users`** — id, email, password_hash, created_at. Plus `default_monthly_income`.
- **`sessions`** — token, user_id, expires_at.
- **`periods`** — the month container. Gains `user_id NOT NULL`. Already has `start_date` / `end_date`; V1 starts populating them. A "month" here is the founder's pay period (30 Jun – 3 Aug), not a calendar month — the design's "August" is a label over that.
- **`transactions`** — replaces `line_items`, same table renamed and widened:
  - `merchant` (was `description`) · `note` · `amount` · `occurred_on` (new, nullable) · `week_number`
  - `kind` — `weekly` | `recurring` | `one_off` (new)
  - `category` — for `weekly`: `everyday` | `weekend` | `transport`; for `recurring`: `housing` | `childcare` | `bills` | `subscriptions`; null for `one_off`
  - `label` (was `tag`) — **free text, the user's own vocabulary, never normalised** ([D-10](../architecture/01-data-model.md))
  - `pending` boolean (new) · `raw_import` text (new)
- **`goals`** — user_id, category, weekly_amount. Three rows per user in V1.
- **`income_months`** — user_id, period_id (or year+month), amount, `set_by_user` boolean. Absent month ⇒ fall back to the user's default.
- **`budgets`**, **`period_summaries`** — keep, they still hold.

### Migrating the existing rows

The current `section` maps cleanly, and this mapping must be applied in SQL, not by re-uploading:

| old `section` | `kind` | `category` |
|---|---|---|
| `grocery` | `weekly` | `everyday` |
| `weekend` | `weekly` | `weekend` |
| `transport` | `weekly` | `transport` |
| `bills` | `recurring` | *(derive where obvious, else `bills`)* |
| `extras` | `one_off` | *(null)* |

`tag` → `label` verbatim. `description` → `merchant` verbatim.

> **Note on `recurring.category`:** the founder's sheet keeps bills as one flat list; the design splits them into four groups. Deriving Housing/Childcare/Bills/Subscriptions from merchant names is a *judgement*, so it belongs in a mapping the user can see and correct — not silently in a migration ([T-2](../principles/03-technical-principles.md): the model may emit a plan, deterministic code applies it). For V1, default everything to `bills` and let the user re-file from the transaction editor.

---

## 3 · Sequencing

Work is grouped so that no two concurrent agents touch the same file. **Agents do not run git commands and do not apply migrations** — they write migration SQL to `drizzle/`, and the orchestrator applies and commits.

### Wave 1 — foundation (parallel)
| | Owns | Model |
|---|---|---|
| **A · Auth & isolation** | `schema.ts`, `store.ts`, `auth.ts`, `session.ts`, `proxy.ts`, `api/auth/**`, `login/**`, `signup/**` | opus — security-critical |
| **B · Design system** | `globals.css`, `layout.tsx`, `components/**`, `styleguide/**` | sonnet — precise spec, mechanical translation |

### Wave 2 — the model (after A)
| | Owns | Model |
|---|---|---|
| **C · Data & query layer** | `schema.ts`, `store.ts`, `lib/queries/**`, migration SQL | opus — every screen renders what this returns |

### Wave 3 — surfaces (parallel, after B and C)
| | Screens | Model |
|---|---|---|
| **D · Import** | 01 (invite / reading / result) | sonnet |
| **E · Export** | *(new)* round-trip to the founder's template | opus — correctness is the point |
| **F · Home** | 02, 09 month picker, 10 menu | sonnet |
| **G · Week & capture** | 03 week, 04 transaction, 08 add | sonnet |
| **H · Money surfaces** | 05 recurring, 06 one-offs, 11 goals, 12 income | sonnet |
| **I · Year** | 07 | sonnet, last, cuttable |

---

## 3a · Route map — pinned

Home links to all of these. The first two were agreed in advance; the rest were
guessed by the Home agent from the naming pattern and are now **fixed**, so the
agents building those screens must match them rather than choose again.

| Route | Screen |
|---|---|
| `/` | 02 Home |
| `/add` | 08 Add |
| `/week/[weekNumber]` | 03 One week |
| `/transaction/[id]` | 04 One transaction |
| `/import` | 01 Import |
| `/recurring` | 05 Recurring |
| `/one-offs` | 06 One-offs |
| `/goals` | 11 Budget goals |
| `/income` | 12 Income by month |
| `/year` | 07 Year round-up |
| `/start-month` | A month that does not exist yet: the empty-month state, with the control that starts it. No design; added for the founder's "for non created months a user should be allowed to click and see empty month state screen". |

Routes are the seam between agents: nobody imports another's components.

---

## 4 · Standing rules for every agent

1. **Read `CLAUDE.md` first.** This Next.js version differs from training data; read `node_modules/next/dist/docs/` before writing App Router code.
2. **The design handoff README is the spec.** The two `.dc.html` files are ~117KB — grep them for exact values, never read them whole. `support.js` is prototype runtime, not design.
3. **Don't run git. Don't apply migrations.** Leave changes in the working tree; write SQL to `drizzle/`.
4. **Stay inside your owned files.** Anything you need elsewhere goes in your report, not in the file.
5. **Done means:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run build` all clean.
6. **The tone gate applies to every word of user-facing copy** ([`src/lib/tone.ts`](../../src/lib/tone.ts), B-23). The design's copy is final and already complies — if you write new copy, it must pass.
7. **Numbers stay traceable** (B-8). The last two defects were both caught by a figure that could be opened up. Don't ship one that can't.
8. **No new dependencies** without saying so loudly and justifying it.

---

## 5 · Known risks

| Risk | Handling |
|---|---|
| **The `recurring` grouping is a guess.** Merchant-name → group is exactly the kind of judgement that produced `F-3`. | Default to `bills`, make it user-correctable, never infer silently. |
| **Export must round-trip.** If it drops a row or a label, the parser or the model is wrong. | Treat "parse → export → parse again yields identical data" as the acceptance test, not a nice-to-have. |
| **V1's setup burden** (targets, income) is the labelling tax the vision argues against. | Parity for the founder, open question for anyone else — [`A-5`](../00-open-decisions.md). |
| **The live database still holds `F-3`-era figures.** | Re-import after the model migration lands ([`G-2`](../00-open-decisions.md)). |
| **Two agents needing the same file.** | Ownership table above; conflicts get raised, not resolved locally. |
| **The query layer can't list a user's periods.** Every export takes a `periodId` you already have, but Home, the month picker and the year strip all need to *find* one. The Home agent added a minimal read in `src/app/(home)/lib/` rather than reaching into a folder it didn't own. | Correct call, wrong home. It belongs in `src/lib/queries` before a second screen duplicates it. Assigned to the next data-touching agent. |
| **"Clear data" in the menu does nothing.** The design shows it; the prototype's own handler just closes the menu, and the agent matched that literally rather than inventing a destructive action. | Also correct, but it now ships a red destructive-looking control that silently does nothing — worse than omitting it. R-19 says the user must be able to delete their own records without a console. Must be wired or removed before anyone else gets the link. |
| **The month picker assumes calendar months; the data has pay periods.** Screen 09 draws a Jan–Dec grid, but a period is "Jun 30th – Aug 3rd". The agent buckets each period by the calendar month its start date falls in. | Fine for one period per month. Two periods starting in the same month, or a period spanning two, are not modelled by the design. See `A-6`. |
| **Home renders `position: fixed; inset: 0`** so the design's sheets and scrim — which assume a 393×852 phone frame — position correctly on a scrolling page. | It covers the app's own nav bar while Home is active. Works, but it is a workaround for a prototype assumption, not a decision. Revisit when the nav is designed. |
