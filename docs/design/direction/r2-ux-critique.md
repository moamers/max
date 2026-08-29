# R2 · UX cross-critique — D3

**Author:** D3, Product / UX Design Director. Round 2, having read
`r1-creative-direction.md`, `r1-motion-grammar.md`, `r1-orchestrator-corrections.md`,
and D2's `r1-motion-demo.html`.

Read in this order. §1 changes the shape of my R1 proposal and everything after it
depends on that change.

---

## 1 · The scrubber: withdrawn as a mechanic, defended as a payload

**I withdraw the horizon scrubber as a distinct control. It was the wrong mechanic
and I was wrong to invent it. I hold the content model it carried, and I want it put
on D2's Deck.**

That is not a compromise position reached to keep the peace. It is what the argument
actually produces, and the argument is worth writing out because the conclusion is
not "we split the difference" — it is that one of my two claims was strong and the
other was decoration.

### 1.1 Why the mechanic falls

My R1 specified a continuous drag whose figure "re-counts to its new value as you
drag". Three things are wrong with it, in ascending order of seriousness.

**It is a second horizontal gesture.** D2's grammar assigns lateral movement exactly
one meaning — *move between siblings* — and permits it in exactly one component. My
scrubber is a second component binding a horizontal drag, on the same screen, meaning
something else. Two horizontal meanings on one surface is how a gesture stops being a
language. I would have had to argue that "scope" is not "sibling"; I do not think I
can, because the four horizons *are* siblings, which is the whole point of §1.2.

**Its intermediate positions have no referent.** Today, Week, Month and Year are
discrete, and they are measured against different budgets over different periods.
There is no quantity at 50% between "£245.68 left this week" and "about £3,030 spare
on 30 Aug". A number rendered there is true of nothing.

I considered rescuing this by making the horizon genuinely continuous — *how much
room between now and date X*, X sliding from today to December. That is a
well-defined function, so it would have been honest. It fails for a different reason:
almost every position on it is a projection, so a control whose default state is
"estimate" would break my own rule 3 (at most one estimate at rest), and it would
invite the user to read a precise figure off a position their thumb happened to land
on. That is a number they cannot trace. Doctrine 5 kills it, not taste.

**It was never felt by anyone, and its nearest relative was.** More on this in §1.5.

### 1.2 What I hold, and why it should displace D2's card set

The payload survives intact, and it is the half that was doing real work:

> **The home deck's four cards are one question at four distances — Today, This week,
> This month, This year — not four subjects.**

D2's demo puts *Forecast · Weeks · Commitments · Year* on the cards. I think that set
is wrong, and I think **his own grammar rule decides it against him.**

His gesture table reads: *horizontal swipe means move between siblings — alternatives
at the same level.* Forecast, Weeks, Commitments and Year are not siblings and are not
alternatives:

- **Forecast** is a projection about the future.
- **Weeks** is a navigational container holding four sub-periods.
- **Commitments** are facts already decided and not in play.
- **Year** is a different time horizon from all three.

One guess, one container, one set of settled facts, one horizon. Swiping between them
is swiping between *categories of thing*, and that is exactly the false equivalence I
objected to in R1 §3.2 — I simply objected to it in the wrong place, on the assumption
that the alternative had to be a new control.

Today / Week / Month / Year are siblings on every test that matters. Same question
("how much room do I have"), same sentence shape, same grammar, ordered, with a
natural direction. **A horizontal axis has a direction. Time has a direction. Subjects
do not.** Swiping right on a set of subjects is arbitrary; swiping right on a set of
horizons is moving further out, and the user learns that in one gesture and never
needs telling again.

There is a second, structural payoff that the subject-set cannot produce: each horizon
exposes exactly one "go deeper" route, and those four routes are the only four
consumption routes in the product. A user who understands the deck understands the
whole app's map. Under the subject set, the pager is a topic list — which returns the
screen to *here is evidence, you decide what to read*, the exact defect I diagnosed on
`01-home.png`.

