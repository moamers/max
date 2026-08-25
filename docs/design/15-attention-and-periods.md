# Addendum — the attention flag, period rollover, and month markers

*Three additions the handoff doesn't cover, decided with the founder.*

---

## 1 · A third transaction state: "needs a look"

The founder's spreadsheet already carries an orange flag meaning *this needs
attention / something is wrong*. Max should have the same idea.

Screen 04's control becomes **three-way**, not two:

| State | Meaning | Who sets it |
|---|---|---|
| **Final** | Settled. The default. | — |
| **Pending** | The *amount* isn't final yet. | User, or import |
| **Needs a look** | Something about this row is unresolved or wrong. | **User, or Max on import** |

**These are mutually exclusive.** One row, one state.

### Why this replaces the `assumed` flag proposed earlier

[`13-import-reconciliation.md`](./13-import-reconciliation.md) proposed a separate
`assumed` marker for rows Max placed by guessing. That is the same idea as this
one arriving from a different direction, and two markers that render identically
and clear identically should be one marker. **Use `needs_attention` for both**,
with `attention_reason` recording *why* — whether Max wrote it ("no week tab, so
I put this in week 1") or the user did.

One flag, two sources, one reason field. The reason is what keeps it traceable
(`B-8`); a flag with no stated cause is just anxiety.

### Schema

```sql
ALTER TABLE transactions
  ADD COLUMN needs_attention boolean NOT NULL DEFAULT false,
  ADD COLUMN attention_reason text,
  ADD CONSTRAINT transactions_one_state CHECK (NOT (pending AND needs_attention));
```

### Colour — a decision, not a lookup

**There is no design for a third state.** The palette has amber `#F0C64B` for
Pending and red `#E8736F` for over-budget. Red is wrong here: it means "over" and
it carries a verdict, which is what the tone rules exist to prevent. So the third
state needs its own colour.

Proposed, following the palette's own rule (saturated as a fill in dark,
darkened as ink in light) and sitting deliberately between amber and red:

| Role | Dark | Light |
|---|---|---|
| Needs-a-look ink / dot | `#F0904B` | `#9A4E06` |
| Needs-a-look tint background | `#241606` | `#FBE6D2` |

This is a **new brand colour**, so it is the founder's call: adopt these values,
or send it back to design. Nothing else is blocked either way — the state itself
is not a colour question.

---

## 2 · Periods roll forward on today's date

### What the data says

Measured across the founder's twelve real periods, with no exceptions:

- **Every week runs Monday to Sunday.** Every period starts on a Monday and ends
  on a Sunday, 12 for 12. This is structural, not coincidence: a week is grocery,
  transport and a two-day weekend, so the week *is* Mon–Sun.
- **Every period is exactly 4 or 5 whole weeks** — 28 or 35 days, never anything
  between.
- **Every period starts exactly one day after the previous ends.** No gaps, no
  overlaps.

So the only free variable is **4 weeks or 5**, and it is decided by where the end
lands in the calendar. Testing every day-of-month as a target:

| Rule | Reproduces |
|---|---|
| End on the Sunday nearest **the 1st/2nd** | **11 of 12** |
| End on the Sunday nearest the 3rd | 10 of 12 |
| End on the Sunday nearest the 8th | 4 of 12 |

**The 8th does not fit.** The founder believes he aligns to his card cycle on the
8th; his actual periods align to the *month boundary*. Worth knowing, because
building to the stated intent rather than the observed behaviour would have
produced a rule that disagreed with two thirds of his own history.

So: **pick 4 or 5 whole Mon–Sun weeks, whichever ends nearest the 1st.** It is a
default, not a law — it disagrees with him once in twelve, which is exactly why
it is shown and adjustable rather than applied silently.

### The behaviour

- Max knows today's date. When today passes the current period's end, **the next
  period becomes the default view** — the app moves on by itself, the way opening
  a new spreadsheet does.
- The next period is **created, not requested**: it starts the Monday after the
  last one ended, and runs 4 or 5 whole weeks — whichever ends on the Sunday
  nearest the 1st.
- The proposed end date is **shown and adjustable** — one tap to make it 5 weeks.
  This is the import rule applied to time: *show the assumption, don't ask the
  question.* Never open with an empty date picker.
- **Switching between periods stays cheap.** He works across two at once at a
  boundary, finishing one while starting the next. The month picker (screen 09)
  is that control and must not privilege the current period so strongly that
  going back feels like leaving.

This closes [`A-8`](../00-open-decisions.md): until now, nothing in Max could
create a period except an import, so the app would have stopped the moment he
stopped keeping the spreadsheet.

---

## 3 · A marker on months that need attention

On the month picker (screen 09), a period containing any **needs-a-look** row
carries a small dot in the needs-a-look colour, on its tile.

- The dot means *there is something here you haven't settled* — nothing stronger.
  It is not a warning and must not read as one.
- **Pending rows do not get a dot.** An amount that isn't final yet is normal
  bookkeeping, not an open question.
- No count, no badge number. The tile says *something*, the screen says *what*.

This is the safety net for a user who skipped everything at import: the
uncertainty stays quietly visible at the level they navigate by, rather than
disappearing until they happen to open the right week.
