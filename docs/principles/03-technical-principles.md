# Max — Technical & Architectural Principles

*See also: [The Data Model](../architecture/01-data-model.md) · [Ethics & Red Lines](./02-ethics-and-red-lines.md) · [Roadmap](../product/04-roadmap.md)*

These exist so that decisions made while building V1 don't quietly make V3 impossible. Each principle is written as a constraint with the reason attached, because a principle without a reason gets discarded the first time it's inconvenient.

---

## The target shape

```
CAPTURE            spreadsheet · statement · screenshot · text · voice · bank feed
                                        │
INGESTION          LLM-assisted mapping into the model; asks when unsure
                                        │
                            ┌───────────▼───────────┐
THE MODEL           periods × envelopes · tags · baselines · future periods
                            └───────────┬───────────┘
                                        │
ANALYSIS           deterministic: baselines, deltas, rhythm/leak detection
                                        │
CONTEXT            memory store (structured, TTL'd, deletable)
                   benchmark data (ONS etc., cached, cited)
                   live web research (cited)
                                        │
ORCHESTRATION      conversational agent, MI-constrained, fact/inference tagged
                                        │
SURFACES           chat + widgets — web today, native later, one shared core
```

---

## 1. The data model is the stable core; everything else is replaceable

Sources will change (spreadsheet → statement → Open Banking). LLM providers will change. UI frameworks will change — this project has already switched from React Native to web once. **The model is the thing that must not churn**, because it's where accumulated user value lives.

**Constraint:** no ingestion source, LLM provider, or UI framework may leak its own concepts into the model's schema. The model knows about periods, envelopes, amounts, tags, and baselines. It does not know what a Plaid transaction ID is.

## 2. Arithmetic is code. Language is the LLM. Never swap them.

**This is the most important principle here.** Every number Max states must be computed by deterministic code and passed to the LLM for phrasing — never computed *by* the LLM.

**Why:** the product's core promise is trustworthy calibration for someone who can't easily check the maths themselves. An LLM that does arithmetic in-context will be wrong occasionally and confidently, and one wrong number told to an anxious user costs more trust than ten good insights earn.

**Constraint:** the LLM receives pre-computed figures in structured form and composes sentences around them. It never sees raw transactions and reports a total. The current `src/lib/insights.ts` already follows this pattern — deterministic computation, presentation separately — and that pattern is now doctrine.

## 3. Fact / sourced-fact / inference is a type, not a prompt instruction

The three-tier distinction from [Agent Behaviour §4](./01-agent-behaviour.md) must be **carried in the data structures**, not merely requested in a system prompt. Prompt-level instructions degrade silently; types don't.