### 1.3 Two countable defects in the Deck as demoed

Not opinions — I counted them in `r1-motion-demo.html`.

**The Weeks card, expanded, shows seven money figures.** £705.71, £1,474.29, £2,180,
then four week rows. An expanded card that has been released is a resting state, and
it fails my rule 1 by three. The Commitments card expands to three, Forecast to four
(at cap), Year to three-plus. So the Deck at rest is excellent — the live card shows
**one** figure and 32px slivers show none, which is better than my own two — and the
Deck expanded is where the nine come back.

This is fixable without touching the mechanic: an expanded card's detail rows are the
first rung of the ladder, not the whole ladder. Weeks expands to a count and a route
(`4 weeks →`), and the four week figures live at `/week`, which is where they were
always going.

**The Forecast card renders a projection to the penny.** `£3,027.24 · spare on 30 Aug`
is the exact figure I flagged in R1 §1.2. It fails my rule 14. It should read
`about £3,030`. D2 carried the current build's string across faithfully; that is
correct of him, and it means the defect is still live and still needs fixing.

### 1.4 What actually changes in D2's spec

Almost nothing, which is the point. Card geometry, drag physics, rubber-band, commit
thresholds, pager parallax, haptics, reduced-motion degradation — all unchanged. Two
asks:

1. **The card set becomes the four horizons** (§1.2), with each card's detail capped
   so the card totals four money figures (§1.3).
2. **The pager labels become buttons.** In the demo they are `<span>`s inside a
   transform-driven track, and the deck sets `touch-action: pan-y`, so drag is the
   only way to reach three of four cards. That is not a styling gap; for a keyboard
   user, a screen-reader user and a reduced-motion user it is three-quarters of the
   home screen behind a gesture they cannot perform. See revised rule 26.

### 1.5 How much of my case rested on a gesture nobody has felt — honestly

**Before this round: one of my three memorable moments, entirely, and nothing else.**
The Rule of Four, the Stub Rule, the Document Rule, the ladder, the tape, the two-tap
add, the hush — none of them touched it. It was one wow item out of three, sitting on
a control I had described and never built. I said in R1 it was the highest-risk element
in the document and needed prototyping before R3. That was true and it was still an
understatement, because the risk was not "it might feel bad" — it was "the numbers it
shows during the gesture might not be true", and I had not noticed.

**After this round: nothing rests on an unfelt gesture.** The mechanic is now the
iMessage card swipe. It is the interaction the founder named, arrived at twice
independently, and it exists in runnable form in `r1-motion-demo.html` today. What
remains untested is not the gesture but the **content mapping** — whether four cards
reading Today / Week / Month / Year feel like one number moving through time, or like
four screens stacked sideways. That is answerable with four static mockups and five
people from the persona. It does not need a prototype and it does not block anything,
because the mechanic is identical either way; only the card contents differ.

**If the mapping fails, home is the Week card alone**: one figure, one qualifier, one
sentence, one route, and the other three horizons become three labelled rows in the
contents list below. Rule of Four intact, Stub Rule intact, every figure still one
gesture away, wow gone. I want to be plain that this is the floor and that it is not a
disaster — it is a correct, quiet home screen. The reason the floor is safe is that
the deliverable was always the rules; the deck is the best thing that can be built on
them, not the thing holding them up.

---

## 2 · The tweening numeral: **D2 is right, unreservedly**

Rule 7.1 of the motion grammar stands and my R1 wording violated it. I used "re-counts"
in §3.1 and "settles" of a numeral in §4.2 state 3. Both are wrong verbs and both would
have licensed a tween in implementation.

The distinction that could have saved me does not, and it is worth recording so nobody
re-litigates it:

