# R2 claims, checked against source

Same standard applied to every director. In R1 the creative director's claim
about the bar ramp was wrong and had to be corrected; these were checked before
being carried into R3.

## The UX director's findings about the motion demo — BOTH CONFIRMED

### 1 · The forecast is rendered to the penny

`r1-motion-demo.html:176`

```html
<div class="big">&pound;3,027.24</div>
```

This is a *projection* — what the month is expected to land at — stated to two
decimal places. It is the same defect the UX director identified on the live
home screen in R1, carried faithfully into the demo of the replacement.

It matters more than it looks. Doctrine 5 in this repo exists because the parser
has twice misread real financial data, and both misreads were caught by making
figures openable. A projection printed to the penny **claims a precision it does
not have** — it looks like a recorded fact and is an estimate. The UX
director's "precision as a provenance signal" rule (exact = recorded, rounded +
"about" = projected) is the right answer, and the demo violates it.

### 2 · The deck is drag-only

`r1-motion-demo.html:224` — the pager labels are `<span>`s:

```html
<span>Forecast</span><span>Weeks</span><span>Commitments</span><span>Year</span>
```

with `.deck{...touch-action:pan-y}` at line 63 capturing the horizontal axis.

So the labels are not focusable, not tappable, and not reachable by keyboard.
Three of the four cards can be reached **only** by dragging.

This fails the motion director's own reduced-motion contract, which argues the
Deck survives motion reduction because "direct manipulation isn't motion" — an
argument that only holds if direct manipulation is not the *sole* route. It also
fails the project's stated constraint that every screen work on desktop.

The UX director called this the one thing it refused to trade. It is right.

**Note this is a defect of the prototype, not necessarily of the design.** The
fix is small — make the labels buttons — and it does not touch the mechanic. It
should not be used to argue against the Deck itself.

## Standing note on how these documents were produced

The demos and specimens are prototypes written to be judged, not shipped. Where a
director's own artefact contradicts their own written rule, the rule is what was
argued for and the artefact is what was hastily built. Treat the contradiction as
a bug report against the prototype — but a real one, because the founder will
judge the prototype and not the document.
