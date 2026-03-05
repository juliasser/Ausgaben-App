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

### Phase 8: Splitwise Integration

**Problem:** Some shared expenses are logged in Splitwise by the other party. The user's share counts as personal consumption but no money ever left any pot — so it can't be recorded as a regular expense.

**Goal:** A way to log "virtual" expenses — costs that were consumed but not directly paid — so they show up correctly in statistics without distorting pot balances.

**Open questions to resolve before implementation:**
- [ ] **[You]** What should the entry flow look like? Options:
  - A third transaction type `splitwise` alongside `expense` / `transfer`
  - A checkbox/flag on regular expenses ("not paid from any pot")
  - Always use the Splitwise pot but mark it as a "virtual" pot (no real balance)
- [ ] **[You]** Should the amount entered be the full shared amount (app halves it) or the user's share already?
- [ ] **[You]** Should these entries be visually distinct in the list?

**Implementation tasks (once design is decided):**
- [ ] **[Claude]** Update data model / transaction type if needed
- [ ] **[Claude]** Update Add/Edit form to support the new flow
- [ ] **[Claude]** Ensure statistics correctly include virtual expenses in consumption totals
- [ ] **[Claude]** Ensure virtual expenses are visually distinguishable in the list

---

### Phase 9: Data Backup & Export

- [ ] **[You]** Decide on backup format — options:
  - **JSON download** — full fidelity, can be reimported later
  - **CSV download** — easy to open in Excel/Numbers, no reimport
  - Both
- [ ] **[Claude]** Add export button (in settings screen) that downloads all transactions
- [ ] **[Claude]** Optional: JSON import to restore from a backup

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