- A numeral driven **by a clock** between two values is displaying fictions. Banned.
- A numeral driven **by finger position** is not obviously a fiction — at every frame
  it could be the true value of the scope under the thumb. This is the exemption I
  would have claimed.
- **It does not apply here**, because the horizons are discrete and non-commensurable
  (§1.1). Finger-driven or clock-driven, a figure between Week and Month is false.

So the rule I want in the shared set is *stronger* than "no tweens" and I am proposing
it rather than merely accepting his:

> **A numeral renders a value that exists, or it does not render. It never renders a
> value that is on the way to another value, whether a clock or a finger is driving it.**

This also disposes of the `/add` case: on commit, the affected figure **cuts** to its
new value. It does not settle. The *bar* settles — 480ms, decelerating, no overshoot —
and the bar is the only thing in the app permitted to move toward a value, because a
bar's width is an ornament on a number that is already correct, not a statement of its
own. That is the cleanest statement of why `--d-settle` has exactly one consumer, and
it is his rule 4 arriving at the same place from the truth side rather than the token
side.

Consequence for my rules: my signature moment #3 was named "the add settle". It is
renamed **the Landing**, D2's name, because his name was accurate and mine described a
thing that must not happen.

---

## 3 · Conflicts with D1 (creative)

I found four real ones and three questions that turned out not to be conflicts. I am
reporting the non-conflicts too, briefly, because "I checked and he is fine" is
information the orchestrator needs and a director who manufactures fights to look busy
is wasting the round.

### 3.1 The 520px cap versus the desktop rail — **his number wins, my mechanism wins**

His rule 17 caps the content column at 520px on every viewport and says the app never
becomes a wide dashboard. My §5.3 specified a 560px spine plus a 460px right rail.

560 was arbitrary; I take 520. The rail is the harder half: on a 1280px viewport you
would see two columns of content, which is the thing his rule exists to prevent.

**What breaks if his rule wins outright:** desktop loses the one affordance that makes
it not-a-stretched-phone, and every route below `/` becomes a modal over a centred
column, which is worse than today.

**What breaks if mine wins outright:** "never a dashboard" becomes unenforceable by
inspection, and the next person to touch desktop fills the width.

**Resolution I am proposing, which needs no adjudication:** his 17 governs *a column*;
my 4c governs *the screen*. A rail is a layer, not a second content column — the spine
dims and recedes beneath it exactly as a sheet does on phone, so there is never a
moment when two columns are both live. And 4c is the stricter, more countable rule of
the two: **the desktop layout of a route may show no more money figures at rest than
its phone layout.** A reviewer screenshots both and counts. That is a harder test to
game than a pixel width, and it catches the failure his rule is aimed at.

### 3.2 The type scale has no slot for the qualifier — **mine wins, at zero cost to him**

His scale runs `display` 56/serif → `figure` 17/sans-600. My headline pair is
`£245.68 left` over `of £545 this week · 3 days`, and the relationship between those
two lines is the single most important typographic relationship in the product: the
qualifier is what makes the headline honest.

On his ladder the qualifier lands at `figure` 17/600 — typographically identical to
every ledger-row figure in the app. So the thing that qualifies the hero looks exactly
like a line item somewhere else, and the pair reads as two unrelated figures that
happen to be adjacent. That flattens the one hierarchy I cannot lose.

**The ask costs him no new token.** He already has `heading` at 20/25 sans-500. I want
it defined for this use: **`heading`, tabular numerals, `ink-2`, used immediately
beneath a display figure, at most once per screen.** No new size, no new weight, one
new named usage, still countable.

### 3.3 The ledger reads as a table with a missing column — **he is right, and the fix is a slot, not a decoration**

This was his sharpest question and it lands. Three left-aligned rows with labels, no
figures, separated by hairlines, on paper: the eye expects a right-hand column and
finds nothing there. That reads as unfinished, and "unfinished" in a money app reads as
"still loading", which is worse than either of the two things I was choosing between.

Two corrections, both mine:

