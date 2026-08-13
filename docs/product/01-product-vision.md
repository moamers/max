# Max — Product Vision

*See also: [Creative Design Brief](./02-creative-brief.md) · [Competitive Analysis](./03-competitive-analysis.md) · [Roadmap](./04-roadmap.md) · [V0 Implementation Plan](./05-v0-implementation-plan.md)*

## The belief this is built on

You can't improve what you don't measure. Almost everyone agrees with that in the abstract and almost no one does it for their own money — not because they don't care, but because every tool that helps you measure your finances demands a second job first: categorizing, labeling, cleaning up merchant names, uploading receipts. The tool asks the user to do the data engineer's work before it will do the finance person's work. Most people quit at that first step. Some — including people who *like* budgeting, who keep a spreadsheet, who are the target customer on paper — quit anyway, because the ritual of cleaning your own data is tedious even when you don't mind the underlying subject.

Max exists to remove that first job entirely, and to replace it with something a low-effort, low-financial-literacy user will actually keep using: a companion that organizes what it can, approximates what it can't, and talks to you about what it finds — instead of handing you a dashboard and leaving you to interpret it.

## Who this is for

**Primary persona — "the reluctant tracker."** Financially unexceptional, not struggling, not the FIRE-blog type either. Dual-income household, kids, a life that's busy enough that finance sits in the "I should really deal with this" pile indefinitely. Has tried a budgeting app before (maybe more than one) and stopped within weeks — not because it didn't work, but because keeping it fed with categorized, clean data felt like homework. Doesn't know if £2,000/month on a family of four's groceries in London is normal or alarming, and has no easy way to find out beyond guessing or asking a friend. Wants reassurance and small, concrete actions — not a spreadsheet, not a lecture, not twelve pie charts.

**Secondary persona — the household, not just the individual.** Several of the founder's own use cases (a spouse, kids, family budget lines) are inherently *household* finance, not one person's. Max should treat shared context — a child's birthday, a family holiday, a joint spending category — as something the app understands at the household level, not something duplicated per user. This has real data-model implications and should be a first-class decision, not a retrofit (see Roadmap and Open Risks).

## The four pain points

1. **The labeling tax.** Every mainstream budgeting app's core loop is "connect bank → categorize → maintain." That's a data-cleaning pipeline disguised as a personal-finance feature, and it's the user's problem to run, forever. People don't want to be obsessed with their data; they want to know what it means.
2. **Small-payment blindness.** A £4 coffee, a £12 subscription, a £30 impulse buy — none of these register as consequential in the moment, but in aggregate over a year they're real money. Nobody naturally does that math for themselves.
3. **No comparative context.** "I spent £X" is a fact. "Is £X normal for a family of four in Zone 2 London" is the actual question, and no raw-numbers dashboard answers it. This is the single question the founder personally keeps asking ChatGPT by hand today.
4. **No bridge from insight to action.** Even when someone sees a leak, they don't know what it *means* for their future — a vague "spend less" isn't motivating. Showing that a recurring £50/month leak, redirected into a savings pot, compounds into a specific number a year from now is what turns awareness into action.

## The promise

**Near-zero effort.** You connect an account or upload what you have. Max organizes it, makes reasonable approximations where the data is messy or incomplete, and gets more useful the more it has — but it never makes categorization your job, and it never blocks value behind a setup wizard. The name is literal: the goal is to maximize the benefit you get, even if you're the least financially engaged user imaginable, even if all you can spare is ten pounds a week. Max is for the mean, not the enthusiast.

## The four pillars

**1. A dynamic, forgiving data model.** Doesn't require a fixed category taxonomy or complete data to be useful (the existing spreadsheet model this was bootstrapped from already proves this instinct: free-text tags instead of a rigid category list, works with whatever detail the user happens to record). The more data it has, the sharper it gets — but it produces a useful answer from day one with partial, messy input, using approximation rather than demanding completeness.

**2. Connections — bank and web.** Bank/Open Banking integration for real transaction data over time (later phase; see Roadmap). Web access for the qualitative, comparative layer: cost-of-living data, local pricing, what "normal" looks like for someone in this situation and this place — the thing a dashboard of your own numbers alone can never tell you.

**3. A financial-context layer.** An analyst-style layer that takes the raw numbers — however small — and puts them in context: how they compare, what they're trending toward, what they could become if redirected. This is what turns "you spent £50 on X" into something a non-expert can act on.

