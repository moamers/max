# Max — working agreement for agents

Max is a personal finance app for people who avoid looking at money because it
feels like judgement. It is not a budgeting app that happens to be gentle; the
tone constraints are the product, and they are enforced in code.

**Read [`docs/product/08-contributor-guide.md`](./docs/product/08-contributor-guide.md) before starting.**
It says what is built, what is next, and gives you a self-contained brief per task.

---

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · Drizzle ORM +
`postgres` → Supabase Postgres · deployed on Railway · vitest.

> ⚠️ **This is not the Next.js you know.** APIs, conventions and file structure
> differ from your training data. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing App Router, font, form or
> Server Action code. Note `proxy.ts` replaces `middleware.ts`.

## The four gates

Every change must leave all four clean. No exceptions, no "will fix in the next pass".

```
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

---

## Non-negotiables

**1 · Every data query is scoped to a user.**
Exported functions in `src/lib/store.ts` take a branded `UserId` first. A query
that forgets to scope is a *compile error*, not a runtime check. Never add an
unscoped variant — not private, not "just for admin". Ownership lives on
`periods.user_id`; child tables reach it by joining back.

**2 · Never compute a bar's width or colour.**
`src/components/ui/Bar.tsx` implements the one chart grammar: the track is the
budget, the fill is spend, the whole fill turns red at 100% when over, magnitude
lives in the *number* and never in bar length. If you find yourself calculating a
percentage for a bar, you are doing it wrong.

**3 · Labels are the user's own words.**
Never normalise, lowercase, autocorrect or map a label onto an internal
vocabulary. Free text in, verbatim out.

**4 · User-facing copy passes the tone gate.**
`src/lib/tone.ts` rejects a banned vocabulary (overspending, waste, should have,
bad habit, behind, failed, too much…). The design's copy is final and already
passes. If you write new copy, check it.

**5 · A number the user can't trace is a number they have to take on faith.**
This parser has misread real data twice (`F-1`, `F-3` in
`docs/00-open-decisions.md`). Both were caught by making a figure openable, not
by reading code. Keep provenance attached to figures.

**6 · The model may judge structure; it must not do arithmetic it then states.**
Structural judgement is emitted as an inspectable plan; deterministic code
applies it. See `T-2` in `docs/principles/03-technical-principles.md`.

**7 · Do not apply database migrations.**
Write `.sql` files into `drizzle/` with the next ordinal. A human applies them.
Migrations must carry rows across, never rebuild them, and should abort rather
than guess.

**8 · No new dependencies** without saying so explicitly and justifying it.

---

## Working conventions

- **The design handoff is the specification**, not a mood board:
  `docs/design/handoff/README.md`. Copy in it is final — use it verbatim.
- **Do not read the two `.dc.html` prototypes whole** — they are ~117KB each and
  will flood your context. `grep` them for a specific value. `support.js` is
  prototype runtime, not design; ignore it.
- **Routes are the seam between workstreams.** Screens link to each other by
  route, never by importing another workstream's components. The route map is
  pinned in `docs/product/07-v1-delivery-plan.md §3a` — match it exactly.
- **Use the existing primitives** in `src/components/ui/`. If one is missing
  something, extend it or say so — do not build a parallel version.
- **Stay inside the files your task owns.** If you need a change elsewhere, say
  so in your report rather than making it.

## Doctrine

`docs/principles/` holds numbered, executable doctrines — each with a rule, a
mechanical test, a compliant and a violating example. They outrank features:
if a feature conflicts with a doctrine, the feature is wrong. Precedence is
`SAFETY > LEGAL > TRUTH > USER AUTHORITY > TONE > METHOD > HELPFULNESS`.

Cite doctrine IDs in comments where they explain a non-obvious choice.

## Reporting

End with a short, blunt report: what you built, what you deviated from and why,
any file outside your ownership you touched, and **anything you are not
confident is correct**. An overstated report is worse than a gap — someone will
review this against real financial data.
