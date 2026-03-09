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

#### Concept: Secondary Pot

The core idea is a **secondary pot** — any expense can optionally be funded from two pots at once. This covers two distinct use cases:

**Use case 1 — Split payment across two real pots**
> Buy something for 6€, pay 4€ from Cash and 2€ from Card.
> Both pots are debited, total expense is 6€.

**Use case 2 — Shared expense via Splitwise**
> Buy something for 6€ shared 50/50. Splitwise is a pot that tracks the running balance of what is owed/owing.

---

#### Data model addition

Two new optional fields on every transaction:

| Field | Type | Notes |
|-------|------|-------|
| `secondary_pot` | string \| null | ID of the second pot |
| `secondary_amount` | number \| null | Amount attributed to secondary pot; can be negative |

`amount` stays as the **total** transaction amount (what shows in stats as consumption).
The primary pot is debited: `amount − secondary_amount`.
The secondary pot is debited/credited: `secondary_amount`.

---

#### Concrete examples

**A — Split payment (4€ Cash + 2€ Card = 6€ total)**
```
type:             expense
amount:           6        ← total, used in statistics
from_pot:         cash     ← debited: 6 − 2 = 4€
secondary_pot:    card
secondary_amount: 2        ← card debited 2€
```

**B — Splitwise: I paid the full 6€, split 50/50**
```
type:             expense
amount:           3        ← my share = my consumption
from_pot:         cash     ← debited: 3 − (−3) = 6€ (I paid all)
secondary_pot:    splitwise
secondary_amount: −3       ← Splitwise credited +3 (they owe me)
notes:            "Total: 6€"
```

**C — Splitwise: other party paid the full 6€, split 50/50**
```
type:             expense
amount:           3        ← my share = my consumption
from_pot:         (none / null)  ← I paid 0 from any real pot
secondary_pot:    splitwise
secondary_amount: −3       ← Splitwise debited −3 (I owe them)
notes:            "Total: 6€"
```

The Splitwise pot balance = sum of all secondary_amounts toward it.
Positive = net owed to me. Negative = net I owe.

---

#### Splitwise tab in the form

A third tab alongside Ausgabe / Überweisung. Fields:

1. **Gesamtbetrag** — the full shared expense
2. **Wer hat bezahlt?** — toggle: Ich / Andere Person
3. **Mein Anteil** — defaults to 50%, editable (shows calculated €)
4. **Mein Zahlungsmittel** — only shown if "Ich" paid; which pot the full amount left
5. **Kategorie, Datum, Verbrauchszeitraum** — same as regular expense
6. Full amount auto-written to notes as reference

App computes and stores the correct `amount`, `from_pot`, `secondary_pot: 'splitwise'`, `secondary_amount` based on the above.

---

#### Open questions before implementation

- [ ] **[You]** Confirm the sign convention in examples B/C above reads correctly to you
- [ ] **[You]** Should "Andere Person" cases require selecting a pot at all, or is `from_pot: null` fine?
- [ ] **[You]** Should split payments (use case 1) be accessible from the regular Ausgabe tab (as an optional field), or only from the Splitwise tab?

#### Implementation tasks (once questions resolved)

- [ ] **[Claude]** Update Supabase schema — add `secondary_pot`, `secondary_amount` columns
- [ ] **[Claude]** Add Splitwise tab to Add/Edit form
- [ ] **[Claude]** Update list to show Splitwise entries distinctly (no pot label or "Splitwise" badge)
- [ ] **[Claude]** Ensure statistics use `amount` (my share) for consumption totals
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
