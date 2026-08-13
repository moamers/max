# Max — Roadmap

*See also: [Product Vision](./01-product-vision.md) · [Creative Design Brief](./02-creative-brief.md) · [Competitive Analysis](./03-competitive-analysis.md) · [V0 Implementation Plan](./05-v0-implementation-plan.md)*

Each phase has a single question it needs to answer before moving to the next. Web-first, but every phase is designed to work on mobile too (see Product Vision's cross-platform principle) — mobile is a later *build* phase, not a later *design* consideration.

## Where things actually stand right now

There's already a working, deployed foundation: a flexible parser and data model (free-text tags, not a fixed category taxonomy — this part already matches the "dynamic data model" pillar well), a Postgres backend on Railway, and a web app for uploading a spreadsheet and viewing the result.

**But by the founder's own bar, V1 isn't finished yet.** The current dashboard is a fairly conventional stat-tiles-and-bar-chart layout — exactly the "who cares about charts" pattern the Product Vision explicitly argues against. That's not a failure, it's the honest starting point: the plumbing (parsing, storage, an API) is proven, but the *presentation* still needs to move from "here is a chart" to "here is a sentence a friend would say." Closing that gap is the immediate next step, detailed in the V0 Implementation Plan.

## V1 — Prove the low-effort, non-chart experience works

**Question to answer:** if a real user (not us) uploads their own messy spreadsheet, do they come away understanding something useful about their money — without us explaining a single chart to them?

- Upload flow stays as-is (already low-friction: one file, no setup).
- Replace the chart-first dashboard with a narrative-first one: a small number of plain-language sentences ("You spent about £X more on groceries than your usual month"), with numbers and any chart as supporting detail underneath, not the headline.
- **Add a second capture surface: free-text entry.** ("spent about 80 on the shop this week, 40 on petrol"). Capture is half the data-model pillar and currently doesn't exist beyond file upload — see [The Data Model](../architecture/01-data-model.md). Text is the cheapest surface to add and it validates the "adding data feels like texting a friend" test before any of the harder ones (screenshot, voice) are built.
- Self-benchmarking (this period vs. your own history) already exists — keep it, but express it as sentences first, tiles/chart second.
- Apply the tone rules from [Agent Behaviour §8](../principles/01-agent-behaviour.md) even to template-generated sentences: no moralising vocabulary, no verdict-on-open, no unrequested monthly totals. These constraints apply from the very first sentence Max ever says.
- No accounts, no login, no onboarding form. This can still work as a "drop a file, see a result" tool at this stage.
- **Explicitly out of scope for V1:** bank connections, conversational chat, memory, cohort comparison against other people (still self-comparison only at this stage), proactive nudges.

**Done when:** someone outside the founder's own head can upload a real spreadsheet and describe back, unprompted, what the app told them — in their own words, not by reading a chart.

## V2 — Make it conversational, and give it memory

**Question to answer:** does talking to it, instead of just reading its output, make people actually come back?

- Add a persistent conversational surface (Payhawk-style: normal UI plus an always-available chat input, not a chat *replacing* the UI).
- Wire in an LLM to answer questions about the user's own data ("how much did I spend on takeout last month?").
- Build the memory middleware: a lightweight extraction step that looks at every message and decides what's worth persisting (a fact about the household, a date, a goal) *before* generating the reply — this is the mechanism, not just a nice-to-have, that makes the next phase's proactive nudges possible.
- **The memory layer must ship with its safety architecture already in place, not added later:** the Article 9 special-category suppression list enforced at write time, structured (not free-text) records, default TTLs, and deletion that reaches raw logs, embeddings and derived inferences. Retrofitting deletion into a vector store is painful and the special-category inference risk is the single largest legal exposure in the whole design. See [Ethics §3](../principles/02-ethics-and-red-lines.md) and [Technical Principles §6](../principles/03-technical-principles.md).
- Add the remaining capture surfaces — screenshot and voice — now that there's an LLM in the stack to do the mapping.
- Disclose pattern-noticing once, early and lightly, so later recall reads as memory rather than surveillance ([Agent Behaviour §3](../principles/01-agent-behaviour.md)).
- Add the web-context layer: let the LLM pull in real, cited external information (cost-of-living data, "is this normal") rather than only reasoning over the user's own numbers. Ground every comparative claim in a real source — this is the feature most likely to fail expensively if it hallucinates (see Product Vision's open risks).
- Decide the household-vs-individual data model question now, before memory data accumulates in a shape that's painful to migrate later.

**Done when:** the memory middleware demonstrably carries a fact forward across sessions (mention a kid's birthday once, get asked about it again weeks later without re-entering it), and at least one grounded, cited "how do you compare" answer works end-to-end.

## V3 — Make it proactive

**Question to answer:** does the app reaching out first change behavior, not just inform it?

- Scheduled/triggered insight checks — not a single daily digest, but small, specific, single-action nudges ("one thing worth £30/month" — not a wall of five suggestions at once).
- Use the accumulated memory from V2 to make nudges anticipatory, not just reactive ("your son's birthday is next month — start setting aside £10/week now?").
- **Build the escalation ladder properly ([Agent Behaviour §10](../principles/01-agent-behaviour.md)): escalation is gated on evidence of readiness, never on elapsed time or engagement targets.** Stage-mismatched prompting to an avoidant user causes permanent churn, not a wasted message.
- **Crisis mode is a prerequisite for shipping proactive nudges, not a follow-up.** The moment Max initiates contact, it can initiate contact with someone in genuine hardship — at which point coaching must stop entirely and signposting begins ([Agent Behaviour §9](../principles/01-agent-behaviour.md)).
- **Weight the effort toward defaults and automation over messages.** Real-world nudge effects average ~1.4pp against the ~8.7pp reported in academic literature; defaults, implementation intentions and labelled pots do far more work than well-timed copy ([Agent Behaviour §6](../principles/01-agent-behaviour.md)).
- Forward planning (the "which month should I buy this" capability) belongs here too — it needs V2's memory plus future-dated periods in the model.
- Introduce the compound-growth framing here, carefully: "this recurring leak, redirected, becomes £X in a year" — written and reviewed against the FCA guidance/targeted-support boundary from day one (see Product Vision and Competitive Analysis), not bolted on later.
- This is also where the cohort-comparison differentiator (validated as genuine white space in the Competitive Analysis) should get built out properly, since it's the feature no competitor — including Cleo — currently has.

**Done when:** a user takes a suggested small action (not just reads it), and that's measurably attributable to a nudge the app initiated.

## V4 — Connect to real accounts

**Question to answer:** does the product hold up once the data is live, continuous, and someone's real bank feed — not a one-off spreadsheet upload?

- Open Banking integration (starting with one provider/bank, as the founder mentioned testing with their own HSBC account, before broadening).
- Decide whether manual/spreadsheet upload remains a permanent privacy-conscious tier or becomes a fallback/bridge only (open question from Product Vision, needs resolving before this phase, not during it).
- Trust and security UX becomes front-and-center at this phase — see the Product Vision's "trust as the core product" risk. This is not a phase to move fast and cut corners on.

**Done when:** a real, continuously-updating bank feed produces the same quality of low-effort, narrative insight as the manual upload flow did in V1 — the promise has to survive contact with messy real-world bank data.

## Later — go-to-market and monetization

Deliberately deferred per the founder's direction, but flagged here so it isn't forgotten: pricing model, free tier shape, and marketing/positioning. The Competitive Analysis found that failure-to-monetize (Mint, Money Dashboard UK) killed products with loyal users and good product-market fit — worth revisiting the monetization point-of-view question at the start of V3 or V4, not after V4 ships.
