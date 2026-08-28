# Delegating the LLM layer, screenshot capture, and field autocomplete

*The prompt to paste, the briefs to paste after it, and which can run together.*

---

## 1 · What this covers

| Task | Effort | Runs with | Owns (writes) |
|---|---|---|---|
| **H · LLM layer + screenshot capture** | High | *nothing, ideally* | `src/lib/llm/**`, `src/app/api/llm/**`, `src/app/add/**`, `src/app/transaction/[id]/**`, `src/components/capture/CaptureButton.tsx` (new), `.env.example` |
| **I · Autocomplete on Where and label** | Medium | H, with a hard boundary | `src/components/capture/TextField.tsx`, `src/components/capture/LabelField.tsx`, `src/components/capture/suggestions.ts` (new), `src/lib/queries/suggestions.ts` (new) |

**Run H first, then I.** Both land near the add/edit transaction screens, and H
is the one with the architectural decisions in it.

They *can* run together, but only under one rule: **task I never opens
`AddView.tsx` or `TransactionView.tsx`.** Its two field components must fetch
their own suggestions rather than receive them as props from a parent, or the
two agents will collide on the same file. If that constraint is awkward, run
them sequentially instead — it is not worth the merge.

### Why H is shaped the way it is

The screenshot reader is the **first** LLM feature, not the only one. Asking
questions about a month's spending is coming next. So the integration is built
as a general capability with the screenshot as one caller — not as a
screenshot endpoint with a model behind it. A brief that only says "read a
receipt" will produce something that has to be torn out in a month.

---

## 2 · The prompt

Paste the block below, then append **one** task brief from §3.

````
You are contributing to Max, a personal finance web app. Repo:
https://github.com/moamers/max

## Branching — read carefully
Branch from **`claude/budget-app-spending-insights-i5fnch`**. That is the live
branch and the only current base.

    git fetch origin
    git checkout -b codex/<short-task-name> origin/claude/budget-app-spending-insights-i5fnch

Commit your work, push your branch, and tell me the exact branch name when you
are done. Do not open a pull request.

**Do not push to any branch other than your own**, and never to
`claude/budget-app-spending-insights-i5fnch` — that branch is wired to automatic
deployment, and pushing to it ships unreviewed code and burns build credit.
`main` and `v1/integration` are both stale; ignore them entirely.

**Check the base before you write anything.** Run these three and confirm all
three agree with what this brief says:

    git fetch origin
    git branch -r                                   # the base branch exists
    git log --oneline -3 origin/claude/budget-app-spending-insights-i5fnch
    git status                                      # you are on YOUR branch, clean

If any of it does not match — the branch is missing or renamed, the fetch
fails, you cannot authenticate, the history looks unrelated to what the brief
describes — **stop and ask me which branch to use. Do not guess, do not fall
back to `main` or `v1/integration`, and do not start work on a base you are not
sure about.** Both of those branches are stale; work built on them will conflict
on every file when it comes back. One question costs a minute; the wrong base
costs the whole task.

**Before you push, fetch again.** If the base has moved while you worked, rebase
your branch onto it, re-run all four gates, and say in your report that you
rebased and onto what. If the rebase produces a conflict you cannot resolve with
confidence, **stop and ask me** — describe the conflicting files rather than
picking a side. A conflict resolved wrongly in this codebase is a money bug.

A note on git, because this went wrong once: a branch moving forward to include
your commit is a **fast-forward**, which is normal and loses nothing. Do not
diagnose it as damage and do not propose a force-push to "repair" it. If
something about the repository state looks wrong, describe what you observe and
stop — do not rewrite history.

## Read these first, in this order
1. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/AGENTS.md
   — the rules every change must follow. Non-negotiable.
2. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/product/08-contributor-guide.md
   — what is built, what is next, and the traps that have already cost real
   time.
3. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/design/handoff/README.md
   — the design specification. Copy in it is final; use it verbatim.
4. https://github.com/moamers/max/blob/claude/budget-app-spending-insights-i5fnch/docs/00-open-decisions.md
   — every unresolved question, and two real parser defects worth understanding.

