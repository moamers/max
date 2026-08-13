# Max — The Data Model

*See also: [Product Vision](../product/01-product-vision.md) · [Technical Principles](../principles/03-technical-principles.md) · [Agent Behaviour](../principles/01-agent-behaviour.md)*

> **Doctrines `D-1` … `D-8` are at the foot of this document.** The prose explains why; the doctrines are what gets executed.

This is the most distinctive thing about Max and the least obvious. Everything else — the tone, the coaching, the comparisons — sits on top of it. It deserves its own document because if this is copied wrong, the product becomes another budgeting app.

## The core inversion

Every mainstream budgeting app models money like this:

> **transaction → category → aggregate → report**

The atom is the *transaction*. Each one must be classified before it means anything. Because the atom is a transaction and transactions are precise, the whole system inherits a demand for precision — and precision is work, and that work lands on the user. That is the labeling tax, and it is structural, not a UX failure. You cannot design your way out of it while the transaction is the atom.

Max inverts it:

> **time period → envelope → pattern → meaning**

The atom is a *period of living* — a week — and what it cost. A number under "Week 2 · Grocery" does not claim that every pound in it bought groceries. It claims: *this is roughly what an ordinary week of feeding this household cost.* That's a weaker claim, and its weakness is the entire point. A weaker claim survives messy input. It can be entered from memory. It can be estimated. It can be wrong by £5 and still be true enough to act on.

**Precision is not the goal. Directional truth at low effort is the goal.**

## The envelopes are behavioural, not merchant-based

This is the second non-obvious thing. The envelopes in the founder's original spreadsheet are not categories of *goods*. They're modes of *living*:

| Envelope | What it actually represents |
|---|---|
| **Weekly** (grocery/transport) | The cost of an ordinary working week. Groceries, commuting, the coffee on the way in. |
| **Weekend** | The cost of not-working. Family outings, eating out, the bakery run. A different behavioural mode with a different psychology. |
| **Bills / recurring** | The fixed floor. Rent, utilities, subscriptions. Slow-moving, mostly not a decision. |
| **Miscellaneous / extras** | Everything else — the Amazon orders, gifts, one-offs, home stuff. |

"Weekend" is not a category of purchase. You cannot buy a "weekend." It's a container for a *kind of life*, and that is precisely why users can fill it accurately without thinking: people remember "we had a big weekend" far more reliably than they remember which of 47 transactions were discretionary.

This also means the envelopes map onto how spending decisions actually get *made* — which is what makes the trade-off insight below possible.

## Tags are exception markers, not a taxonomy

The free-text tags in the model (`holiday`, `dxb-26`, `nadia`, `home-improvements`) look like categories but function differently. **A tag is used to explain an anomaly, not to classify a purchase.**

You tag a week `holiday` because that week wasn't an ordinary week, and the number would otherwise mislead. You tag a run of spending `dxb-26` because it belongs to a project (a trip) that spans months. The default state is *untagged*, and untagged is fine — it means "nothing unusual to say about this."

The implication for the product is strict: **the app must never present an "uncategorized" count, an empty-state prompt to tag things, or any UI that implies untagged data is incomplete.** Untagged is the healthy default. A "12 transactions need review" badge would violate the model's core promise.

## What this makes possible that a category model can't

**1. Leakage shows up as rhythm, not as a category total.**
A £4 coffee five mornings a week never appears as a line item worth noticing in a category view — it's £4, it's nothing, and it's spread across a "Food & Drink" bucket that also contains the weekly shop. In the time-boxed model it shows up as *the weekly envelope running consistently £20 above its own baseline*, and the diagnostic signal is the **regularity**, not the amount. The founder's own framing: leakage lives in the rhythm of ordinary weeks, and in the weekend bakery run that happens every single weekend.

**2. Trade-offs, not cuts.**
The insight the founder described from his own life is not "spend less on coffee." It's: *"If I go out with the kids at the weekend, I can't also do coffee every day in the week."* Because the envelopes are behavioural modes and they sit side by side under one income, the model naturally expresses spending as a **balance between competing goods**, not as a moral failure to be corrected. This is a fundamentally different — and far less shaming — conversation than any category-based app can have, and it matters enormously for a financially avoidant user who flinches at judgement.

**3. It degrades gracefully.**
Full bank feed → sharp. A spreadsheet → good. Four numbers typed from memory → still useful. There is no threshold below which the model stops working, because it never depended on completeness in the first place.

## Capture is a first-class surface, not an import step

This is a gap in what's currently built and it needs correcting. The interface is not only for *viewing* the model — it is equally for *feeding* it, and feeding it must be as close to effortless as viewing it.

