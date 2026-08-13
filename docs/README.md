# Max — Documentation

Max is a personal finance companion for people who avoid personal finance apps. These documents are the shared source of truth for what it is, who it's for, how it behaves, and what it must never do.

They're living documents. When a decision changes, the document changes.

---

## Start here

| # | Document | What it answers |
|---|---|---|
| 1 | **[Product Vision](./product/01-product-vision.md)** | Who this is for, what the promise is, the four pillars, and the open risks. **Read this first.** |
| 2 | **[Creative Brief](./product/02-creative-brief.md)** | Brand, tone, voice and visual direction. For designers, and for anyone writing user-facing copy. |
| 3 | **[Competitive Analysis](./product/03-competitive-analysis.md)** | What already exists, what's genuinely unclaimed, and where the original thesis was wrong. |
| 4 | **[Roadmap](./product/04-roadmap.md)** | V1 → V4, each with the single question it has to answer before moving on. |
| 5 | **[V0 Implementation Plan](./product/05-v0-implementation-plan.md)** | The concrete next engineering step. |
| 6 | **[Commercial Strategy](./product/06-commercial-strategy.md)** | The honest moat assessment, the UK timing window, ranked mitigants, and monetisation. |

## Doctrine

Executable constraints that outlive any single feature. Written so an agent — or an engineer — can apply them without interpretation: every doctrine has a **RULE**, a mechanical **TEST**, a compliant and a violating example, and a rationale. If a feature conflicts with a doctrine, the feature is wrong.

| Document | Prefix | What it governs |
|---|---|---|
| **[Precedence](./principles/00-precedence.md)** | — | **Read first.** How doctrines are written, and the tier lattice that resolves every conflict. |
| **[Agent Behaviour](./principles/01-agent-behaviour.md)** | `B-` | How Max talks. Grounded in Motivational Interviewing, Stages of Change and habit-formation evidence. Includes escalation gating and the crisis protocol. |
| **[Ethics & Red Lines](./principles/02-ethics-and-red-lines.md)** | `R-` | Values, hard prohibitions, memory/trust rules, and where a real professional is required. |
| **[Technical Principles](./principles/03-technical-principles.md)** | `T-` | Architectural constraints aimed at the target state, so V1 decisions don't make V3 impossible. |
| **[Global Agent Instructions](./principles/04-global-agent-instructions.md)** | — | The compiled system prompt embedded in every Max agent. Copy-pasteable. |

## Architecture

| Document | Prefix | What it covers |
|---|---|---|
| **[The Data Model](./architecture/01-data-model.md)** | `D-` | The most distinctive thing about Max: time-boxed rather than transaction-boxed. Read before touching the schema. |

## Reading the doctrine IDs

`B-25` means Agent Behaviour doctrine 25, and always will — IDs are permanent, never renumbered, and superseded doctrines are kept and marked rather than deleted. Code implementing a doctrine cites its ID in a comment ([T-14](./principles/03-technical-principles.md)), so the link is auditable in both directions.

**The tier lattice, in one line:** `SAFETY > LEGAL > TRUTH > USER AUTHORITY > TONE > METHOD > HELPFULNESS`. Higher always wins outright; tiers are never balanced against each other.

---

## The five-minute version

**The problem.** Every budgeting app makes categorization the user's job. That's a data-cleaning pipeline disguised as a feature, and it's why people quit — including people who like budgeting.

**The deeper problem.** For our user the barrier isn't financial literacy, it's **avoidance**. Plenty of numerate people don't look at their money because looking feels like judgement. Shipping them more information makes it worse.

**The inversion.** Max's data model takes *a week of living and what it cost* as its atom, not a classified transaction. A weaker claim, deliberately — and weak claims survive messy, estimated, half-remembered input. That's what removes the labeling tax structurally rather than cosmetically.

**The promise.** Near-zero effort. Dump in whatever you have — spreadsheet, statement, screenshot, a typed sentence — and Max organises it, tells you where you stand in plain language, tells you honestly how that compares to households like yours, and helps you plan around what's coming.

**The stance.** Tactful, inquisitive, never moralising. Coaches by asking rather than telling. Separates what it knows from what it's guessing. Escalates only when there's evidence you're ready. Stops coaching entirely and signposts to real help if you're in genuine trouble.

**The honest competitive read.** Most of the technical differentiators are matched or matchable. What survives: a segment Cleo structurally can't serve without abandoning its persona, ingestion that doesn't require a bank login when every major rival does, memory of things that were never in the transaction feed — and a UK market window that's open now and closing.
