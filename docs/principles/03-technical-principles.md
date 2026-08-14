# Max — Technical & Architectural Doctrine

*Read [Precedence](./00-precedence.md) first. See also: [The Data Model](../architecture/01-data-model.md) · [Ethics & Red Lines](./02-ethics-and-red-lines.md) · [Roadmap](../product/04-roadmap.md)*

Doctrines `T-1` … `T-14`. These exist so that decisions made building V1 don't quietly make V3 impossible. Each is a constraint with a mechanical test, because a principle without a test is a preference.

---

## The target shape

```
CAPTURE            spreadsheet · statement · screenshot · text · voice · bank feed
                                        │
INGESTION          LLM-assisted mapping into the model; asks at most once (T-8)
                                        │
                            ┌───────────▼───────────┐
THE MODEL           periods × envelopes · tags · baselines · future periods
                            └───────────┬───────────┘
                                        │
ANALYSIS           deterministic: baselines, deltas, rhythm/leak detection (T-2)
                                        │
CONTEXT            memory store (structured, TTL'd, deletable — R-16..R-19)
                   benchmark data (ingested, versioned, cited — T-4)
                   live web research (cited)
                                        │
ORCHESTRATION      conversational agent, doctrine-constrained, provenance-tagged
                                        │
SURFACES           chat + widgets — web today, native later, one shared core (T-9)
```

---

### T-1 · The model is the stable core
**RULE.** No ingestion source, LLM provider, or UI framework may leak its own concepts into the model's schema.
**TEST.** Grep the schema for vendor nouns (`plaid_`, `openai_`, provider transaction IDs, framework types). Any hit → violation.
**WHY.** Sources, models and frameworks will all churn — this project has already switched frontend frameworks once. The model is where accumulated user value lives and it must not churn with them.

### T-2 · The LLM is a compiler, not an interpreter
**RULE.** The LLM MAY make judgements about *structure and meaning* — reading an unfamiliar file, deciding what a sheet represents, mapping "spent about 80 on the shop" onto an envelope. It MUST NOT compute, derive, or infer any **figure it then states**.
**RULE.** Where the LLM makes a structural judgement, that judgement MUST be emitted as an **inspectable, serialisable plan** which is then applied by deterministic code. The plan is produced once and reused; it MUST NOT be re-derived on every read of the same input.
**TEST.** (a) Trace every emitted numeral to a value produced by a pure function under test — a numeral originating inside a model completion is a violation. (b) Does the same input produce the same numbers on every run? If not → violation.

**COMPLIANT.** The model looks at a workbook once and emits `{strategy: "workbook-is-period", sheets: [{sheet: "Week 3", role: {kind: "week", weekNumber: 3}}, …]}`. Pure code applies that plan and does the arithmetic. Same file next month → same plan, no model call, identical numbers.
**VIOLATION.** Handing the model a spreadsheet and asking it what the totals are.

**WHY — this is not blanket distrust of models.** It's an asymmetry about which mistakes the user can catch:
- **Structural mistakes are visible and recoverable.** If a sheet is misread, something looks wrong on screen and the user can say so.
- **Arithmetic mistakes are silent and authoritative.** If Max says "£312" and it was "£412", the user has no way to know — *not having to check is the entire reason they're here*. For an avoidant user a wrong number is worse than no number.

Three further reasons the boundary sits exactly here: **reproducibility** (a finance app that says £312 today and £310 tomorrow is corrosive), **testability** (you can unit-test "was the leak detected"; you cannot regression-test free-form output, which is what stops the product degrading as it grows), and **honesty** ([B-8](./01-agent-behaviour.md) lets Max tag a number `fact` — if a model computed it, that tag is a lie).

**Put the model where mistakes are recoverable. Put code where mistakes are silent.**

**STATUS.** `src/lib/insights.ts` follows the arithmetic half. `src/lib/workbook-mapping.ts` implements the compiler seam — a `WorkbookMapping` plan, derived by rules today, with an LLM detector swappable in behind the same interface. It returns a plan; it never returns numbers.

### T-3 · Provenance is a type, not a prompt instruction
**RULE.** `fact` / `sourced` / `inference` MUST be carried in the data structures and enforced by the rendering layer. Hedging and citation MUST NOT depend on the model remembering to apply them.
**TEST.** Can a value reach output without a provenance tag? If the type system permits it, the design is non-compliant.
**WHY.** Prompt-level instructions degrade silently in long contexts. Types don't.

### T-4 · No benchmark without a versioned, licensed source
**RULE.** Benchmark figures MUST come from an ingested dataset carrying a recorded source name, release period, and licence. Citations MUST be stored *with* the number.
**TEST.** Benchmark value without an attached source record → cannot render.
**NOTES.** ONS *Family spending in the UK* is the backbone and is **Open Government Licence v3.0** (commercial reuse permitted with attribution). Published as **XLSX workbooks** — a periodic ETL per annual release, not a live API. Data carries a **~14-month lag**; uprating for inflation is permitted but MUST be tagged `inference`, never `sourced`.