**The count moves to the right slot.** `Recurring` left, `14 bills` right, in his
`label` 13/500 `ink-3`. The column is now occupied, and it is occupied by something
visibly not-money — no `£`, quiet ink, small — sitting in the exact position where
£3,767.70 sits today. That contrast is itself the message: *this row is a door, not an
answer.* One chevron, 1.75px, `ink-3`.

**I stop calling it the ledger.** A ledger is a table of figures and the word was
making a promise the rows do not keep. It is **the contents** — literally the app's
table of contents, headed "The rest of August". Naming is a design act and his critique
proved the old name was doing damage before anyone drew anything.

To his either/or: **it should read as a list of doors, and that is correct.** A stub is
a door. The failure mode to design against was never "looks like links" — it was "looks
unfinished", and an occupied, quiet right column fixes it.

### 3.4 "Spare" as the name collides with "spare" as the label — **his call, my fact**

If the app is named Spare, the word is no longer available as the name of the figure.
Today the Month horizon reads *spare on 30 Aug*, and a tape would render "your spare in
Spare". Not a veto — naming is his — but a fact from my side that he does not have.

Cheap fix if Spare wins: the headline uses **"left"** at every horizon and the word
"spare" is retired from product copy. My Today and Week horizons already say "left";
only Month says "spare". One string.

### 3.5 Three things I checked that are **not** conflicts

**The Rule of Four survives a monochrome system, because it never depended on colour.**
My four are not four peers needing four codes; they are one sentence — a subject and its
prepositional phrases. `£245.68 left` / `of £545 this week · 3 days`. They are
distinguished grammatically, by size, by ink step, by position, and by the word "of".
His three-step ink ladder plus one display size is precisely the mechanism my rule
needed and did not have. His rule 11 (one element ≥40px) and my rule 2 (one figure
>24px) point the same way; mine binds harder, so both hold and mine is the failable one.

**Precision-as-provenance needs no new mark, and I argue against giving it one.** The
signal was always shape, never colour: `£245.68` versus `about £3,030`. Two channels
carry it — the word "about", and the **absence of the pence cluster**, which in a
high-contrast display serif is a visible hole where two glyphs and a point should be.
`tabular-nums` (his rule 15) makes that difference align-visible in any column. A tilde,
a `≈` or a dotted rule would be a glyph most people cannot decode, encoding something
already stated in plain English — which is the same objection he raised against the
colour ramp, and I am not going to earn it. One typographic spec I do want him to own:
**"about" sets in `label`/`ink-3` immediately preceding the figure, never inside it**,
so the display figure stays clean and the hedge is legibly a hedge. See revised rule 14.

**The calibration band and the over-budget state do not rely on colour valence.** The
over-budget rule is a *copy* rule — state both figures, no adjective — and survives
either palette outcome untouched. The band never had valence either. But see §5: I am
cutting the band for a different reason he handed me.

### 3.6 One thing I owe him on the escalation he does not have

The orchestrator has correctly bounced the no-red decision to the founder, since the
ramp was a considered founder request. I have a UX-side input that D1 cannot make and
that changes the shape of that decision:

**My rule 17 makes red unnecessary rather than merely undesirable.** Where spend
exceeds budget the screen states `£627.30 recorded · £545 set` — both figures, no
adjective. Once both numbers are on screen, the fill's colour is carrying no
information at all; it is carrying tone. So the founder is not choosing between "red
tells them" and "nothing tells them". He is choosing what the *already-stated* fact
should feel like. That is a much easier decision and it should be put to him that way.

Second, smaller: the ramp encodes fraction-of-budget in a channel where the fill width
already encodes it, and my rule 21 puts the figure adjacent as a third. Three channels
for one quantity. My concern is not the temperature — it is D1's observation that
Transport reads *hotter* than Everyday, which makes two bars look like different
**kinds** of thing. That edges toward category-coding, which collides with his rule 7
and with non-negotiable 3. Worth having in front of the founder alongside his own
reasoning, which is good reasoning.

