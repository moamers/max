# Export spec — writing back to the founder's own template

*Two real templates are committed alongside this file in `docs/design/templates/`
(a 4-week and a 5-week period). Open them; they are the specification.*

---

## The central finding: the templates compute themselves

These workbooks are **formula-driven**, not value-driven. Traced from the 5-week
template:

| Cell | Formula |
|---|---|
| `Month summary` C2:C6 | `=sum('Week N'!H24)` — each week's total, pulled from its tab |
| `Month summary` E1 | `=sum(C2:C6)` — total weekly |
| `Month summary` E8 | `=sum(C9:C29)` — bills |
| `Month summary` H18 | `=SUM(H6,C9:C30,C32:C161)` — grand total |
| `Week N` C24 | `=sum(C2:C23)` — grocery block |
| `Week N` H24 | `=sum(C24,C43,C58)` — the week's total |
| `Week N` C25 | `=minus(100,C24)` — budget remaining |

**Therefore: export writes line items and formulas, never computed totals.**

This is not a stylistic preference. Doctrine `T-2` says the system must not do
arithmetic it then states as fact. Emitting formulas means the spreadsheet
computes its own totals — so if Max's figures and the sheet's formulas ever
disagree, the user sees it immediately. A hardcoded total hides exactly the class
of bug that produced `F-1` and `F-3`.

## Generate, don't fill

Do **not** open a template file and write into its cells. Two reasons:

1. **Formula ranges are fixed and hand-maintained.** The grocery block is
   `C2:C23`, so a week with 30 grocery rows silently falls outside the total.
2. **The templates are not internally consistent.** `H12` on the summary reads
   `=sum('Week 1'!C58,'Week 2'!C54,'Week 3'!C57,'Week 4'!C57)` — a different row
   per tab, because each week tab grew differently by hand.

Instead, **generate a fresh workbook** matching the template's *layout*, sized to
the actual data, with formulas written to match the ranges you actually emit.
`exceljs` is already a dependency and supports `{ formula: "..." }` cell values.

## Layout to reproduce

**Column structure — this is what caused defect `F-3`, read it carefully.** Line
items live in columns A–D. A summary panel lives in columns G–H. **Column F is
empty, top to bottom, and is what separates them.** Reading across that gap is
how "Salary GBP 6,647.94" in the panel got attached to a rent line in column C.
Reproduce the gap exactly.

```
Week N tab                          Month summary tab
A  merchant                         A  merchant / section header
B  note                             B  note
C  amount                           C  amount
D  label (the user's own words)     D  label
                                    E  section total (formula)
F  (empty — the separator)          F  (empty — the separator)
G  panel label                      G  panel label
H  panel value (mostly formulas)    H  panel value
```

Each week tab has three blocks in order — **Grocery**, **Weekend**,
**Transport** — each opening with a merged header row across A:D, then its rows,
then a total row and a budget row.

The summary tab opens with the week list, then **Bills**, then **Extras**.

## Period length is not fixed

The two templates differ only in the number of week tabs (4 vs 5). **Emit as many
week tabs as the period actually has** — do not pick a template. The founder's
periods run 4–5 weeks, deliberately imprecise, aligned roughly to a card cycle.

## Labels are verbatim

Column D carries the user's own words — `fam-uk`, `weekly-extra`, `nadia`,
`holiday`. Write them back exactly as stored. Never normalise, title-case or map
them onto anything (`D-10`).

## The known lossy edge

A round trip **loses the recurring group**. Max splits recurring spend into
Housing / Childcare / Bills / Subscriptions; the sheet has one flat bills list.
Re-file rent under Housing, export, re-import, and it returns as Bills. See
`G-4`. State this in the export UI; do not imply a lossless round trip.

## The acceptance test *is* the deliverable

```
parse(workbook) → export → parse(export) must equal the original parse
```

Automated, with `exceljs`, over the committed templates. Not a nice-to-have —
this is how we find out whether the parser and the exporter agree about what the
user's money means.

---

## The year round-up export (CSV)

A second export: one row per period, matching the founder's aggregates sheet.
The maths below was reverse-engineered from that sheet and **verified to the
penny across all 12 of his periods** — reproduce it exactly.

| Column | Value |
|---|---|
| Period | the period's label, e.g. `Jun 30th - Aug 3rd` |
| Total weekly | grocery + weekend + transport |
| % | `total weekly ÷ income` |
| Total fixed | recurring |
| % | `total fixed ÷ income` |
| Total variable | one-offs |
| % | `total variable ÷ income` |
| Income | resolved income for that period |
| Final position | `income − (weekly + fixed + variable)` |
| % | `final position ÷ income` |

Plus two single figures and an average row:

- **Net income** = sum of all periods' income *(his sheet: 83,848.81)*
- **Net position** = sum of all periods' final positions *(his sheet: 3,599.31)*
- **Average** row = the mean of each column

A period with unknown income leaves the percentage columns **empty, not zero** —
an unknown is not a nought, and a percentage of a number we don't have is the
`F-3` failure in a new costume.
