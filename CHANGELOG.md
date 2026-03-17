# Changelog

Versions in reverse order (newest first).

<br/>

## v0.11

### Bug fixes & new features

**Bug fixes**

- 🐛 Splitwise: editing a transaction no longer duplicates the `Gesamt: …` note prefix
- 🐛 Statistics: current-month daily average now divides by elapsed days, not the full month length
- 🐛 iOS: disabled double-tap-to-zoom via `touch-action: manipulation` on `body`

**New features**

- 🦋 **Geschenke** category added (purple, gift icon)
- 🦋 Splitwise tab now defaults `category` to *Einkauf* when opening a new transaction
- 🦋 Statistics: category rows are now expandable — tap to see individual transactions with date, title, and their period contribution
- 🦋 Transaction list: new *Verteilt* filter chip to show only distributed (multi-day) transactions
- 🦋 Add/Edit form: *Dieser Monat* button in the Erweitert section fills the consumption range with the first and last day of the current month

<br/>

## v0.10

### Post-launch improvements

- 🦋 **Schulden pot** added to the default pot list
- 🦋 **Initial balances** — settings screen now has a section to enter a starting balance for each pot, which is factored into the all-time saldo calculation
- 🦋 **Statistics: Salden** section added showing all-time pot balances
- 🦋 **Splitwise badge** on the navigation bar shows the current Splitwise pot balance at a glance
- 🦋 **Collapsible filter panel** in the transaction list (pot chips + date range); the filter icon highlights when a filter is active; a summary line shows entry count and total

<br/>

## v0.9

### Data Backup & Export

**A — localStorage mirror (automatic, passive)**

After every Supabase fetch, the full transaction array is written to `localStorage['ausgaben_backup']` as a safety net. It is never read back automatically — it's only there in case the backend becomes unavailable.

**B — CSV / JSON download (manual, on-demand)**

The settings screen gained an "Exportieren" section with two download buttons. Both read from the localStorage backup, so export works even offline.

- 🦋 **CSV** — semicolon-delimited, UTF-8 BOM prefix for correct rendering in Excel/Numbers on Windows and macOS. Columns: `id, type, title, amount, spending_date, consumption_from, consumption_to, from_pot, to_pot, category, notes, secondary_pot, secondary_amount`.
- 🦋 **JSON** — raw array dump of the same data, useful for archival or a future import.

Deferred: JSON import to restore from a backup file.

<br/>

## v0.8

### Split Payments & Splitwise

#### Concept

Each expense transaction has a `from_pot` (where the full amount leaves) and can optionally route part of that amount into a `secondary_pot`. The remainder — what stays "unrouted" — is the consumed portion that shows up in statistics.

```
consumed = amount − (secondary_amount ?? 0)
```

This makes the **Splitwise pot** a balance tracker: positive = others owe me, negative = I owe others.

#### Data model additions

Two new nullable columns on the `transactions` table:

| Field | Type | Description |
|-------|------|-------------|
| `secondary_pot` | `text \| null` | Destination pot for the non-consumed portion |
| `secondary_amount` | `numeric \| null` | Amount routed into `secondary_pot` |

#### Concrete examples

**I paid the full 6 €, split 50/50**
```
type:             expense
from_pot:         cash          ← 6 € leaves cash
amount:           6
secondary_pot:    splitwise
secondary_amount: 3             ← 3 € credited to Splitwise (they owe me)
consumed:                       ← 6 − 3 = 3 € (my share)
notes:            "Gesamt: 6,00 €"
```

**Other person paid the full 6 €, split 50/50**
```
type:             expense
from_pot:         splitwise     ← 3 € debited from Splitwise (I owe them)
amount:           3
consumed:                       ← 3 − 0 = 3 € (my share)
notes:            "Gesamt: 6,00 €"
```

The second case is just a regular expense with Splitwise as the payment source — no secondary fields needed.

#### Splitwise tab in the Add/Edit form

A third tab alongside *Ausgabe* and *Überweisung*. The tab is UI-only; it always saves as `type = 'expense'`.