**Constraint:** anything the agent can say is tagged at the source with its provenance — `fact` (user's own data), `sourced` (external, with citation), or `inference` (computed guess, with confidence). The rendering layer enforces the hedging language for `inference` and the citation for `sourced`. Never rely on the model to remember to hedge.

## 4. No benchmark without a citation, and no citation without a real source

**Constraint:** benchmark figures come from an ingested, versioned dataset with a recorded source, release date, and licence — never from LLM world-knowledge, and never from an un-cited web fetch.

Practical implications from the data research:
- **ONS "Family spending in the UK"** is the backbone and is **Open Government Licence v3.0**, so commercial reuse with attribution is permitted. Published as **XLSX workbooks** — a periodic ETL job per annual release, not a live API integration.
- The data carries a **~14-month lag** (FYE March 2025 published June 2026). Uprating for inflation is acceptable; **doing so silently is not** — it becomes an `inference`, not a `fact`.
- **Store the citation with the number**, so the rendering layer can always surface it.

## 5. Design for the honest claim ceiling, not the desired one

**A hard constraint discovered in research, and it directly limits the flagship feature.** ONS publishes region and household composition as **separate dimensions, not crossed**. There is very likely no published "London × couple with two children × income band" cell — and with roughly 5,000 households sampled nationally and London having the worst response rate of any region, fine-grained cells wouldn't be statistically sound even if they existed.

**Constraint:** Max composes comparisons from claims it can actually source. Instead of one unsourceable sentence:

> ✅ *"UK households like yours spend around £X on food. London tends to run about Y% above the UK average."* — two sourceable claims
> ❌ *"A family of four in London spends £Z on food."* — one unsourceable claim

**Open action:** open the ONS workbooks and enumerate which cross-tabs genuinely exist before building the comparison feature. It's an hour's work and it sets the product's honest claim ceiling. Commissioning a custom ONS ad-hoc cross-tab is a cheap and viable route to more granularity if needed.

## 6. Memory is structured, scoped, TTL'd, and deletable — and never training data

Driven by the Article 9 risk in [Ethics §3](./02-ethics-and-red-lines.md).

**Constraints:**
- Memory records are **typed and scoped**, never free-text dumps — free text is where special-category inferences leak in.
- A **suppression list** is enforced at write time (health, religion, sexual orientation, political affiliation, union membership). This is a code-level filter, not a prompt request.
- **Default TTL** on memory records.
- **Deletion reaches raw logs, embeddings, and derived inferences.** Designed in from day one; retrofitting deletion into a vector store is painful.
- **No training on user data**, which sidesteps the hardest erasure questions entirely.
- Memory-off must leave a working (degraded) product.

## 7. Graceful degradation is a feature, not a fallback

The model works with a full bank feed, a spreadsheet, or four numbers typed from memory. That's a product promise, so it's an architectural constraint: **no code path may assume completeness.** No required fields that block insight, no "connect your bank to continue" gate, no minimum data threshold before the app does something useful.

## 8. Ingestion asks at most one question, and learns the answer

When mapping is genuinely ambiguous (see the assignment problem in [The Data Model](../architecture/01-data-model.md)), the agent may ask **one short, specific question** — and must then persist the resolution as a rule so it never asks again.

**Constraint:** there is no categorization queue, no review inbox, no "N items need attention" badge, ever. Those are the labeling tax reappearing in a new costume.

## 9. One core, many surfaces

Web now, native later — a decision already made once the hard way in this project. The way to not pay for it twice is to keep everything that isn't rendering in shared, platform-neutral TypeScript.

**Constraint:** business logic, types, formatting, and the theme/token set live in `packages/shared` (already established) and never import from a UI framework. Only the rendering layer is platform-specific.

## 10. Provider independence at the boundary

LLM providers, Open Banking aggregators, and hosting will all change. Each gets a thin adapter at the edge of the system.

Specifically for Open Banking: the practical route is registering as an **agent of an authorised AISP** (TrueLayer, Yapily, Plaid, Tink) — roughly 4–6 weeks versus many months for full authorisation — which means the aggregator is a **swappable dependency**, and a commercially negotiated one. Don't couple the model to any single provider's transaction shape.

## 11. Deterministic insight first, LLM enhancement second

Every insight should exist as a deterministic computation *before* it becomes a sentence. This keeps the system testable (you can unit-test "was the leak detected", which you cannot do reliably against free-form model output), keeps costs bounded, and means the app degrades to something useful if the LLM is unavailable.

## 12. Privacy and safety checks are code, not vibes

The suppression list, the crisis-mode trigger, the "never mention this again" list, and the moralising-vocabulary ban are **enforced in code paths**, not requested in a system prompt. Prompts drift, get truncated, and lose adherence in long contexts; these particular failures are exactly the ones with real human cost.

---

## Where the current build stands

**Keep — already correct:**
- Free-text tags rather than a fixed category enum (`src/lib/parser.ts`).
- Deterministic insight computation separated from presentation (`src/lib/insights.ts`) — now principle #2 and #11.
- Shared TypeScript package for types and theme tokens (`packages/shared`) — now principle #9.
- Label-anchored parsing that tolerates structural variation between sheets.

**Gaps against these principles:**
- **Capture surfaces** — only spreadsheet upload exists. Text, screenshot, and voice are missing, and they're the larger half of principle #7's promise.
- **No baselines** — rhythm and leak detection need "this household's own normal" per envelope, which isn't modelled.
- **No future periods** — forward planning needs periods that haven't happened yet.
- **No provenance typing** — nothing currently carries `fact`/`sourced`/`inference` (principle #3).
- **No memory layer** — and when it arrives, it has to arrive with the suppression list and deletion story already built (principle #6), not added later.
- **`mobile/`** is parked, not deleted, and its shared-core dependency is the thing that makes it cheap to revive.
