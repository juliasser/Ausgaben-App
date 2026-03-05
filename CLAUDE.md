# CLAUDE.md — Ausgaben App

## Tech stack

- **Vue 3 via CDN** — ES modules, no build step; components are `.js` files with template strings (no SFCs)
- **Supabase** for data — REST API via `fetch`, no SDK; credentials in localStorage
- Entry: `index.html` → `js/app.js`

## Key files

| File | Purpose |
|------|---------|
| `js/app.js` | App root; global `transactions` ref, `refresh()`, screen routing (`currentScreen`) |
| `js/config.js` | `BUDGET_POTS`, `CATEGORIES`, `TRANSFER_META` |
| `js/db.js` | Supabase REST wrapper; `normalise()` parses amount string to float |
| `js/store.js` | localStorage helpers for pot config only (not transactions) |
| `js/components/NavBar.js` | Bottom nav — Liste, Hinzufügen, Statistik |
| `js/components/AddTransaction.js` | Add/edit form; emits `'saved'` |
| `js/components/TransactionList.js` | Grouped list; emits `'edit'`, `'settings'`; cogwheel opens settings |
| `js/components/Statistics.js` | 30-day / month breakdown with category bars |
| `js/components/Settings.js` | Supabase credential form; emits `'saved'` |
| `css/style.css` | All styles, mobile-first |
| `sw.js` | Service worker; bump `CACHE_NAME` version after any file changes |

## Data flow

`app.js` fetches all transactions on mount and after every mutation (`refresh()`), passes them as props to `TransactionList` and `Statistics`. `AddTransaction` writes via `db.js` then emits `'saved'`.

## Transaction shape

```js
{
  id, type,           // 'expense' | 'transfer'
  title, amount,      // amount: float (DB stores NUMERIC, comes as string → normalised)
  spending_date,      // 'YYYY-MM-DD'
  consumption_from,   // 'YYYY-MM-DD' (defaults to spending_date)
  consumption_to,     // 'YYYY-MM-DD' | null (null = no distribution)
  from_pot, to_pot,   // pot id; to_pot only for transfers
  category,           // category id | null; only for expenses
  notes,
}
```

## Conventions

- All UI text is **German**
- Amounts shown without negative sign
- Form labels: spending_date → **Datum**, from_pot → **Zahlungsmittel**
- Consumption range hidden behind **Erweitert** accordion (expenses only)
- iOS PWA: `viewport-fit=cover`, `env(safe-area-inset-bottom)` on nav, `font-size: 16px` on inputs