Doctrines live in
https://github.com/moamers/max/tree/claude/budget-app-spending-insights-i5fnch/docs/principles
— skim, and consult when a choice feels arbitrary. Precedence is
SAFETY > LEGAL > TRUTH > USER AUTHORITY > TONE > METHOD > HELPFULNESS.

## Context rules — these matter
- **Do NOT open the two `.dc.html` files whole.** They are ~117KB each and will
  consume your context before you write a line. `grep` them for a specific
  value the design README doesn't give. `support.js` is prototype runtime, not
  design — ignore it entirely.
- This is **Next.js 16** and it differs from your training data. Read the
  relevant guide in `node_modules/next/dist/docs/` before writing App Router,
  form or Server Action code. `proxy.ts` replaces `middleware.ts`.
- Use the existing primitives in `src/components/ui/`. Do not build parallel
  versions.
- **There is one money formatter**, `src/lib/money.ts`. A source scan
  (`src/lib/__tests__/one-money-formatter.test.ts`) fails the build if any other
  file formats a pound figure. Import it; do not write a local `gbp` helper.
- Every exported function in `src/lib/store.ts` takes a branded `UserId` first.
  Never add an unscoped variant. Ownership lives on `periods.user_id`; child
  tables reach it by joining back.
- **Never write to the database from a keystroke.** A controlled input's
  `onChange` fires per character; a server action there means a write and a
  route revalidation each time. This took production down once. Enforced by
  `src/lib/__tests__/no-write-per-keystroke.test.ts`. The same caution applies
  to *reads*: do not fetch per keystroke either.
- **Navigation into a period-scoped route carries `?period=`.** Enforced by
  `src/lib/__tests__/period-travels-with-the-link.test.ts`. Use the helpers in
  `src/lib/routes.ts` rather than building URLs by hand.
- Do not apply database migrations. Write `.sql` into `drizzle/` with the next
  ordinal number and say so in your report.
- No new npm dependencies without justifying it explicitly in your report.

## Definition of done
All four must be clean before you push:

    npx tsc --noEmit
    npm run lint
    npx vitest run
    npm run build

Add tests for anything with real logic. **No test may make a real network
call** — mock the provider at the module boundary.

## Stay in your lane
Only write the files your task lists as owned. If you need a change elsewhere,
put it in your report instead of making it. Another agent may be working in
parallel in this repo, branched from the same commit, and neither of you can
see the other's work. Do not promote, relocate or "tidy" a file that is not
yours.

## Report back
Short and blunt: the branch name, what you built, what you deviated from and
why, any file outside your ownership you touched, and — most importantly —
anything you are NOT confident is correct. An overstated report is treated as a
defect; this code handles someone's real money. "I could not verify X against
real data" is a good line in a report, not a gap.

**If your task makes a network call or a write, say in your report when it
fires and how many happen per user action.** "On every change" is an answer
that needs justifying, not a description.

## Your task
[paste one brief from below]
````

---

## 3 · Task briefs

Never put both briefs into a single session. An agent given two tasks
interleaves them, and the ownership boundary stops meaning anything.

---

### Task H · The LLM layer, and screenshot → transaction as its first caller

