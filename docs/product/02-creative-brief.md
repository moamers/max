# Max — Creative Design Brief

*See also: [Product Vision](./01-product-vision.md) · [Agent Behaviour Principles](../principles/01-agent-behaviour.md) · [Competitive Analysis](./03-competitive-analysis.md) · [Roadmap](./04-roadmap.md)*

> **Note:** this brief covers brand, tone and visual direction. The *behavioural* doctrine — how Max coaches, when it escalates, what it does in a crisis — is a separate and more constrained document: [Agent Behaviour Principles](../principles/01-agent-behaviour.md). Read both before writing any user-facing copy.

For handing to a designer (human or agent). Extracted from the founder's own language and framing — the goal is to keep the tone that came through in conversation, not sand it down into generic fintech polish.

## Brand essence

**One line:** A financially savvy friend who's genuinely on your side — not a bank, not a spreadsheet, not a lecture.

**The name.** Max = maximize your benefit, even if you're the least financially engaged person imaginable, even if all you can spare is ten pounds. The name is a promise about who this is for, not a claim about power-user features.

## What Max is not (visually and tonally)

This matters as much as what it is. Max should look and sound like the opposite of:
- A "serious bank" — navy suits, austere navy/grey palettes, corporate stock photography of handshakes.
- A "financial wellness" app — clinical, soft-focus, vaguely therapeutic corporate-wellness tone that talks *at* the user.
- A power-user finance tool (YNAB, Excel-with-a-UI) — dense tables, a dozen configuration options visible at once, charts as the primary UI surface.
- Anything that could make a financially anxious, avoidant person feel judged, behind, or stupid for not already having this figured out.

## Personality (brand as a person)

If Max were a person, they'd be the friend who's genuinely good with money but never makes you feel bad about not being — the one you text "is this normal?" and who actually gives you a real, kind, direct answer instead of a lecture.

- **Warm, not clinical.** Talks like a person, not a compliance document. Encouraging by default, never guilt-driven ("you're overspending" framed as "here's a leak worth £600/year — here's what closing it could get you," not "you failed at budgeting this month").
- **Direct, not corporate.** Say the real thing plainly. No "financial wellness journey" euphemism. Closer to how the founder talks about this product than to how a bank talks about its app.
- **Confident, not condescending.** Knows the answer, states it clearly, doesn't pad it with disclaimers or hedge everything into mush. Confident like a good friend giving advice — not confident like a broker pushing a product (see the regulatory note in the Product Vision doc: confident in tone, careful and illustrative in actual claims).
- **Calm, not urgent/alarmist.** Never uses fear, red alert colors, or "you need to act now" pressure tactics as the primary motivator — the motivation is possibility ("here's what this could become"), not anxiety.
- **Light, not heavy.** Small nudges, one at a time. The product should never feel like it's asking for more attention or effort than the user has to give.

## Voice examples

| Instead of this (typical fintech voice) | Max sounds like this |
|---|---|
| "You have exceeded your grocery budget category by 23%." | "You're spending a bit more on groceries than usual — want to see where?" |
| "Complete your profile to get personalized insights." | (never asked directly — inferred from conversation over time) |
| "Congratulations! You've achieved a savings milestone!" | "That's £600 you didn't spend this year without even trying. Here's what it could grow into." |
| "Please categorize the following 14 uncategorized transactions." | (never happens) |

## Hard constraints on copy and layout

These come from research into financial avoidance and are non-negotiable, because they're the difference between an avoidant user opening the app again or not. Full reasoning in [Agent Behaviour §8](../principles/01-agent-behaviour.md).

**Banned vocabulary:** "wasting", "should have", "overspending", "bad habit", "you failed", "you're behind". Any word that converts information into a verdict.

**Banned layouts:**
- A red or negative total as the first thing on screen. The opening view must never be a judgement.
- Unrequested "you spent £X this month" aggregates — the classic avoidance trigger.
- Streaks, progress bars that break, or any mechanic that punishes a missed day.
- Leaderboards or "you spend more than N% of users" ranking.

**Required:** a visible, easy way to say *"not now"* or *"don't mention that again"* — and the design must make clear it will be honoured. For this persona, the ability to turn Max down is what makes Max safe to turn on.

**On comparison UI:** comparison is always **calibration**, never **ranking**. "That's normal for a household like yours" is the design target; anything that resembles a scoreboard is prohibited.

## Visual direction

**Charts are a last resort, not the interface.** The founder's explicit instruction: nobody who avoids budgeting apps is won over by a *better* pie chart. The primary interface surface should be conversational and text-forward — short, human sentences and a small number of clear numbers — with a chart only where it's genuinely the clearest way to show something (e.g. a trend over months), never as decoration or default. Look to how conversational products (not dashboard products) lay out a screen.

**Reference points named by the founder:**
- **Payhawk** — persistent conversational input at the bottom of the screen, coexisting with normal button-driven UI, so the agent is always one tap away without taking over the whole interface.
- **Monzo** — warm, playful, human brand tone; small delightful mechanics (the "round up and save" 1p-a-day style feature) that make saving feel light rather than like a chore.

**Mood:** warm, approachable, a little playful, calm. Generous whitespace over dense data surfaces. Color palette should read as friendly and optimistic rather than "financial institution serious" — think warmer, more human tones than the navy/teal that dominates fintech, without tipping into juvenile. Typography should feel conversational and legible at small sizes (a lot of the experience is short chat-style text), not a display/editorial face.

**Iconography/imagery:** favor simple, warm, human-feeling marks over literal finance iconography (piggy banks, dollar signs, bar charts as logos). The visual identity should feel more like a companion/assistant brand than a banking brand.

## Cross-platform constraint

Every screen and component needs to work on both a phone-sized screen and a desktop browser from the start — the MVP ships web-first for iteration speed, but nothing should be designed in a way that assumes desktop-only or requires native-only interaction patterns. The conversational-input-at-the-bottom pattern in particular needs to work naturally on mobile web, since that's the primary real-world context for a lot of this app's use (checking in on spending is a phone-in-hand moment, not a sit-down-at-a-desk moment).
