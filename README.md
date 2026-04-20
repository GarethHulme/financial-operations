# Financial Operations

Financial Operations module for the DCS Command Suite — supplier finance, client billing, invoice approvals, disputes, forecasting, and weekly cash flow.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS (dark professional theme)
- PostgreSQL + Drizzle ORM
- Railway-ready deployment

## Local Development

```bash
npm install
cp .env.example .env
# set DATABASE_URL
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run db:generate` — generate migrations from schema
- `npm run db:push` — apply schema directly to DB
- `npm run db:seed` — load demo data

## Domain

Owns: suppliers, supplier contracts/rates/invoices/payments/disputes, clients, client contracts/rates/invoices/payments/disputes, allocation rules, forecast snapshots, cash flow buckets, warnings, impact confirmations, document ingestion, event outbox.

Cross-module joins use stable IDs: `site_id`, `route_id`, `route_group_id`, `vehicle_id`, `client_contract_id`, `user_id`, `role_id`.

## Module Map

- `/` — landing with 9 summary metrics
- `/suppliers` — supplier profiles, contracts, rates, exposure
- `/clients` — client profiles, contracts, rates
- `/invoices` — supplier + client invoice lifecycle
- `/disputes` — dispute management with timeline and resolution
- `/payments` — supplier payment runs, client receipts + allocation
- `/cash-flow` — weekly buckets, rolling 13-week view
- `/forecasting` — forecast vs actual, variance, root cause
- `/warnings` — severity-filtered exception views
- `/documents` — upload + preview matching

## Deployment

Railway-ready (`railway.toml`, `Dockerfile`). Health check at `/api/health`.

## Control Rules

Enforced in code — see `src/lib/`:

- No supplier activation without validation
- No invoice creation without preview confirmation
- No supplier invoice approval without contract + credit checks
- No disputed invoice in payments due out
- No supplier cost into P&L without allocation
- No client payment counted without allocation
- No material change without impact confirmation
- No silent overwrite of original invoice or dispute history
