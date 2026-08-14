# Max — The Data Model

*See also: [Product Vision](../product/01-product-vision.md) · [Technical Principles](../principles/03-technical-principles.md) · [Agent Behaviour](../principles/01-agent-behaviour.md)*

> **Doctrines `D-1` … `D-10` are at the foot of this document.** The prose explains why; the doctrines are what gets executed.

This is the most distinctive thing about Max and the least obvious. Everything else — the tone, the coaching, the comparisons — sits on top of it. It deserves its own document because if this is copied wrong, the product becomes another budgeting app.

## The core inversion

Every mainstream budgeting app models money like this:

> **transaction → category → aggregate → report**

The *transaction* is the unit of meaning. Each one must be classified before it counts for anything, and because transactions are precise, the whole system inherits a demand for precision. Precision is work, and that work lands on the user. That is the labeling tax, and it is structural rather than a UX failure — you cannot design your way out of it while every transaction must be individually resolved before the system will speak.

Max inverts *the unit of meaning*, not the existence of transactions:

> **time period → envelope → pattern → meaning**

### The atom and the particles

The founder's own framing, and the right one:

> **The atom is the week. Transactions are the subatomic particles that make it up.**

Both halves matter, and it's worth being exact about what each one does:

- **The week is the atom** — the smallest unit that carries *meaning on its own*. "Week 2 · Grocery · £212" is a complete, usable statement. It does not claim every pound bought groceries; it claims *this is roughly what an ordinary week of feeding this household cost*. That's a weaker claim than a classified transaction, and its weakness is the point: a weaker claim survives messy input. It can be recalled, estimated, wrong by £5, and still true enough to act on.
- **Transactions are the particles** — real, constituent, and information-rich. They are what the atom is *made of*. Splitting the atom is where the detail lives: which shops, which rhythm, which of these were needed and which were nice-to-have.

The distinction that actually matters is not "transactions vs. periods." It is:

| | Every other app | Max |
|---|---|---|
| **Unit of meaning** | The transaction | The week |
| **Minimum viable input** | Every transaction, classified | One number |
| **Who classifies** | The user | Nobody — or Max, silently |
| **Transaction detail** | Mandatory | **Optional in supply, valuable when present** |

**The rule in one line: transaction detail is never required, and never wasted.**

A user who types "£212 on the shop this week" gets a working product. A user who uploads a statement gets a *better* one — because now Max can see the merchants and the rhythm. Neither user is ever handed a queue of things to classify.

**Precision is not the goal. Directional truth at low effort is the floor — and richer input raises the ceiling.**

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

## What the particles are for

Transaction detail is optional to *supply* but it is not decoration. When it's there, it carries context nothing else can:

**1. Merchant identity is load-bearing for the "savvy" pillar.**
Knowing *where* the money went is what turns a benchmark into an action. "You're above average on groceries" is a fact the user can do nothing with. "Most of your shop is at M&S — households spending like yours at Aldi or Lidl typically run £X lower" is the thing the founder described wanting: not just *am I normal*, but *what would someone who knew this city do differently*. Without merchant strings, Max can compare but cannot advise. This is precisely the "have you considered shopping in this area instead of that one" capability from the original brief, and it dies without transaction detail.

**2. Rhythm is only visible at particle level.**
The weekly envelope running £20 hot tells you *that* there's a leak. Five £4 charges at the same coffee shop on five consecutive mornings tells you *what* it is. Aggregate detects; detail diagnoses.

**3. Merchant strings are free when they arrive.**
This is the crucial asymmetry. A statement, a screenshot or a bank feed carries merchant names at **zero marginal effort to the user**. Using data that arrived for free is not a labeling tax. The tax is only ever incurred when the *user* is made to do the resolving.

**4. But detail is never a precondition.**
Max must produce a genuinely useful answer from four typed numbers. Detail improves the answer; its absence must never block one, prompt for it, or be represented as incompleteness.

## Labels: the user's own language, not an imposed taxonomy

This is where the distinction gets sharp, and it's the one most likely to be misread as a contradiction.

**Being made to classify a purchase into someone else's schema is a tax. Writing a word next to a number because you want to know something is not.** The first is compliance; the second is intent. Max forbids the first and treasures the second.

Labels in the real spreadsheet do at least three distinct jobs, and conflating them loses information:

| Kind | Examples | What it encodes | Why it matters |
|---|---|---|---|
| **Necessity** | `weekly` vs `weekly-extra` | Core need vs. a convenience upgrade — the founder's example: a ready-made salad instead of making it at home | **The most valuable label in the model.** It's a *discretionary-ness* signal the user has volunteered, which is exactly what leak detection needs and what no merchant classifier can infer. A £6 salad and a £6 bag of potatoes look identical to a category engine. |
| **Event / project** | `holiday`, `dxb-26`, `fam-uk` | This period or this run of spend isn't ordinary | Explains anomalies so baselines aren't poisoned; groups spend that spans months into a thing the user thinks of as one thing (a trip, a visit) |
| **Person** | `Adam`, `Aaron`, `nadia`, `mohamed` | Who this was for | Per-person attribution inside a household — "what does Adam actually cost?" Directly informs the household-vs-individual decision ([A-1](../00-open-decisions.md)) |