---

## 4 · Conflicts with D2 (motion)

§1 and §2 are the two big ones and are settled there — the Deck's card set (I win, on
his rule) and the tweening numeral (he wins, outright). Four smaller ones remain.

### 4.1 Month navigation by header swipe — **he wins, I withdraw**

I specified swiping the header left/right to change month. That is a second horizontal
meaning on the home screen (rule 13) and it moves the period identity, which his rule
7.5 forbids outright. Both are right, and the second is the better rule: **the period
identity is the one thing on the screen that must never move**, or the user can lose
track of what they are looking at while looking at it.

Month changes by tapping the month name, which opens a compact picker. This costs a
gesture on a rare action and buys one meaning per gesture, which is the correct trade.

Same correction on `/week/[n]`: lateral belongs to the category deck there, so week-to-
week movement is a control in the header, not a swipe. My R1 §4.1 said otherwise and
was wrong.

### 4.2 Drag-to-open on the Trace — **he wins on the table, we both lose the gesture**

His table gives *vertical drag on a figure* to the Trace and *vertical drag down on a
sheet* to dismiss. On a sheet — which is where most figures in my architecture live —
a downward drag beginning on a figure is ambiguous, and ambiguity in a dismiss gesture
is how a user loses their place.

**Tap opens the Trace. Vertical drag is dismiss, always, everywhere.** Simpler than
either of our specs and it removes the collision.

### 4.3 The Landing has no destination when you add from home — **real gap, mine to fill**

His Landing sends the amount chip to "the row it belongs to", then settles that row's
fill. In my architecture `/add` is a sheet over home, and **home has no rows with
figures and no bars.** The destination does not exist at the place the user adds from.

The fix keeps the informational payload, which is the whole justification for the
moment:

> **The chip lands on whatever visible element the amount changed.**
> - On home: the **headline figure**, which cuts to its new value on landing. No bar,
>   so no settle — and no violation, because a cut is what §2 requires anyway.
> - On `/week/[n]`: the live deck card's **bar**, full Landing including the 480ms
>   settle. This is `--d-settle`'s one consumer and it is intact.
> - When the affected thing is not visible at all: the chip lands on the **contents
>   row** whose count increments. `14 bills` → `15 bills`. A count is not money and can
>   change without stating a figure the user did not ask for.

The moment still teaches structure in every case — which bucket your money went into —
and it never has nowhere to go.

### 4.4 The pager must be operable without a gesture — **I hold this hard**

Covered in §1.4 and it is the one place I am not offering a compromise. Under his own
reduced-motion contract the test is *every task completes in the same number of taps and
nothing visible before is now unreachable*. In the demo, three of four cards are
reachable only by drag. That fails his test, not just mine. Pager labels become buttons,
the deck becomes an ARIA tablist, arrow keys move it when it has focus. New rule 26.

### 4.5 One thing worth saying loudly

**We named the same three signature moments, independently, on the first pass.** My
rule 23 named the horizon scrub, the tape open, and the add settle. His §3 named the
Deck, the Trace, and the Landing. Same three moments, two of them near-identically
specified from opposite ends — he wrote the physics, I wrote the content contract, and
they compose without a seam. His Trace spec is better than my tape spec on every motion
question and I adopt it wholesale; my tape spec covers what a tape must *contain*, which
his does not address. Neither of us needs to give anything up.

Given that convergence, the naming should collapse to his: **Deck, Trace, Landing.**
Three names, one vocabulary, and a rule the whole team can count on one hand.

---

## 5 · What I concede

Plainly, without hedging.

1. **The continuous scrub numeral.** Wrong on truth grounds. D2 is right and my rule
   set is stronger for taking his (§2).
2. **The horizon scrubber as a distinct mechanic.** It was a second horizontal gesture
   and an invented control competing with a felt one. It is the Deck (§1).