```
Build a general LLM integration for Max, and ship one feature on top of it:
reading a transaction screenshot into the add/edit form for the user to confirm.

Own: src/lib/llm/**, src/app/api/llm/**, src/app/add/**,
src/app/transaction/[id]/**, src/components/capture/CaptureButton.tsx (new),
.env.example

## Part 1 — the integration, built generically. Do this first.

This is the part that matters. The screenshot reader is the FIRST LLM feature,
not the only one. The next is conversational: asking questions about a month's
spending ("what did I spend on transport in July", "why is this month higher").
Build for that now, or it gets rebuilt.

Provider: the OpenAI API. Key in `OPENAI_API_KEY`, model in an env var, both
read SERVER-SIDE ONLY. The key must never reach the browser, never appear in a
client component, and never be inlined by the bundler — no `NEXT_PUBLIC_`
prefix, ever.

Requirements for the layer:

- **A provider-agnostic interface.** Something like `src/lib/llm/provider.ts`
  defining the contract, `src/lib/llm/openai.ts` implementing it. Adding a
  second provider later must be a new file plus a config value, not a rewrite
  of the callers. The interface — not the OpenAI SDK's types — is what the rest
  of the app imports.
- **It must support, from day one:** a system prompt, multi-turn message
  history, image input, JSON-shaped output, and streaming text. You are not
  building the chat feature, but an interface that cannot express a streamed
  multi-turn conversation is the wrong interface, and you will only find that
  out after it is load-bearing.
- **Capabilities live above the client.** `src/lib/llm/capabilities/` holds one
  module per feature — `extract-transaction.ts` is the only one you write. Each
  owns its own prompt, its own output schema, and its own validation of what
  came back. No prompt text lives in the client module.
- **Everything the model returns is untrusted input.** Validate the shape,
  clamp the numbers, reject what does not fit, and never pass a model's string
  into a query or a redirect unvalidated. Treat a malformed response as a
  failure the user can retry, not as an exception that reaches them raw.
- **One route: `POST /api/llm/extract-transaction`.** `requireUser()` first —
  no anonymous access, no exceptions. MIME allowlist and a size cap; mirror the
  pattern already in `src/app/api/upload/route.ts`. The route returns a draft
  and NEVER writes to the database.
- Config, cost ceilings and the model name are values, not literals scattered
  through the code. Put them in one place with the env vars documented in
  `.env.example`.

## Part 2 — the capture control

Where: the add transaction screen (`/add`) and the transaction editor
(`/transaction/[id]`). Both.

The user taps a control and gets the **native phone sheet** offering Photo
Library, Take Photo, and Choose File.

- On iOS that is `<input type="file" accept="image/*">` with NO `capture`
  attribute. Adding `capture="environment"` opens the camera directly and
  REMOVES the choice — the opposite of what is wanted here. Verify this on a
  real iPhone before you call it done; a desktop browser will not show you the
  difference.
- iPhones produce **HEIC**. Safari usually converts on upload, but not always,
  and not in every context. Decide what happens when a HEIC arrives, and say in
  your report what you decided and how you tested it. Silently failing on the
  format the target device produces by default is not acceptable.
- Show progress. Reading an image takes seconds, and a control that appears to
  do nothing gets tapped again.

### Which files are allowed, and where that is enforced

Accepted: **PNG, JPEG, WebP, and HEIC/HEIF**. Nothing else in this version — no
PDFs, no multi-page documents. Say so in the interface rather than letting
someone find out by failing.

Enforce it in three places, because they do different jobs:

1. **The `accept` attribute** narrows what the native picker offers. This is a
   convenience, **not a security boundary** — it is trivially bypassed and some
   pickers ignore it. Never treat it as validation.
2. **A client-side check before upload**, so someone who picks a 40MB video or
   a PDF is told immediately instead of waiting through an upload to be
   rejected. Check type and size.
3. **The server route is the real gate.** Validate independently of anything
   the client claimed. Do not trust the `Content-Type` header or the file
   extension — both are attacker-controlled and a renamed file declares
   whatever you like. **Check the leading bytes** against the formats above and
   reject on mismatch. The route must be safe when called directly with curl,
   because it will be.

An oversized or wrong-type file is rejected with a plain sentence naming what
Max can read, and the user stays on the screen with their form intact.

### Every way this fails, and what the user sees

A control that only works when everything works is not finished. Handle each of
these explicitly — a plain sentence, the form still intact, and a way forward.
No stack trace, no raw provider error string, no dead end, and never a spinner
that never stops.

| What happened | What the user gets |
|---|---|
| Wrong file type or too large | Rejected before upload, naming what Max can read |
| No network, or the upload drops | Say so, offer to try again — nothing is lost |
| The provider is slow | A timeout you set, not one the browser picks. Then retry or type it by hand |
| The provider errors or rate-limits | A plain sentence and a retry. Never surface the provider's own message |
| The response is malformed or fails validation | Treat as "could not read this", not as a crash |
| The image is legible but is not a transaction | Say Max could not find a transaction in it, and offer the form empty. **Do not invent a plausible one** |
| Some fields read, others not | Fill what was read, leave the rest empty, flag the row. Partial is normal, not failure |
| The user cancels the picker | Nothing happens. No error, no state change |

Typing it by hand must stay available throughout. The capture control is a
shortcut; it is never the only way in.

## Part 3 — what comes back, and what happens to it

The extraction returns a DRAFT. Nothing is saved. The user lands in the form
with fields filled in and completes or corrects them, exactly as if they had
typed it — the existing Add flow, pre-populated.

Fields to extract: merchant, amount, date if visible, and a suggested
kind/category. Return a per-field confidence.

The Add screen already accepts a prefilled draft via query params — read
`src/app/add/page.tsx`, it handles `where`, `label`, `category`, `kind`, `week`
and `period` today. **`amount` is missing; add it.** Use the existing seam
rather than inventing a second one.

Four rules that are not negotiable, each with a doctrine behind it:

1. **The model extracts; it never calculates.** It may read "£12.65" off the
   image. It must not sum lines, convert a currency, apply a tip, or compute a
   total it then states. If the amount is not legible, the answer is "I could
   not read it", not a derived number. (AGENTS.md non-negotiable 6.)
2. **The merchant name goes in verbatim.** No title-casing, no expanding
   abbreviations, no mapping onto a tidy vocabulary. "SAINSBURYS S/MKT" stays
   "SAINSBURYS S/MKT" unless the user edits it. (Non-negotiable 3.)
3. **Anything uncertain arrives flagged, not guessed.** The `transactions`
   table already has `needs_attention` and `attention_reason` for exactly this.
   Low confidence on a field means the row arrives as "needs a look" with a
   plain-English reason. A category the model is unsure of is left empty, not
   filled with its best guess. (Non-negotiable 5.)
4. **Provenance is attached.** Put the text the model read into `raw_import` so
   the figure can be opened up later. A number the user cannot trace is a
   number they have to take on faith.

Any copy you write passes the tone gate in `src/lib/tone.ts`. Run it.

## Part 4 — spending real money, so it must be countable and bounded

This runs on prepaid credit. The provider's dashboard shows the total; it will
not tell you *which* feature spent it, and it will not stop a bug.

- **One call per user action. No automatic retries.** If a call fails, the user
  presses retry — the code never retries on its own, and never loops. An
  automatic retry on a failing provider is how a small balance disappears in an
  afternoon with nothing to show for it.
- **Log token usage per call** — prompt tokens, output tokens, which capability
  asked, and the resulting cost if the provider returns it. Server-side log
  line is enough; no new table. Without this the dashboard total cannot be
  reconciled against what the app actually did.
- **A per-request ceiling**, so one oversized image or a runaway response
  cannot cost a multiple of a normal call. Cap the output tokens and downscale
  the image before sending it — a phone screenshot is far larger than the model
  needs, and image size is most of the cost of this feature.
- **Sensible per-user throttling.** Not a quota system; just enough that a
  stuck finger or a retry loop in a flaky network cannot fire the same
  extraction fifty times.
- Say in your report **what one extraction costs** at the model you chose, and
  show the arithmetic — image tokens, prompt tokens, output tokens — so the
  number can be checked rather than believed.

## Part 5 — privacy, and the thing you must not decide alone

Uploading a screenshot sends the user's financial data to a third party. Max's
red lines (`docs/principles/02-ethics-and-red-lines.md`) cover dark patterns,
moralising and memory scope — **there is currently no red line about sending
financial data to a model provider.** That gap is real and it is the founder's
call, not yours.

What you must do:
- Tell the user, in the interface, before the first upload — plainly, once,
  where they will actually read it. Not buried in a settings page.
- Do not send anything that was not necessary for the task.
- The open question is already recorded as **A-9** in
  `docs/00-open-decisions.md`. Do not add a duplicate entry; if what you built
  changes the picture, say so in your report and leave the register to the
  founder.

Do not design a consent flow beyond a clear one-time disclosure, and do not
quietly ship without one.

## Testing
- The capability module's parse/validate/clamp logic is pure and testable —
  test it against fixture JSON, including malformed and adversarial responses
  (missing fields, a string where a number belongs, an absurd amount, prompt
  text echoed back as a merchant name).
- Mock the provider at the module boundary. No test makes a real API call.
- Test that the route rejects an unauthenticated request, an oversized file, a
  disallowed MIME type, and **a file whose declared type does not match its
  actual bytes** — a PDF renamed `.png` and sent as `image/png` must be
  rejected by the server, not by the picker.
- Test the failure table above where it is testable: provider timeout, provider
  error, malformed response, and a valid response containing no transaction.

## In your report
State the cost per extraction at the model you chose, and how many network
calls fire per user action.
```

