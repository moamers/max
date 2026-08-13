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
- Self-benchmarking (this period vs. your own history) already exists — keep it, but express it as sentences first, tiles/chart second.
- No accounts, no login, no onboarding form. This can still work as a "drop a file, see a result" tool at this stage.
- **Explicitly out of scope for V1:** bank connections, conversational chat, memory, cohort comparison against other people (still self-comparison only at this stage), proactive nudges.

**Done when:** someone outside the founder's own head can upload a real spreadsheet and describe back, unprompted, what the app told them — in their own words, not by reading a chart.

## V2 — Make it conversational, and give it memory

**Question to answer:** does talking to it, instead of just reading its output, make people actually come back?

- Add a persistent conversational surface (Payhawk-style: normal UI plus an always-available chat input, not a chat *replacing* the UI).
- Wire in an LLM to answer questions about the user's own data ("how much did I spend on takeout last month?").
- Build the memory middleware: a lightweight extraction step that looks at every message and decides what's worth persisting (a fact about the household, a date, a goal) *before* generating the reply — this is the mechanism, not just a nice-to-have, that makes the next phase's proactive nudges possible.
- Add the web-context layer: let the LLM pull in real, cited external information (cost-of-living data, "is this normal") rather than only reasoning over the user's own numbers. Ground every comparative claim in a real source — this is the feature most likely to fail expensively if it hallucinates (see Product Vision's open risks).
- Decide the household-vs-individual data model question now, before memory data accumulates in a shape that's painful to migrate later.

**Done when:** the memory middleware demonstrably carries a fact forward across sessions (mention a kid's birthday once, get asked about it again weeks later without re-entering it), and at least one grounded, cited "how do you compare" answer works end-to-end.

## V3 — Make it proactive

**Question to answer:** does the app reaching out first change behavior, not just inform it?

- Scheduled/triggered insight checks — not a single daily digest, but small, specific, single-action nudges ("one thing worth £30/month" — not a wall of five suggestions at once).
- Use the accumulated memory from V2 to make nudges anticipatory, not just reactive ("your son's birthday is next month — start setting aside £10/week now?").
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
