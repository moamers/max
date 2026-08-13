# Max — V0 Implementation Plan

*See also: [Product Vision](./01-product-vision.md) · [Creative Design Brief](./02-creative-brief.md) · [Roadmap](./04-roadmap.md)*

Scope: close the gap the Roadmap identifies between what's built today (a working but chart-first dashboard) and what V1 actually requires (a narrative-first, "a friend would say this" experience). This is a presentation-layer change on top of data that's already computed correctly — no new infrastructure, no LLM, no new backend work.

## Why this is the right next step, not a bigger one

It would be tempting to jump straight to V2's conversational layer — it's the more exciting part of the vision. But the Roadmap's V1 exit test is specific: someone outside the founder's own head uploads a real spreadsheet and describes back what the app told them, in their own words. That test can't pass today, because today's answer is a bar chart and four percentage tiles — exactly the pattern the Product Vision argues nobody is won over by. Fixing that is small, concrete, and doesn't require deciding anything about memory, LLMs, or bank connections first.

## What to build

**1. An insight-sentence generator (`src/lib/narrative.ts`).** A pure function taking the existing `InsightsResponse` (from `src/lib/insights.ts`, already computed correctly and verified) and producing an ordered list of plain-language sentences — not every metric turned into a sentence, but the 2-3 *most notable* ones, picked by which deltas are largest in absolute or relative terms. Examples of the shape (exact wording to be refined against the Creative Brief's voice guidelines):
   - "You spent about £150 more on groceries this period than your usual."
   - "Your biggest spend this period was on {tag} — £X across {N} transactions."
   - "You kept about £X this period, {more/less} than your average."

   This reuses the tag breakdown (`tagBreakdownForPeriod`) and the metrics already computed by `computeInsights` — no new data pipeline needed, just a new way of describing numbers that already exist.

**2. Redesign the dashboard around the sentences, not the chart.** Headline sentences become the primary, first-seen content — large, readable, close to how a text message reads. The existing stat tiles and stacked-bar chart move below as supporting detail for someone who wants to dig in, not the thing you see first. The tag breakdown table becomes the natural backing detail for "your biggest spend was X."

**3. Add free-text capture.** A single input where the user can type "spent about 80 on the shop this week, 40 on petrol" and have it land in the model. Parsed deterministically at this stage (simple patterns — amount + envelope keyword + optional week), *not* via an LLM, keeping V0 free of model dependencies. This is the smallest possible test of the [data model's](../architecture/01-data-model.md) central claim that adding data should feel like texting a friend rather than filling in a form — and it's the difference between a spreadsheet viewer and something a person could actually use weekly.

**4. Keep everything else as-is.** Upload flow, backend, data model, deployment — all already working and don't need to change for this step. This is deliberately scoped tight.

## Tone constraints that apply even here

The sentences are templates, not model output, but they are still the first thing Max ever says to anyone. From [Agent Behaviour §8](../principles/01-agent-behaviour.md):
- No moralising vocabulary — never "overspending", "wasting", "should have".
- No verdict on open, no red totals, no unrequested "you spent £X this month".
- Prefer trade-off framing ("the weekends have been bigger lately") over deficit framing ("you're over budget").
- Where a comparison to the user's own history is flat or noise-level, say nothing rather than manufacturing an observation.

## Explicitly not in V0

- No LLM call, no conversational interface — the sentences are template-generated from numbers we already compute, not model-generated. (That's V2.)
- No memory, no persistence of anything beyond what's already stored.
- No bank connections, no cohort/peer comparison against other people — still self-comparison only.
- No new account/auth system.

## Acceptance test

Not a unit test — a real one: get the founder's actual spreadsheet (or a close family member's) through the upload flow, and see whether the resulting page reads like something a person would say out loud, unprompted. If it still reads like a finance app, the sentence templates need another pass before moving on to V2.

## Rough sequence

1. Draft 4-6 sentence templates covering the metrics already available (fixed/variable/weekly spend delta, net position delta, top tag by spend) and check them against the Creative Brief's voice table and the tone constraints above.
2. Implement `narrative.ts`, picking the top 2-3 sentences by notability rather than rendering all of them — and saying nothing when there's nothing notable.
3. Rework the dashboard page layout: sentences first, tiles/chart demoted below.
4. Add the free-text capture input and a `POST /api/entry` route that maps parsed input into the existing period/envelope model.
5. Deploy, verify with real data (not just synthetic test data) — this is the point where the founder's own spreadsheet should go through the real flow.
6. Revisit against the Roadmap's V1 exit test before starting any V2 work.

## Housekeeping

Two synthetic test periods ("Jul 6th - Aug 2nd", "Aug 3rd - Aug 30th") are currently sitting in the live Supabase database from verification runs and should be deleted before real data goes in.