Fields:
1. **Gesamtbetrag** — the full shared expense amount
2. **Wer hat bezahlt?** — toggle: *Ich* / *Andere Person*
3. **Mein Anteil** — euro amount, defaults to 50% of Gesamtbetrag; resets to 50% whenever Gesamtbetrag changes; shows the other person's share live
4. **Mein Zahlungsmittel** — only shown when *Ich* paid; which pot the full amount left (Splitwise excluded)
5. **Titel, Kategorie, Datum, Erweitert** — same as a regular expense; notes prefixed with `Gesamt: X,XX €` automatically

The app computes and stores `amount`, `from_pot`, `secondary_pot`, and `secondary_amount` from these inputs. Editing a transaction that has `secondary_pot === 'splitwise'` re-opens the Splitwise tab.

#### Design evolution

The original design explored signed amounts and a broader "secondary pot for any two-pot split" concept (e.g. 4 € Cash + 2 € Card for a 6 € purchase). The final design simplified to: `amount` = what left the primary pot, `secondary_amount` = the portion going to the secondary pot (always positive). The general two-pot split was left for a future version if needed.

<br/>

## v0.7

### Supabase Backend

Replaced the localStorage data layer with a Supabase REST API backend.

- 🦋 Plain `fetch()` calls throughout — no Supabase SDK
- 🦋 `db.js` wraps all CRUD: `fetchTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction`, plus a `testConnection` helper
- 🦋 `normalise()` converts Supabase's NUMERIC strings to JavaScript floats
- 🦋 Credentials (project URL + anon key) stored in localStorage; never in code or config files
- 🦋 Settings screen added for entering and testing credentials
- 🦋 `app.js` holds a global `transactions` ref and a `refresh()` function called after every mutation

<br/>

## v0.6

### PWA Polish

- 🦋 `manifest.json` with name, short name, theme colour, display mode, and icon reference
- 🦋 Service worker (`sw.js`) with cache-first strategy for local assets and network-first for CDN resources (Vue)
- 🦋 Placeholder SVG app icon
- 🦋 Tested "Add to Home Screen" flow on iOS; `viewport-fit=cover` and `env(safe-area-inset-bottom)` applied to the nav bar

<br/>

## v0.5

### Statistics

Two switchable time-window modes:

- 🦋 **30 Tage** — rolling window ending today
- 🦋 **Monat** — calendar month selector with prev/next navigation

Statistics are consumption-based: each expense's amount is distributed evenly across its `[consumption_from, consumption_to]` range and only the portion overlapping the selected window counts. Expenses without a range land entirely on `consumption_from`.

Display:
- 🦋 **Gesamt** and **Ø pro Tag** summary cards
- 🦋 Category breakdown with colour-coded bars and amounts, sorted by size

<br/>

## v0.4

### Transaction List

- 🦋 Transactions grouped by `spending_date` (descending), with a date header and daily total per group
- 🦋 Each row shows a coloured category icon, title, pot/category meta, and amount
- 🦋 Tap any row to open the edit form
- 🦋 Cogwheel button in the header opens the settings screen

<br/>

## v0.3

### Add / Edit Screen

- 🦋 Single form used for both adding new transactions and editing existing ones
- 🦋 **Ausgabe** / **Überweisung** tab toggle; relevant fields shown/hidden per mode
- 🦋 Large euro amount input at the top
- 🦋 **Erweitert** accordion (expenses only) for `consumption_from`, optional `consumption_to`, and notes; shows a "N Tage → X €/Tag" hint when a range is set
- 🦋 `consumption_from` tracks `spending_date` automatically unless the user edits it manually
- 🦋 Full validation with inline error messages
- 🦋 Delete with confirmation step (edit mode only)

<br/>

## v0.2

### Data Layer

- 🦋 localStorage CRUD for transactions
- 🦋 Budget pot configuration stored in localStorage and editable at runtime
- 🦋 Data model finalised: `id`, `type`, `title`, `amount`, `spending_date`, `consumption_from`, `consumption_to`, `from_pot`, `to_pot`, `category`, `notes`

Budget pots confirmed: Bar, Karte, Splitwise, Paypal, Granada Karte.

<br/>

## v0.1

### Foundation

- 🦋 Project folder structure created
- 🦋 Vue 3 via CDN chosen (no build step, no node_modules)
- 🦋 HTML shell (`index.html`) with PWA meta tags, `viewport-fit=cover`, and module script entry point
- 🦋 `manifest.json` and service worker stub
- 🦋 GitHub Pages configured (branch: `main`, root folder)