3. **Month change by header swipe**, and week change by header swipe on `/week/[n]`
   (§4.1).
4. **Drag-to-open on the tape.** Tap only (§4.2).
5. **The calibration band — cut from v1 entirely.** I had it at off-by-default with 50%
   doubt in R1. D1's system finished the argument for me: a band behind a figure encodes
   magnitude by *position within a range*, which is a second widget where spatial extent
   carries magnitude. That is my own rule 22 in spirit, and I would have failed someone
   else for it. Gone. If the founder wants comparison, it comes back as its own decision
   with its own design, not as a widget I smuggled in behind a hedge.
6. **My rule 16 as written.** "No negative colour role in the top 40% of first paint"
   has no referent in a system where colour never encodes valence. D1's rule 5 is
   strictly stronger — it bans the role everywhere, not just at the top of home. I fold
   and retarget (revised rule 16).
7. **The word "ledger"** (§3.3), and the missing right-hand slot in those rows.
8. **560px → 520px** for the spine (§3.1).
9. **"The add settle"** as a name. It is the Landing, and my name described a thing that
   must not happen (§2).
10. **The `mm/dd/yyyy` claim in my §1.2 defect 5.** The orchestrator is right: native
    date inputs render in the browser's locale and the screenshots were captured in
    `en-US`. Not an app defect and I should have checked `AddView.tsx` before calling it
    a live bug. **What does not change:** a three-field date control for a value that is
    "today" the large majority of the time is the wrong control in *any* locale. The
    `/add` redesign is unaffected; only the word "bug" comes out of it.

---

## 6 · Unresolvable — founder decisions

Four. Each with a recommendation, because a decision list without recommendations is
just work handed back.

### 6.1 The Deck's payload: four horizons, or four subjects?

**The decision:** whether home's cards read Today / This week / This month / This year
(mine) or Forecast / Weeks / Commitments / Year (D2's, and closer to the founder's
original sketch).

**Why it is his and not ours:** I believe I win this on argument (§1.2) and on his own
grammar rule. But the founder arrived at swipe-cards twice independently, and if the
mental image behind both arrivals was specifically *these summaries, side by side*,
that is his taste about his own product and it outranks my structural case. I do not
get to tell him what he pictured.

**Recommendation: the four horizons.** It is decidable in twenty minutes with four
static mockups and five people, it does not block a single line of implementation
because the mechanic is identical either way, and only the card contents differ.

### 6.2 `+£11,806.05` off home at rest

Unchanged from R1 and still his. It is an unrequested aggregate, duplicated on `/year`,
and by my reading the most avoidance-triggering figure on the screen. It may also be
the figure he considers the payoff of the whole product.

**Recommendation: it becomes the Year card of the deck.** One swipe away, never deleted,
never the first thing seen. Note that D2's demo has it on card 4 already, so both
proposals agree on the placement and the only question is whether card 1 is allowed to
be something else.

### 6.3 Red, or no red

D1's escalation, correctly bounced by the orchestrator because the ramp was a considered
founder request. My input is §3.6 and it reframes the question: with rule 17 in place
both figures are already stated, so red carries no information — only tone. He is
choosing a feeling, not a fact.

**Recommendation: no red, hatch for the over state.** But my recommendation is worth
less here than D1's, and the ramp's original reasoning — calm to 70%, warming late,
because a bar that reddens early is the product working against itself — is genuinely
good reasoning that deserves to be reversed knowingly or not at all.

### 6.4 The name, if it is "Spare"

Purely mechanical, but it needs an answer before copy is written: if the app is Spare,
the headline word must change to "left" everywhere and "spare" leaves product copy
(§3.4). One string, but it has to be decided in the same breath as the name.

---

## 7 · Revised rules

Only rules that changed from my R1 §9 list. Everything not listed here stands as
written — in particular 1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18, 19, 21, 22, 25.