### T-5 · Design for the honest claim ceiling
**RULE.** Max MUST compose comparisons from claims the source can actually support. A single claim MUST NOT combine dimensions the source publishes separately.
**TEST.** Does the sentence assert a cross-tab? Verify the cell exists in the source. If not → decompose into separately sourceable claims.
**COMPLIANT.** "UK households like yours spend around £X on food. London tends to run about Y% above the UK average." *(two sourceable claims)*
**VIOLATION.** "A family of four in London spends £Z on food." *(one unsourceable claim)*
**WHY.** ONS publishes **region and household composition as separate dimensions, not crossed**. With ~5,000 households sampled nationally and London the worst-responding region, fine-grained cells would not be statistically sound even if published.
**OPEN ACTION.** Open the ONS workbooks and enumerate which cross-tabs genuinely exist before building the comparison feature. ~1 hour, and it sets the product's honest claim ceiling. A commissioned ONS ad-hoc cross-tab is a cheap route to more granularity.

### T-6 · Memory safety is code, not prompt
**RULE.** The Article 9 suppression list (R-16), the "never mention again" list (B-25), the crisis trigger (B-29), and the banned-vocabulary list (B-23) MUST be enforced in code paths that the model cannot bypass.
**TEST.** Disable the system prompt entirely. Do the safety behaviours still hold? If not → violation.
**WHY.** Prompts drift, get truncated, and lose adherence in long contexts. These particular failures are the ones with real human cost.

### T-7 · Graceful degradation is a contract
**RULE.** No code path may require completeness. No required field may block insight; no gate may demand a bank connection; no minimum data threshold may precede usefulness.
**TEST.** Feed the system four numbers. Does it produce a useful, honest output? If not → violation.

### T-8 · Ingestion asks at most once, then learns
**RULE.** Ambiguous mapping MAY trigger one clarifying question, after which the resolution MUST be persisted as a rule and MUST NOT be asked again for the same pattern.
**RULE.** There MUST NOT be a categorisation queue, a review inbox, an "uncategorised" count, or an "N items need attention" badge, in any form, ever.
**TEST.** Search the UI for any element whose count increases with unprocessed user data. Any hit → violation.
**WHY.** Those are the labeling tax reappearing in a new costume.

### T-9 · One core, many surfaces
**RULE.** Business logic, types, formatting and design tokens MUST live in `packages/shared` and MUST NOT import from any UI framework. Only rendering is platform-specific.
**TEST.** Static-analyse `packages/shared` imports for React/React Native/DOM. Any hit → violation.

### T-10 · Provider independence at the boundary
**RULE.** LLM providers, Open Banking aggregators and hosting MUST sit behind thin adapters. The model MUST NOT be coupled to any provider's transaction shape.
**NOTE.** The practical Open Banking route is registering as an **agent of an authorised AISP** (TrueLayer, Yapily, Plaid, Tink) — roughly 4–6 weeks versus many months for full authorisation — which makes the aggregator a swappable, commercially negotiated dependency.

### T-11 · Deterministic insight first, LLM enhancement second
**RULE.** Every insight MUST exist as a deterministic computation before it becomes a sentence.
**TEST.** Can the insight be unit-tested without invoking a model? If not → violation.
**WHY.** Testability ("was the leak detected?"), bounded cost, and graceful degradation when the LLM is unavailable.

### T-12 · Every doctrine with a mechanical test gets an automated check
**RULE.** Doctrines whose TEST is mechanically evaluable MUST have a corresponding automated check in CI or in the output pipeline. Currently: B-6 (one question), B-8/T-3 (provenance), B-23 (banned vocabulary), B-25 (suppression list), R-16 (Article 9 filter), T-9 (shared-core imports).
**WHY.** A doctrine nobody can verify is a doctrine nobody follows.

### T-13 · Output passes a doctrine gate before emission
**RULE.** All user-facing generated output MUST pass a pre-emit validation pass covering the Tier 1–5 mechanical checks. Failure MUST regenerate or suppress — never emit-with-warning.
**TEST.** Is there a code path from model completion to user that bypasses the gate? If yes → violation.

### T-14 · Doctrine IDs are referenced in code
**RULE.** Code implementing a doctrine MUST cite its ID in a comment (e.g. `// B-25: suppression list is permanent and cross-surface`).
**WHY.** Makes the link auditable in both directions and stops a doctrine being silently refactored away.

---

## Where the current build stands

**Compliant already:**
- Free-text tags rather than a fixed category enum (`src/lib/parser.ts`) — T-1.
- Deterministic insight computation separated from presentation (`src/lib/insights.ts`) — T-2, T-11.
- Shared TypeScript package for types and tokens (`packages/shared`) — T-9.
- Label-anchored parsing tolerant of structural variation between sheets — T-7 in spirit.

**Gaps:**
| Gap | Doctrine |
|---|---|
| Only spreadsheet capture exists; no text, screenshot or voice | T-7, and the larger half of the data-model pillar |
| No baselines per envelope — rhythm/leak detection has nothing to compare against | — |
| No future-dated periods — forward planning impossible | — |
| No provenance typing anywhere | T-3 |
| No memory layer — and when it lands it must arrive *with* R-16/R-18 already built | T-6 |
| No pre-emit doctrine gate | T-13 |
| No automated doctrine checks | T-12 |
| `mobile/` parked — kept cheap to revive by T-9 | T-9 |