Max must accept, and map to the model itself:
- a spreadsheet (the founder's existing template — already working)
- a bank statement (PDF or CSV)
- **a screenshot** (a banking app screen, a receipt)
- **typed text** ("spent about 80 on the shop this week, 40 on petrol")
- **voice** (the same thing, spoken)
- eventually, a live bank connection (V4)

In every case the *agent* does the mapping into envelopes and periods, and — per the inquisitive principle — asks a short, specific question when genuinely unsure, rather than either guessing silently or dumping a form on the user. One question is acceptable. A categorization queue is not.

**The design test:** adding a week of data should feel like sending a text message to a friend, not like filling in a form.

## Two real tensions to resolve deliberately

### Tension 1 — Automated ingestion reintroduces the assignment problem

The model's ambiguity is a *feature* for human entry and a *problem* for machine ingestion. When a real bank feed arrives (V4), a Tesco charge on a Saturday is genuinely ambiguous: weekly grocery, or weekend? The human entering from memory never faced this question because they were recalling a *mode of living*, not classifying a transaction. The machine has only the transaction.

This is the single biggest technical risk to the thesis, and it is currently unaddressed. Options, none free:
- **Day-of-week heuristic** (Sat/Sun → weekend). Crude, fails for shift workers, but cheap and explainable.
- **Merchant-type + day combination.** Better, needs a merchant classifier — creeping back toward the thing we're avoiding.
- **Learn from one confirmation.** Ask once, apply the pattern thereafter, never ask again. Most consistent with the product's promise.
- **Don't assign at all** — present the week as a single number and let the envelope split be an *inference Max states as an inference*.

The last option is the most philosophically consistent and should be the default position until evidence says otherwise.

### Tension 2 — Peer comparison pulls back toward categories

**Pillar 1 (never categorize) and pillar 3 (peer comparison) are in direct tension, and nobody has flagged it yet.** External benchmark data (ONS and similar) is published in standard statistical categories — food and non-alcoholic drinks, transport, housing, recreation. Max's envelopes (weekly, weekend, bills, misc) do not map cleanly onto them. To say "your food spending is high for a London family of four," something has to bridge Max's behavioural envelopes to the benchmark's taxonomy — and that bridge is a categorization problem.

**Proposed resolution:** the bridge exists, but it is *internal and probabilistic, and it is never the user's job*. Max infers a rough mapping, performs the comparison, and — critically — presents the result **explicitly labelled as an inference**, in line with the fact-versus-inference principle:

> *"Roughly speaking, your food spending looks like it's around £X a month. For a family of four in London, the ONS figure is about £Y. I'm estimating your side from weekly totals, so treat it as a ballpark."*

That sentence is honest, useful, and requires zero work from the user. It is the correct shape for every comparison Max makes.

## The doctrines

| ID | RULE | TEST |
|---|---|---|
| **D-1** | The atom of the model is **a period of living and what it cost**, never a classified transaction. Schema changes that make the transaction the primary unit are prohibited. | Can a period exist and be useful with no transaction-level detail at all? If not → violation. |
| **D-2** | Envelopes are **behavioural modes** (an ordinary week; a weekend; the fixed floor; everything else), not merchant categories. New envelopes MUST describe a mode of living, not a class of goods. | Does the proposed envelope name a way of living or a type of purchase? Purchase type → violation. |
| **D-3** | Tags are **exception markers**, not a taxonomy. Untagged is the healthy default and MUST be treated as complete. | Does any logic treat an untagged item as missing, incomplete, or needing attention? → violation. |
| **D-4** | The product MUST NOT surface an uncategorised count, a review queue, a tagging prompt, or any badge that grows with unprocessed data. | Search the UI for counters that increase with user data volume. Any hit → violation. *(mirrors [T-8](../principles/03-technical-principles.md))* |
| **D-5** | Capture MUST accept spreadsheet, statement, screenshot, typed text and speech, and Max MUST perform the mapping. The user MUST NOT be asked to pre-format anything. | Can a week be added by typing one sentence? If not → the pillar is unbuilt. |
| **D-6** | Partial input MUST produce useful output. There is no minimum completeness threshold. | Feed four numbers. Useful, honest output? If not → violation. *(mirrors [T-7](../principles/03-technical-principles.md))* |
| **D-7** | Envelope assignment derived from a bank feed is an **inference** and MUST be tagged `inference`, never `fact`. | Any envelope split derived from transactions rendered without a hedge → violation. *(see Tension 1)* |
| **D-8** | Mapping from envelopes to external benchmark taxonomies is **internal, probabilistic, and never the user's job**, and its output is always `inference`. | Is the user ever asked to reconcile their data to a benchmark category? → violation. *(see Tension 2)* |

## Implications for what's built today

The current implementation already gets the important part right: `src/lib/parser.ts` reads period sheets with free-text tags rather than a fixed category enum, and `src/lib/store.ts` persists `line_items` with an optional `tag` rather than a foreign key into a category table. That instinct was correct and should be protected.

What's missing against this document:
- **Capture surfaces** beyond spreadsheet upload (text, screenshot, voice) — the largest gap.
- **Envelope semantics are implicit.** The code knows `grocery`/`weekend`/`transport` as strings from sheet parsing; it doesn't yet model them as behavioural envelopes with baselines, which is what rhythm/leakage detection will need.
- **No baseline concept.** Leakage detection requires "this week versus this household's own normal," which means storing or deriving a rolling baseline per envelope.
- **No forward-looking periods.** The founder's own planning example (deciding *which month* to make a purchase, given a holiday in August and a birthday in October) requires the model to hold *future* periods with expected costs, not just past ones. Nothing supports that today.
