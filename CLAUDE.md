# CLAUDE.md — Ausgaben App

## Tech stack

- **Vue 3 via CDN** — ES modules, no build step; components are `.js` files with template strings (no SFCs)
- **Supabase** for data — REST API via `fetch`, no SDK; credentials in localStorage
- Entry: `index.html` → `js/app.js`

## Key files

| File | Purpose |
|------|---------|
| `js/app.js` | App root; global `transactions` ref, `refresh()`, screen routing (`currentScreen`); mirrors fetched data to `localStorage['ausgaben_backup']` |
| `js/config.js` | `BUDGET_POTS`, `CATEGORIES`, `TRANSFER_META` |
| `js/db.js` | Supabase REST wrapper; `normalise()` parses `amount` and `secondary_amount` from string to float |
| `js/store.js` | localStorage helpers for pot config only (not transactions) |
| `js/components/NavBar.js` | Bottom nav — Liste, Hinzufügen, Statistik |
| `js/components/AddTransaction.js` | Add/edit form; emits `'saved'`; `uiType` ref drives the three tabs |
| `js/components/TransactionList.js` | Grouped list; emits `'edit'`, `'settings'`; cogwheel opens settings |
| `js/components/Statistics.js` | 30-day / month breakdown with category bars; uses consumed amount |
| `js/components/Settings.js` | Supabase credential form + CSV/JSON export; emits `'saved'` |
| `css/style.css` | All styles, mobile-first |
| `sw.js` | Service worker; bump `CACHE_NAME` version after any file changes |

## Data flow

`app.js` fetches all transactions on mount and after every mutation (`refresh()`), passes them as props to `TransactionList` and `Statistics`. `AddTransaction` writes via `db.js` then emits `'saved'`.

## Transaction shape

```js
{
  id, type,             // 'expense' | 'transfer'
  title, amount,        // amount: float (DB stores NUMERIC, comes as string → normalised)
  spending_date,        // 'YYYY-MM-DD'
  consumption_from,     // 'YYYY-MM-DD' (defaults to spending_date)
  consumption_to,       // 'YYYY-MM-DD' | null (null = no distribution)
  from_pot, to_pot,     // pot id; to_pot only for transfers
  category,             // category id | null; only for expenses
  notes,
  secondary_pot,        // pot id | null; for split expenses (e.g. 'splitwise')
  secondary_amount,     // float | null; amount routed to secondary_pot
}
```

**Consumed amount** (used in statistics) = `amount − (secondary_amount ?? 0)`

## Splitwise / split payments

`AddTransaction` has a third tab `uiType = 'splitwise'` (UI-only; always saves as `type = 'expense'`).

- **Ich hat bezahlt**: stores full amount in `amount`, `from_pot` = payment source, `secondary_pot = 'splitwise'`, `secondary_amount` = their share (what they owe me). Notes prefixed with `Gesamt: X,XX €`.
- **Andere Person hat bezahlt**: stores my share in `amount`, `from_pot = 'splitwise'`, no secondary fields. Same notes prefix.
- Editing a transaction with `secondary_pot === 'splitwise'` re-opens the Splitwise tab.

## Working style

- **Ask before assuming** — when a feature request is ambiguous (e.g. a term like "Einkauf" could refer to a category or a pot), ask for clarification rather than guessing.
- **Changelog emoji convention** — use 🐛 for bug fixes and 🦋 for new features in `CHANGELOG.md`.
- **Keep docs up to date** — after every set of changes, update `CHANGELOG.md` (new version entry) and `PLAN.md` (new row in the completed table).

## Conventions

- All UI text is **German**
- Amounts shown without negative sign
- Form labels: spending_date → **Datum**, from_pot → **Zahlungsmittel**
- Consumption range hidden behind **Erweitert** accordion (expenses + splitwise)
- iOS PWA: `viewport-fit=cover`, `env(safe-area-inset-bottom)` on nav, `font-size: 16px` on inputs
