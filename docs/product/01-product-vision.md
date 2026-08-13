# Max — Product Vision

*See also: [Creative Design Brief](./02-creative-brief.md) · [Competitive Analysis](./03-competitive-analysis.md) · [Roadmap](./04-roadmap.md) · [V0 Implementation Plan](./05-v0-implementation-plan.md)*

## The belief this is built on

You can't improve what you don't measure. Almost everyone agrees with that in the abstract and almost no one does it for their own money — not because they don't care, but because every tool that helps you measure your finances demands a second job first: categorizing, labeling, cleaning up merchant names, uploading receipts. The tool asks the user to do the data engineer's work before it will do the finance person's work. Most people quit at that first step. Some — including people who *like* budgeting, who keep a spreadsheet, who are the target customer on paper — quit anyway, because the ritual of cleaning your own data is tedious even when you don't mind the underlying subject.

Max exists to remove that first job entirely, and to replace it with something a low-effort, low-financial-literacy user will actually keep using: a companion that organizes what it can, approximates what it can't, and talks to you about what it finds — instead of handing you a dashboard and leaving you to interpret it.

## Who this is for

### The reframe that matters

The industry calls this problem "financial literacy," and that framing is wrong — or at least, wrong for our user. **The primary barrier is not a knowledge deficit. It is avoidance.** Plenty of people who would score perfectly well on a financial-literacy test still do not look at their own money, and they don't look precisely *because* looking feels bad: it invites judgement, guilt, and a sense of being behind. Treating that person as under-informed and shipping them more information makes it worse.

The belief we're arguing against, held by the user themselves, is: **"the less I know, the better."** That's not laziness — it's a rational defence against an experience that has historically felt like being told off. The entire product exists to invert it into "the more I know, the better," and the only way that inversion works is if knowing is genuinely painless and genuinely non-judgemental. Every design decision downstream serves that.

### Persona 1 — The Avoider

*Modelled on the founder's wife.* May well be numerate, capable, and perfectly good with money in practice — and still chooses not to look. Financially **avoidant, not illiterate** (though the persona also covers those who are both; the difference between them is tone and vocabulary, not product). Doesn't want anyone on her case. Responds badly to being tracked, corrected, or nagged. Has probably tried a budgeting app and abandoned it, not because it failed but because it turned money into homework and made her feel monitored.

What she needs: to find out where she stands without a confrontation, and to be left alone unless there's something genuinely worth saying.

### Persona 2 — The Pressured Provider

*Modelled on the founder himself.* Dependents, real financial pressure, but not in crisis — not burning cash, not in debt. Needs **rigour**, not rescue. Actually likes the idea of budgeting, maintains a spreadsheet, and *still* won't do the labeling ritual, which tells you something important: the labeling tax repels even motivated users. His question isn't "am I in trouble," it's *"I have kids, I'm spending this much, and I don't know where to squeeze."*

What he needs: to see where the slack actually is, and help sequencing decisions across months.

### What separates the personas — and what doesn't

The **product** is the same for both. The **tone and vocabulary** differ, and Max should infer which register to use from how the person talks and behaves — never from an onboarding quiz. Both personas share the two things that define the market opportunity: neither will do data-entry work, and both want to know how they compare to people like them.

### Household, not just individual

Several core use cases (a spouse, kids, a family holiday, a child's birthday) are inherently *household* finance. Shared context should be understood at the household level, not duplicated per user. This needs deciding before memory data accumulates in a shape that's painful to migrate (see Roadmap V2).

## The four pain points

1. **The labeling tax.** Every mainstream budgeting app's core loop is "connect bank → categorize → maintain." That's a data-cleaning pipeline disguised as a personal-finance feature, and it's the user's problem to run, forever. People don't want to be obsessed with their data; they want to know what it means.
2. **Small-payment blindness.** A £4 coffee, a £12 subscription, a £30 impulse buy — none of these register as consequential in the moment, but in aggregate over a year they're real money. Nobody naturally does that math for themselves.
3. **No comparative context.** "I spent £X" is a fact. "Is £X normal for a family of four in Zone 2 London" is the actual question, and no raw-numbers dashboard answers it. This is the single question the founder personally keeps asking ChatGPT by hand today. It extends past benchmarks into **local savvy**: someone new to a city doesn't know which shops, areas, or providers are the good-value ones, and that knowledge is worth more than another chart.
4. **No bridge from insight to action.** Even when someone sees a leak, they don't know what it *means* for their future — a vague "spend less" isn't motivating. Showing that a recurring £50/month leak, redirected into a savings pot, compounds into a specific number a year from now is what turns awareness into action.
5. **No help with sequencing decisions over time.** Real financial life is a scheduling problem, and no budgeting app treats it as one. The founder's own example: *deciding which month to make a purchase*, given a holiday in August, credit-card clearing in September, and a child's birthday in October — concluding October, and wanting to log the intention months ahead so the money is already being set aside. Every mainstream app is **retrospective**: it tells you what you did. Almost none help you decide **when** to do the next thing. This is a distinct, under-served capability and it depends on the memory layer (knowing the birthday exists) plus a forward-looking data model (periods that haven't happened yet).

## The promise

**Near-zero effort.** You connect an account or upload what you have. Max organizes it, makes reasonable approximations where the data is messy or incomplete, and gets more useful the more it has — but it never makes categorization your job, and it never blocks value behind a setup wizard. The name is literal: the goal is to maximize the benefit you get, even if you're the least financially engaged user imaginable, even if all you can spare is ten pounds a week. Max is for the mean, not the enthusiast.

## The four pillars

**1. A dynamic, forgiving data model — and effortless capture into it.** The model is time-boxed rather than transaction-boxed: the atom is *a week of living and what it cost*, not a classified purchase. That single inversion is what removes the labeling tax structurally rather than cosmetically, and it's why the model survives estimated, partial, or remembered input. **Capture is half of this pillar and is currently missing from what's built:** the interface must accept a spreadsheet, a statement, a screenshot, typed text, or speech, and Max maps it into the model itself — asking a short question when genuinely unsure, never handing back a queue of things to classify. Adding a week of data should feel like texting a friend. This is important enough to have its own document: see [The Data Model](../architecture/01-data-model.md).

**2. Connections — bank and web.** Bank/Open Banking integration for real transaction data over time (later phase; see Roadmap). Web access for the qualitative, comparative layer: cost-of-living data, local pricing, what "normal" looks like for someone in this situation and this place — the thing a dashboard of your own numbers alone can never tell you. Note that multi-source ingestion (statement, screenshot, text) is deliberately *not* gated behind a bank connection — competitive research found every major rival, including Cleo and ChatGPT's finance tools, is Open-Banking-gated, which makes this the cheapest way in for anyone unwilling to hand over bank credentials to a new app.

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
