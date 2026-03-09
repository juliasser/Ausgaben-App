# Ausgaben App — Project Plan

> Based on voice transcript in `docs/Transcript.txt`.

---

## Project Overview

A personal **Progressive Web App (PWA)** to track personal spendings, hosted on GitHub Pages. Tracks money across multiple budget pots, distinguishes between spending date and consumption range, and syncs to Supabase.

**Tech stack:** Vue 3 via CDN (no build step), Supabase REST API, GitHub Pages.

---

## Core Concepts

- **Budget pots** — Bar, Karte, Splitwise, Paypal, Granada Karte
- **Transaction types** — `expense` (money out) or `transfer` (between pots)
- **Categories** (German, expenses only) — Einkauf, Essen, Transport, Gesundheit, Freizeit, Wohnen, Anschaffungen, Ausgehen, Sonstiges
- **Spending date** — when money left the account
- **Consumption range** — `consumption_from` (defaults to spending date) + optional `consumption_to`; if set, amount is spread evenly across the range in statistics

---

## Completed Phases

| Phase | Summary |
|-------|---------|
| 1 — Foundation | Vue CDN scaffold, PWA shell, GitHub Pages |
| 2 — Data layer | localStorage CRUD, pot config |
| 3 — Add/Edit screen | Full form with validation, Erweitert accordion for consumption range + notes |
| 4 — List screen | Grouped by date, tap to edit, category icons/colours |
| 5 — Statistics | Rolling 30-day + month selector, consumption distribution, category breakdown |
| 6 — PWA polish | manifest, service worker, placeholder icon |
| 7 — Supabase backend | REST API wrapper, settings screen, global transactions ref in app.js |

---

## Upcoming Phases

### Phase 8: Split Payments & Splitwise

#### Concept

Each transaction has a `from_pot` (source) and a destination. The destination is always split between:
- **null** — the consumed/spent portion (shows up in statistics)
- **`secondary_pot`** — an optional second pot that receives the remainder (e.g. Splitwise balance)

All "null" amounts across all transactions = total consumption.

---

#### Data model addition

Two new optional fields on expense transactions:

| Field | Type | Notes |
|-------|------|-------|
| `secondary_pot` | string \| null | Destination pot for the non-consumed portion |
| `secondary_amount` | number \| null | Amount going into `secondary_pot` |

**Consumption in statistics** = `amount − (secondary_amount ?? 0)`

The Splitwise pot balance = sum of all `secondary_amount` values pointing to it.
Positive balance = owed to me. Negative balance = I owe.

---

#### Concrete examples

**B — I paid the full 6€, split 50/50**
```
type:             expense
from_pot:         cash          ← 6€ leaves cash
amount:           6
secondary_pot:    splitwise
secondary_amount: 3             ← 3€ goes to Splitwise (they owe me)
                                ← null (consumed) = 6 − 3 = 3€
notes:            "Total: 6€"
```

**C — Other party paid the full 6€, split 50/50**
```
type:             expense
from_pot:         splitwise     ← 3€ debited from Splitwise (I owe them)
amount:           3
                                ← null (consumed) = 3 − 0 = 3€
notes:            "Total: 6€"
```

Case C is just a regular expense where the Splitwise pot is the source — no secondary fields needed. Case B is the only one that requires the new fields.

---

#### Splitwise tab in the form

A third tab alongside Ausgabe / Überweisung. Fields:

1. **Gesamtbetrag** — the full shared expense
2. **Wer hat bezahlt?** — toggle: Ich / Andere Person
3. **Mein Anteil** — defaults to 50%, editable (shows calculated €)
4. **Mein Zahlungsmittel** — only shown if "Ich" paid; which pot the full amount left
5. **Kategorie, Datum, Verbrauchszeitraum** — same as regular expense
6. Full amount auto-written to notes as reference

App computes and stores the fields automatically from the above inputs.

---

#### Implementation tasks

- [ ] **[Claude]** Update Supabase schema — add `secondary_pot`, `secondary_amount` columns
- [ ] **[Claude]** Add Splitwise tab to Add/Edit form
- [ ] **[Claude]** Update statistics to use `amount − (secondary_amount ?? 0)` as consumption

- [ ] **[You]** (Later) Splitwise API OAuth sync as a pre-fill helper — data model is already compatible

---

### Phase 9: Data Backup & Export

Two separate mechanisms:

**A — localStorage mirror (automatic, passive)**
After every Supabase fetch, write the full transaction array to localStorage as a safety net. Never read from it automatically — it's just there in case the backend goes away. Very easy (1–2 lines).

**B — CSV/JSON download (manual, on-demand)**
Button in the settings screen to download all transactions as a file. Easy to implement (~1–2 hours). CSV is most useful for opening in Excel/Numbers; JSON is better for a future reimport. Both can be offered.

- [ ] **[Claude]** Write transactions to localStorage after every fetch (key: `ausgaben_backup`)
- [ ] **[Claude]** Add download buttons to settings screen (CSV + JSON)
- [ ] **[Claude]** Optional: JSON import to restore from a backup file

---

### Phase 10: Design & Polish

- [ ] **[You]** Define color palette and typography preferences
- [ ] **[Claude]** Apply consistent design system
- [ ] **[You]** Consider proper app icon (replace SVG placeholder)

---

## Notes

- Repo is public — no secrets in code or config files ever
- Supabase credentials live in localStorage only
- The transcript that started this project is archived at `docs/Transcript.txt`