**4. A conversational orchestration layer with memory.** No configuration forms, no "how many dependents do you have" onboarding wizard — context is built the way a person would build it, through conversation, over time. When the user mentions a fact worth remembering (a kid's birthday, a bad month, an upcoming holiday), a middleware layer decides what's worth persisting *before* the conversational response is generated, so the app accumulates a real picture of the user's life and can plan around it later ("your son's birthday is next month — want to start setting aside £10/week now?"). This layer is also what makes the app proactive rather than passive: it can initiate ("you're overspending on groceries versus last month — here's one thing that might help"), not just answer when asked.

## Design principles

- **No onboarding forms.** Context is gathered conversationally, over time, not through upfront configuration.
- **Insight over decoration.** Charts are a means, not the point — several existing budgeting apps lean on visualization as if that were the value; the value is the sentence a human would say after looking at the chart. Always ask "would this actually help this specific low-effort user," not "is this what budgeting apps usually have."
- **Small, singular actions.** One digestible nudge at a time (in the spirit of Monzo's round-up-style micro-savings), not a wall of recommendations.
- **Illustrative, never prescriptive.** Compound-growth projections and "here's what this could become" framing are motivational tools, not personalized financial advice — language and product framing need to stay clearly on the "information" side of the UK FCA's advice/guidance boundary. See Open Risks.
- **Web and mobile parity as a standing constraint.** Every feature has to be designed so it works on both from the start, even though the MVP ships as a web app first for iteration speed.

## What Max is explicitly not (for now)

- Not a robo-advisor or investment platform — it illustrates, it doesn't execute trades or recommend specific products.
- Not a bill-pay or money-movement tool.
- Not trying to be the most powerful/configurable budgeting tool on the market — the enthusiast/power-user segment (YNAB's audience) is not who this is for.
- Not requiring a bank connection to be useful on day one.

## How we'll know it's working

- Users who never manually categorize a single transaction but still describe the app as "getting" their situation.
- Retention driven by the app reaching out (a nudge, a check-in) rather than the user remembering to open a dashboard.
- Users taking the small suggested actions (not just reading them) — this is the real signal that "insight" is translating into "behavior change," which is the actual point.

## Open risks to resolve deliberately, not by accident

1. **Regulatory boundary (UK FCA).** Confirmed sharper by research (see Competitive Analysis): the FCA's Advice Guidance Boundary Review (rules finalized Feb 2026) created a new **"targeted support"** tier between generic guidance and full advice — and Lloyds is deliberately engineering its own agentic assistant to stay inside guidance. Any Max feature implying a specific action on specific money (the compound-growth "invest this leak" framing especially) needs to be scoped to guidance or targeted-support standards *as a product-copy decision*, not a legal cleanup after launch.
2. **Trust as the core product.** Bank data plus an accumulating personal memory graph is an unusually deep trust ask from a new, unproven product. One "creepy" or careless moment could be disproportionately damaging for exactly the anxious, avoidant users this is built for.
3. **Cold-start value without a bank connection.** Spreadsheet/manual upload is a smaller addressable surface than "just open the app" — decide deliberately whether it's a permanent tier or a bridge.
4. **Household vs. individual data model.** Shared context (kids, joint spending) needs a real design decision, not a retrofit after the fact.
5. **Grounding, not hallucinating, comparative claims.** "Is this normal for a family of four in London" needs a real, citable source behind it — a fabricated benchmark is a worse failure here than almost anywhere else in the product, because it's the exact question the whole pitch is built around.
6. **The moat — confirmed, not hypothetical.** Competitive research found **Cleo already ships this**: Cleo 3.0 (mid-2025) launched persistent memory and proactive, unprompted insights; Cleo Autopilot (early 2026) goes further and auto-executes savings adjustments. Lloyds is building an agentic assistant for its 21M UK customers. The "remembers your life and checks in on you" pitch alone is not a moat — it's a race Cleo is already winning. What competitive research found *nobody* has, in the UK or elsewhere: real contextualized peer/cohort comparison ("is this normal for someone like me"). That combination — not the conversational-memory layer in isolation — is the actual bet. See Competitive Analysis for the full breakdown.
7. **Monetization path, decided early even if not launched early.** Mint (shut down 2024) and Money Dashboard (UK, shut down 2023) both failed on business-model sustainability, not product quality — and both served close to this exact user profile (low engagement effort, budget-conscious, subscription-averse). The team should form a point of view on bundled-subscription vs. embedded/platform vs. attached-financial-product monetization early, since it shapes which V2/V3 features are worth prioritizing, even though pricing itself is explicitly deferred.
