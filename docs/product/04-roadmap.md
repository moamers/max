# Max — Roadmap

*See also: [Product Vision](./01-product-vision.md) · [Creative Design Brief](./02-creative-brief.md) · [Competitive Analysis](./03-competitive-analysis.md) · [V0 Implementation Plan](./05-v0-implementation-plan.md)*

Each phase has a single question it needs to answer before moving to the next. Web-first, but every phase is designed to work on mobile too (see Product Vision's cross-platform principle) — mobile is a later *build* phase, not a later *design* consideration.

## Where things actually stand right now

There's a deployed foundation: a parser that has now survived two rounds of contact with the founder's real spreadsheet, a Postgres backend on Railway, a narrative-first dashboard, and a tone gate enforced in code rather than in prose. Both parser defects (`F-1`, `F-3`) were caught by making a number traceable, not by reading the code — which is the strongest argument so far for the "provenance travels with the figure" doctrine.

Two things have changed since this roadmap was written.

**A complete design exists.** Twelve screens, both themes, final copy, and a deliberately minimal chart grammar — one bar that means one thing. It lives in [`docs/design/handoff/`](../design/handoff/README.md) and it is the specification for V1, not a mood board.

**The founder's bar for V1 became concrete:** *he stops using the spreadsheet and uses Max instead.* That is a much harder and much better test than "someone understands a sentence", and it reorders everything below. Parity and capture come before insight — because insight on partial data is the failure mode this project already hit once (a £4,000 "deficit" that was really a misread rent row), and the data stays partial until Max is where he actually records.

So the narrative and comparison work that used to be V1 moves into V2. It isn't cut, and it isn't wasted: `narrative.ts` and the tone gate stay in the build, and the tone rules apply to every word of V1's copy.

## V1 — Replace the spreadsheet

**Question to answer:** does the founder stop opening the spreadsheet?

Everything here is parity with what the spreadsheet already does for him, plus the two things a spreadsheet does that a web app doesn't get for free: keeping other people out, and letting him leave.

- **Accounts and per-user isolation.** Not best-in-class security — a real login, a session, and every row scoped to its owner, so the app can be handed to a friend without handing over the founder's income. This blocks everything else and goes first.
- **Import**, from the existing parser: the three-state flow (invite → reading → result), including the "lines I couldn't place" reconciliation step. The parser already keeps free-text labels; the import result screen is where that stops being invisible.
- **Capture.** A transaction can be added by hand in a few taps, pre-tagged by wherever the user was standing. This is the feature that decides the whole question — a tool you can read but not write to does not replace a spreadsheet.
- **The month view**: where I stand today and at month end, weeks with their targets, drill-down to a week, to a category, to a single transaction, every field editable.
- **Recurring and one-off spend**, as separate surfaces with no budget bars, because neither has a target.
- **Targets and income**: weekly per-category goals and month-by-month income, since these drive every bar in the app.
- **Export back to his own spreadsheet template.** The escape hatch, and the honesty test: if Max can't reproduce the sheet it read, it hasn't really understood it. This doubles as the strongest available check on the parser.
- **Year round-up**, last — it is parity with the Aggregates tab, but it needs a year of data to say anything, so it is the first thing to cut if V1 is running long.

**Explicitly deferred to V2, not dropped:** conversational chat, memory, LLM-generated narrative beyond today's deterministic sentences, comparison against anyone other than himself, proactive nudges, free-text capture ("spent 80 on the shop"), and the remaining capture surfaces (screenshot, voice).

**Done when:** a full pay period passes and the founder recorded it in Max rather than the spreadsheet — and the export round-trips back to his template without losing a row or a label.

**The tension worth naming:** this V1 is a numbers-and-bars budgeting app, and the founding thesis is that nobody wants a numbers-and-bars budgeting app. Both are true, and the order resolves it. V1 earns the right to be opinionated later by first being *complete and trustworthy* — the comparative, conversational layer that makes Max different is V2, and it needs V1's data to exist at all. The risk to watch is that V1's setup (weekly targets, per-category goals) is exactly the "labelling tax" the vision argues against. For the founder it is parity, because he already does it. For a second user it is onboarding, and that is an open question, not a settled one — see [`A-5`](../00-open-decisions.md).

## V2 — Make it conversational, and give it memory

**Question to answer:** does talking to it, instead of just reading its output, make people actually come back?

**Moved here from V1** when the V1 bar became "replace the spreadsheet": the narrative-first presentation of insight, self-benchmarking expressed as sentences, and free-text capture ("spent about 80 on the shop"). None of it is cut — the deterministic sentence generator and the tone gate are already built and stay in the V1 build. What changed is that they now sit on top of complete data instead of a single uploaded file, which is the condition under which they were always going to be worth anything.

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