Three rules follow, and they are not in tension:

1. **Untagged is complete.** The default is no label, and no label means "nothing to say about this." Never a deficiency, never a prompt, never a badge.
2. **When a label exists, it is a first-class signal** — not an optional note. `weekly-extra` should change what Max concludes.
3. **Labels are the user's vocabulary.** Max MUST NOT normalise, merge, rename, or map them into a canonical taxonomy behind the user's back. `fam-uk` means what it means to this household. Max may *ask* what a label means; it may not *decide*.

The product implication is strict: **the app must never present an "uncategorized" count, an empty-state prompt to tag things, or any UI implying untagged data is incomplete.** A "12 transactions need review" badge would violate the model's core promise — that's the labeling tax wearing a different hat.

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
- **Merchant-type + day combination.** Better, and *not* a retreat from the thesis: per [D-9](#the-doctrines), Max classifying a merchant string it received for free is fine — the labeling tax is only incurred when the **user** is made to do the resolving. The cost here is engineering and error rate, not user effort.
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
| **D-1** | The **unit of meaning** is the period ("the atom"). Transactions are its constituents ("the particles") — **never required to supply, never discarded when supplied.** Schema changes that make a period unusable without transaction detail are prohibited; so is discarding detail that arrived. | Two tests, both must pass. (a) Can a period exist and be useful with *no* transaction detail? (b) When detail *is* supplied, is it retained and used? Either failing → violation. |
| **D-2** | Envelopes are **behavioural modes** (an ordinary week; a weekend; the fixed floor; everything else), not merchant categories. New envelopes MUST describe a mode of living, not a class of goods. | Does the proposed envelope name a way of living or a type of purchase? Purchase type → violation. |
| **D-3** | Labels are **the user's own vocabulary**, not an imposed taxonomy. Untagged is complete and MUST be treated as such; a label that *is* present MUST be treated as a first-class signal, not a cosmetic note. | Two tests. (a) Does any logic treat an untagged item as missing or needing attention? → violation. (b) Does a present label (e.g. `weekly-extra`) change what Max concludes? If it is ignored → violation. |
| **D-4** | The product MUST NOT surface an uncategorised count, a review queue, a tagging prompt, or any badge that grows with unprocessed data. | Search the UI for counters that increase with user data volume. Any hit → violation. *(mirrors [T-8](../principles/03-technical-principles.md))* |
| **D-5** | Capture MUST accept spreadsheet, statement, screenshot, typed text and speech, and Max MUST perform the mapping. The user MUST NOT be asked to pre-format anything. | Can a week be added by typing one sentence? If not → the pillar is unbuilt. |
| **D-6** | Partial input MUST produce useful output. There is no minimum completeness threshold. | Feed four numbers. Useful, honest output? If not → violation. *(mirrors [T-7](../principles/03-technical-principles.md))* |
| **D-7** | Envelope assignment derived from a bank feed is an **inference** and MUST be tagged `inference`, never `fact`. | Any envelope split derived from transactions rendered without a hedge → violation. *(see Tension 1)* |
| **D-8** | Mapping from envelopes to external benchmark taxonomies is **internal, probabilistic, and never the user's job**, and its output is always `inference`. | Is the user ever asked to reconcile their data to a benchmark category? → violation. *(see Tension 2)* |
| **D-9** | Transaction detail that arrives at **zero marginal user effort** (statement, screenshot, bank feed) MUST be retained and used — merchant strings especially, since they are what makes "savvy" advice possible rather than bare comparison. Max MUST NOT ask the user to supply, correct, or complete transaction detail. | Is merchant data discarded on ingest? → violation. Is the user ever prompted to add or fix transaction detail? → violation. |
| **D-10** | Max MUST NOT normalise, merge, rename, or canonicalise user labels. It MAY ask what a label means; it MAY NOT decide. | Does any pipeline map user labels onto a fixed internal vocabulary? → violation. *(Internal mapping for benchmark comparison is permitted under [D-8](#the-doctrines) — but it is inference, never written back over the user's label.)* |

## Implications for what's built today

The current implementation already gets the important part right: `src/lib/parser.ts` reads period sheets with free-text tags rather than a fixed category enum, and `src/lib/store.ts` persists `line_items` with an optional `tag` rather than a foreign key into a category table. That instinct was correct and should be protected.

What's missing against this document:
- **Capture surfaces** beyond spreadsheet upload (text, screenshot, voice) — the largest gap.
- **Envelope semantics are implicit.** The code knows `grocery`/`weekend`/`transport` as strings from sheet parsing; it doesn't yet model them as behavioural envelopes with baselines, which is what rhythm/leakage detection will need.
- **No baseline concept.** Leakage detection requires "this week versus this household's own normal," which means storing or deriving a rolling baseline per envelope.
- **No forward-looking periods.** The founder's own planning example (deciding *which month* to make a purchase, given a holiday in August and a birthday in October) requires the model to hold *future* periods with expected costs, not just past ones. Nothing supports that today.
