# Max

Max is a personal finance companion for people who avoid personal finance apps.

Not a budgeting tool that asks you to categorise your transactions — a companion that takes whatever you can give it, tells you where you stand in plain language, tells you honestly how that compares to households like yours, and helps you plan for what's coming.

## Documentation

**→ [Start with the docs](./docs/README.md)** — product vision, creative brief, competitive analysis, roadmap, and the principles that govern how Max behaves.

The two most important, if you only read two:
- **[Product Vision](./docs/product/01-product-vision.md)** — who this is for and why
- **[The Data Model](./docs/architecture/01-data-model.md)** — the inversion everything else rests on

## Repository layout

| Path | What it is |
|---|---|
| `docs/` | Product, principles and architecture documentation |
| `src/` | The web app — Next.js, deployed to Railway |
| `packages/shared/` | Platform-neutral types and design tokens shared across surfaces |
| `mobile/` | Expo/React Native app — **parked**, revisited after the web experience is proven |

## Stack

Next.js (App Router, TypeScript) · Postgres on Supabase via Drizzle · deployed on Railway.

```bash
npm install
npm run dev
```

Requires `DATABASE_URL` and `DIRECT_URL` in `.env.local`.
