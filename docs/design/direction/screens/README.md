# The current build, as it actually renders

Captured from a running instance against a seeded local database — not mockups,
not descriptions. This is what the founder is looking at when he says it reads
like a wireframe.

**These are the "before".** They are here so the directors can critique
something real. Nothing in them is a target.

| File | Screen | Width | Theme |
|---|---|---|---|
| `01-home.png` | Home — the whole month | 390 | dark |
| `02-home-light.png` | Home | 390 | light |
| `03-week.png` | One week, drilled down | 390 | dark |
| `04-recurring.png` | Recurring bills | 390 | dark |
| `05-one-offs.png` | One-off spend | 390 | dark |
| `06-year.png` | Year round-up | 390 | dark |
| `07-add.png` | Add a transaction | 390 | dark |
| `08-transaction.png` | Edit one transaction | 390 | dark |
| `09-goals.png` | Weekly budget goals | 390 | dark |
| `10-income.png` | Income, month by month | 390 | dark |
| `11-home-desktop.png` | Home | 1280 | dark |
| `12-home-light-desk.png` | Home | 1280 | light |

**The core six**, if you are keeping context small: `01`, `03`, `07`, `06`, `02`,
`11`. Home and a week are where all three complaints are visible at once; add is
the most-used interaction; year is the only screen with a chart; the light and
desktop shots exist so nobody designs a dark-phone-only system by accident.

## About the data

Invented, but shaped like the founder's real file: ~£9.5k monthly income, ~£3.7k
of recurring bills, three weekly categories (everyday £260, weekend £190,
transport £95 per week), three consecutive Monday-to-Sunday periods so the month
switcher and the year screen have real history. Two deliberate edge states are
seeded into the live month — one pending transaction and one flagged "needs a
look" — because those states are part of the design problem and are invisible in
a clean dataset.

Captured 2026-08-29, viewport date inside the Aug 3–30 period.

## Reproducing these

The harness is throwaway and local: a temporary Postgres, `drizzle-kit push`,
seeded rows, `next dev`, and headless Chromium driven over the DevTools Protocol
(no Playwright dependency — Node 22's built-in WebSocket is enough). It touches
no production data and needs no new packages. Ask and it can be restood in about
two minutes to re-shoot after any change.
