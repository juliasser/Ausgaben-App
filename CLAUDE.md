# CLAUDE.md — Ausgaben App

Context for Claude Code sessions on this project.

## What this is

A personal spending tracker PWA hosted on GitHub Pages. Started from a voice transcript (`docs/Transcript.txt`). Single user, German UI throughout.

## Tech stack

- **Vue 3 via CDN** — ES modules, no build step, no bundler
- Component files are plain `.js` files exporting a component options object (no `.vue` SFCs — templates live in JS template strings)
- Entry point: `index.html` → `<script type="module" src="js/app.js">`
- **Supabase** for data (REST API via `fetch`, no SDK)
- **GitHub Pages** for hosting (deploy from `main` branch root)

## Key files

| File | Purpose |
|------|---------|
| `js/app.js` | Vue app root; owns global state (`transactions`, `loading`, `loadError`); screen routing via `currentScreen` ref |
| `js/config.js` | `BUDGET_POTS`, `CATEGORIES`, `TRANSFER_META` constants |
| `js/db.js` | Supabase REST wrapper — `fetchTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`, `testConnection` |
| `js/store.js` | localStorage helpers for pot configuration (not transactions) |
| `js/components/NavBar.js` | Bottom nav — 3 items: Liste, Hinzufügen, Statistik |
| `js/components/AddTransaction.js` | Add/edit form; emits `'saved'` |
| `js/components/TransactionList.js` | Grouped list; emits `'edit'` and `'settings'`; cogwheel button opens settings |
| `js/components/Statistics.js` | 30-day / month stats with category breakdown |
| `js/components/Settings.js` | Supabase credential form; emits `'saved'` |
| `css/style.css` | All styles, mobile-first, CSS custom properties |
| `sw.js` | Service worker — cache-first for local, network-first for CDN |
| `manifest.json` | PWA manifest |
| `docs/supabase_schema.sql` | Schema to run in Supabase SQL editor |
| `PLAN.md` | Full phased plan — mark tasks done as they're completed |

## Data flow

- `app.js` fetches transactions from Supabase on mount and after every save/delete (`refresh()`)
- `transactions` ref is passed as a prop to `TransactionList` and `Statistics`
- `AddTransaction` calls db.js directly and emits `'saved'` → app.js calls `refresh()`
- Settings screen is reached via the cogwheel icon in the list header (not the nav bar)

## Transaction shape

```js
{
  id,               // UUID (Supabase)
  type,             // 'expense' | 'transfer'
  title,            // string
  amount,           // number (NUMERIC in DB, normalised to float on fetch)
  spending_date,    // 'YYYY-MM-DD'
  consumption_from, // 'YYYY-MM-DD' (defaults to spending_date)
  consumption_to,   // 'YYYY-MM-DD' | null (null = no distribution)
  from_pot,         // pot id
  to_pot,           // pot id | null (transfers only)
  category,         // category id | null (expenses only)
  notes,            // string
  created_at,
  updated_at,
}
```

## Budget pots (js/config.js)

`cash` (Bar), `card` (Karte), `splitwise` (Splitwise), `paypal` (Paypal), `granada` (Granada Karte)

## Categories (js/config.js)

All German, each has `id`, `label`, `color`, `bg`, `icon` (SVG path string):
`einkauf`, `essen`, `transport`, `gesundheit`, `freizeit`, `wohnen`, `anschaffungen`, `ausgehen`, `sonstiges`

## Conventions

- All user-facing text is in **German**
- Amounts displayed without negative sign (expense tracker, not accounting)
- `spending_date` label in UI: **Datum**; pot label in form: **Zahlungsmittel**
- Consumption range is hidden behind an **Erweitert** accordion (expenses only)
- `NUMERIC` from Supabase REST comes as a string — always `parseFloat()` on receipt (handled in `normalise()` in db.js)
- No secrets in the repo — Supabase URL and anon key go in localStorage only
- iOS PWA: `viewport-fit=cover`, `env(safe-area-inset-bottom)` for nav bar, `font-size: 16px` on inputs to prevent zoom

## Service worker cache

Cache name is versioned (currently `ausgaben-v2`). Bump the version string in `sw.js` whenever files change that need to be re-fetched by installed PWA users.

## Supabase setup (for reference)

1. Create a project at supabase.com
2. Run `docs/supabase_schema.sql` in the SQL editor
3. Find credentials in Project Settings → API (Project URL + anon key)
4. Enter them in the app's settings screen (cogwheel icon on list screen)