---

### Task I · Autocomplete on the text fields

```
Add autocomplete to the free-text fields on the add/edit transaction form, so
returning to the same shop does not mean typing it again.

Own: src/components/capture/TextField.tsx,
src/components/capture/LabelField.tsx,
src/components/capture/suggestions.ts (new),
src/lib/queries/suggestions.ts (new)

DO NOT open src/app/add/AddView.tsx or
src/app/transaction/[id]/TransactionView.tsx. Another agent may be working in
those files. Your components must source their own suggestions rather than take
them as props from a parent — that constraint is what makes this task safe to
run alongside the other one.

## What
The "Where" field (merchant) and the label field. The user goes to the same
handful of shops constantly; the app already knows every one of them, because
they are in this user's own transaction history.

## The UX is yours to determine
There is no design for this in the handoff. Find the best answer for a
one-handed mobile form and say in your report what you chose and why. The
constraints it has to satisfy:

- It must never block typing something new. A suggestion is an offer, not a
  list to pick from. Free text in, verbatim out (AGENTS.md non-negotiable 3).
- It must not fight the phone keyboard's own suggestion bar, or hide behind it.
- It must not shift the layout as the user types.
- Selecting a suggestion inserts it EXACTLY as it was stored. No re-casing, no
  trimming into a canonical form, no merging near-duplicates. If the user has
  "Tesco" and "TESCO EXPRESS" in their history, those are two different things
  they wrote, and Max does not know better.
- Ranked by what is actually useful: how often, and how recently. Cap the list.
- Keyboard and screen-reader usable, not mouse-only.

## The performance rule — read this twice
Do NOT query the database per keystroke.

A controlled input's `onChange` fires per character. Calling a server action or
a route there means a round trip per letter, and revalidation on top of it.
That has already taken this app's production down once, and there is a test
that fails the build for the write case
(`src/lib/__tests__/no-write-per-keystroke.test.ts`).

The right shape is almost certainly: fetch this user's distinct merchants and
labels ONCE when the form mounts — it is a small list, tens of entries, not
thousands — and filter it in the browser as they type. Zero network per
keystroke. If you believe the list can grow large enough to make that wrong,
say so in your report with the number you based it on, and debounce properly.

## The query
`src/lib/queries/suggestions.ts`, scoped to a branded `UserId` like everything
else. Distinct non-null merchants and labels for that user, with a count and a
most-recent timestamp so the component can rank them. One query, or two — not
one per field per render.

## Testing
- Ranking and filtering are pure functions. Test them: frequency vs recency,
  ties, case-sensitivity (matching is case-insensitive; the INSERTED value is
  verbatim), empty history, a single entry, and an entry containing characters
  that would break a naive filter.
- Test that a user only ever sees their own history. Isolation is the one thing
  in this app that cannot be got wrong twice.

## Failure and empty states
- No history yet: the field behaves exactly as it does today. No empty
  dropdown, no "no suggestions" message, nothing to dismiss.
- The suggestions fetch fails: the field still works. Typing is never blocked
  by a failed lookup, and the user is not told about it — a missing convenience
  is not an error worth interrupting someone for.

## In your report
Say how many network calls fire per user action, and what happens on a form
where the user has no history at all.
```

---

## 4 · Open questions for the founder, not for the agents

1. **Sending financial data to a model provider** has no red line in
   `docs/principles/02-ethics-and-red-lines.md`. Task H writes the disclosure
   and records the gap; the policy itself is yours to set.
2. **Whether the screenshot reader is offered to other accounts**, or stays on
   yours while it is proven. It costs money per use and it sends data out.
3. **Which model, at what cost ceiling.** Both are single config values in
   task H's design, so this can be decided after you have seen it work. Set a
   hard spend limit in the provider's console as well — the code's ceilings and
   the account's ceiling protect against different mistakes.
