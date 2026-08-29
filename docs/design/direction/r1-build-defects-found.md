# Defects in the current build, surfaced during R1

The UX director found these while reading the screens. **All three were
independently verified against the source before being recorded here** — one of
them was misattributed, so the correction matters.

## 1 · A second bar grammar exists, and no doctrine sanctions it — CONFIRMED

`src/components/year/YearView.tsx:44`

```tsx
<span style={{ width: `${share.barPercent}%`, background: SHARE_COLORS[share.key] }} />
```

`ShareBar` computes segment width directly from magnitude. `AGENTS.md` states
that `Bar.tsx` implements **the one** chart grammar and that computing a bar's
width means "you are doing it wrong".

In fairness this is a *composition* bar (share of income), not a
budget-versus-spend bar, and the reason doctrine 2 exists — magnitude must not
shout a judgement — does not obviously apply to a breakdown. But the doctrine is
written in the singular and this is a second form nobody blessed.

**Needs a decision, not a silent fix:** either doctrine 2 is amended to permit a
composition grammar with its own rules, or `ShareBar` goes. The creative
director's palette work touches this either way.

## 2 · No "not now" affordance exists anywhere — CONFIRMED

`01-brand-strategy.md` lists as **Required**: *"a visible, easy way to say 'not
now' or 'don't mention that again' — and the design must make clear it will be
honoured. For this persona, the ability to turn Max down is what makes Max safe
to turn on."*

Grepping the whole of `src/` finds only sheet and scrim *dismissal*, which is
closing a thing you opened — not declining something Max raised.

**Mitigating context:** Max does not yet proactively surface anything to decline.
The requirement bites the moment nudges, insights or the LLM features start
speaking unprompted — which is exactly what is being designed now. So this is a
gap to close *in* the redesign, not a bug in what shipped.

This is a defect of absence, which is why no review ever tripped over it.

## 3 · The US date format — MISATTRIBUTED, and worth stating correctly

Reported as "`/add` renders a native `mm/dd/yyyy` date input — US ordering in a
sterling app". The screenshot does show `mm/dd/yyyy`.

But the cause is not the app. `src/app/add/AddView.tsx:176` uses
`<TextField type="date">`, and a native date input **always** renders in the
*browser's* locale while its value stays ISO. The capture showed US ordering
because headless Chromium defaulted to `en-US`, not because Max hardcodes
anything. On the founder's UK phone it will read `dd/mm/yyyy`.

**Not a bug.** Worth one look on a real device to confirm, and worth remembering
that every screenshot in `screens/` was taken in a US-locale browser — anything
locale-sensitive in them is an artifact of the harness.

---

*Recorded during R1 so these are not lost in the design work. None have been
fixed; fixing mid-round would move the ground under the directors.*
