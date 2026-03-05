# Ausgaben App — Project Plan

> Based on voice transcript in `docs/Transcript.txt`.

---

## Project Overview

A personal **Progressive Web App (PWA)** to track personal spendings, hosted on GitHub Pages. The app tracks money across multiple "pots" (cash, bank account, Splitwise, etc.) and distinguishes between the date something was *spent* and the date it was *consumed*.

---

## Core Concepts

### Pots
Named containers for money. Currently planned:
- **Bank** — main bank account
- **Cash** — physical cash (topped up via ATM withdrawals)
- **Splitwise** — shared expenses tracked with girlfriend

Pots can be expanded later.

### Transaction Types
| Type | Description | Example |
|------|-------------|---------|
| `expense` | Money leaves a pot for a real purchase | Buying groceries |
| `transfer` | Money moves between two pots | ATM withdrawal (Bank → Cash) |

### Spending Date vs. Consumption Date
- **Spending date** — when the money actually left the account
- **Consumption date** — when the purchase is actually "used"
- For most day-to-day purchases these are the same date
- For future events (e.g., festival tickets) they differ
- Annual/periodic fees can be spread across their consumption period for daily averages

---

## Fields per Transaction

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | auto | Unique identifier |
| `title` | string | yes | Name/description of the spending |
| `amount` | number | yes | In EUR (or chosen currency) |
| `spending_date` | date | yes | When money left the account |
| `consumption_date` | date | no | When it's consumed; defaults to spending_date |
| `from_pot` | string | yes | Source pot (Bank, Cash, Splitwise, …) |
| `to_pot` | string | for transfers | Destination pot (for transfers only) |
| `type` | enum | yes | `expense` or `transfer` |
| `notes` | string | no | Free-form notes |

---

## Screens

### 1. Add / Edit Transaction
- Form with all fields above
- Toggle between `expense` and `transfer` mode (hides/shows relevant fields)
- `consumption_date` defaults to `spending_date` but can be overridden
- Inline pot selector (dropdown from configured pots)

### 2. Transaction List
- All transactions sorted by `spending_date` (descending)
- Shows: date, title, amount, pot, type badge
- Tap to edit or delete

### 3. Statistics
Two switchable views:

**Spending view** — "What did I pay, and when?"
- Daily/weekly/monthly totals by `spending_date`
- Useful for cash flow

**Consumption view** — "What did I consume, and when?"
- Daily/weekly/monthly totals by `consumption_date`
- Annual/periodic fees are spread evenly across their consumption period
- Shows a "true" daily cost of living

Both views can filter by pot and date range.

---

## Tech Stack (to be decided)

Options to discuss before implementation starts:

| Option | Pros | Cons |
|--------|------|-------|
| Vanilla JS + HTML/CSS | Zero dependencies, fast to prototype | More boilerplate |
| Vue 3 (CDN, no build step) | Reactive UI, still simple | Slight learning curve |
| React (Vite) | Ecosystem, components | Requires build step & deploy pipeline |

**Recommended starting point:** Vanilla JS or Vue via CDN (no build step → simplest GitHub Pages deploy).

---

## Data Storage

### Phase 1 — Local Storage
- All data stored in browser `localStorage`
- No secrets, no backend, works offline
- Good for prototyping and personal single-device use

### Phase 2 — Backend (Future)
Options: **Supabase** (preferred: open-source, free tier, real-time) or **Airtable**

- API keys and config stored in `localStorage` (never in the repo)
- App reads config from localStorage on startup
- A settings screen will allow entering/updating keys

---

## Phases & To-Dos

Each task is marked with who owns it:
- **[You]** — requires your decision, input, or action
- **[Claude]** — can be implemented directly

---

### Phase 1: Foundation

- [x] **[Claude]** Read transcript and create project plan ← *you are here*
- [ ] **[Claude]** Create project folder structure
- [ ] **[You]** Choose tech stack (Vanilla JS, Vue, or React) — see options above
- [ ] **[You]** Decide on initial pots (names exactly as you want them in the app)
- [ ] **[Claude]** Scaffold base app (HTML shell, manifest.json, service worker stub)
- [ ] **[You]** Configure GitHub Pages in repo settings (Settings → Pages → branch: `main`, folder: `/` or `/docs`)

---

### Phase 2: Data Layer

- [ ] **[Claude]** Implement localStorage data layer (create, read, update, delete transactions)
- [ ] **[Claude]** Implement pot configuration (stored in localStorage, editable)
- [ ] **[You]** Review data model — confirm fields, names, and types are right for you

---

### Phase 3: Add / Edit Screen

- [ ] **[Claude]** Build "Add Transaction" form (expense mode)
- [ ] **[Claude]** Build transfer mode toggle (from_pot → to_pot)
- [ ] **[Claude]** Add consumption_date field with default = spending_date
- [ ] **[Claude]** Form validation (required fields, valid amounts)
- [ ] **[You]** Review and give feedback on form UX

---

### Phase 4: List Screen

- [ ] **[Claude]** Build transaction list sorted by spending_date
- [ ] **[Claude]** Add edit and delete actions per item
- [ ] **[You]** Decide what information to show per row (e.g., show consumption_date only if it differs?)

---

### Phase 5: Statistics Screen

- [ ] **[You]** Define what statistics matter most to you (e.g., weekly total? monthly by pot? rolling 30-day average?)
- [ ] **[Claude]** Implement spending-date view with daily/weekly/monthly aggregation
- [ ] **[Claude]** Implement consumption-date view
- [ ] **[Claude]** Implement daily average spread for periodic fees (consumption_date range)
- [ ] **[You]** Review stats screen and request adjustments

---

### Phase 6: PWA Polish

- [ ] **[Claude]** Finalize `manifest.json` (name, colors, display mode)
- [ ] **[Claude]** Implement service worker for offline support
- [ ] **[You]** Provide app icon (or ask Claude to generate a placeholder SVG)
- [ ] **[You]** Test "Add to Home Screen" on your phone

---

### Phase 7: Backend Integration (Future)

- [ ] **[You]** Decide between Supabase and Airtable
- [ ] **[You]** Create account and project; obtain API keys
- [ ] **[Claude]** Add settings screen for entering backend credentials (stored in localStorage)
- [ ] **[Claude]** Replace localStorage data layer with backend API calls
- [ ] **[Claude]** Handle sync conflicts (if using multiple devices)

---

### Phase 8: Design & Polish (Future)

- [ ] **[You]** Define color palette and typography preferences
- [ ] **[Claude]** Apply consistent design system
- [ ] **[You]** Consider currency support (single vs. multi-currency)
- [ ] **[You]** Consider data export (CSV, JSON)

---

## Open Questions (answer before Phase 3)

1. **Tech stack** — Vanilla JS, Vue (CDN), or React?
2. **Pot names** — Exact names as you want them (e.g., "Bank", "Cash", "Splitwise")?
3. **Currency** — Single currency (EUR) for now?
4. **Consumption date spread** — For a ticket bought today for a festival in 3 months, should the app ask for both dates explicitly, or derive the spread automatically?
5. **Statistics defaults** — What time range do you want to see first when opening the stats screen?

---

## Notes

- Repo will eventually be public → no secrets in code or config files
- The transcript that started this project is archived at `docs/Transcript.txt`