**2 · (tightened)** At most one element on a screen is ≥40px, and at most one money
figure is set larger than 24px. Adopts D1's rule 11 and keeps mine as the stricter,
failable form.

**4 · (numeric)** The desktop layout of a route shows no more money figures at rest than
its phone layout, and no content column exceeds **520px** on any viewport. A rail is a
layer, not a second column: the spine dims beneath it and only one column is live.

**14 · (typographic form added)** Exact means recorded; rounded means estimated. A figure
summed from rows is displayed to the penny. A figure depending on future behaviour is
rounded to £10 and prefixed "about" — and **"about" sets as a `label` in `ink-3`
immediately preceding the figure, never inside it, and an estimate never renders pence.**
Grep: no forecast rendered with pence.

**16 · (replaced)** The resting home screen carries **no over-state marker of any
kind** — hatch, texture, colour or icon — above the sentence. The fact may be stated in
words; the marker belongs on the screen the user went to in order to look. *(Supersedes
"no negative colour role in the top 40%", which D1's rule 5 makes vacuous by banning the
role outright.)*

**20 · (cut)** No comparison of any kind ships in v1. No cohort, no percentile, no rank,
and no calibration band. Comparison against the user's own history returns, if at all,
as its own decision with its own design.

**23 · (renamed)** At most three signature moments in the product. They are **the Deck,
the Trace, and the Landing**. Any fourth requires deleting one.

**24 · (strengthened)** Every motion is interruptible; with motion disabled the app loses
no information and no affordance; and **no numeral anywhere renders a value that is on
the way to another value** — not on a clock, not under a finger. Numerals cut. Only a
bar's width may travel toward a value.

**26 · (new)** Every gestural control has a non-gestural equivalent visible at rest. The
deck's pager labels are buttons, the deck is a tablist, and arrow keys move it when
focused. Failable: complete every task with a keyboard only, and again with a screen
reader only.

**27 · (new)** Lateral has exactly one meaning per screen, and on any screen carrying a
deck that meaning belongs to the deck. Nothing else on that screen binds a horizontal
gesture — not the header, not a row, not the period identity.

---

## 8 · Report

**What I did:** read D1, D2, the orchestrator's corrections and D2's motion demo; wrote
this file. Nothing in `src/` touched, no git commands, no other file created, R1 not
rewritten.

**The big move:** I withdrew my own highest-risk element rather than defend it. The
scrubber's mechanic was a second horizontal gesture displaying values that do not exist,
and I did not spot the second part until D2's rule 7.1 forced me to look. Its content
model — one question at four distances — is the half that was load-bearing, and it
transfers onto his Deck at no cost to his physics.

**Where I held:** the Deck's payload (§1.2, on his own grammar rule), the qualifier's
type slot (§3.2), the desktop density rule (§3.1), and non-gestural operation of the
pager (§4.4). That last one is not a design preference and I will not trade it.

**Not confident about:**

- **Whether four horizons genuinely read as one number moving through time.** This is
  the load-bearing untested assumption in my half of the round, and I have replaced one
  unfelt gesture with one unfelt *mapping*. The mapping is cheaper to test and its
  failure is survivable (§1.5), but it is still an assumption and I would rather say so
  than let it pass as settled by argument.
- **The contents rows.** I think a quiet count in the right-hand slot fixes the
  unfinished reading. I have not seen it drawn on D1's paper ground and he is better
  placed than me to judge whether it does.
- **Whether capping an expanded deck card at four figures leaves the Weeks card with
  anything worth expanding to.** It may turn out that Weeks should not be a card at all,
  only a route — which would be an argument for the horizon set that I have not made
  because I only half believe it.
- **The two-tap add's inferred category.** Unchanged from R1: a wrong guess the user
  does not notice corrupts their data and their trust in it. Still needs a real person,
  not more reasoning from me.
