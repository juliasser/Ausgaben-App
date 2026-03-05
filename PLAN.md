# Ausgaben App — Project Plan

> Based on voice transcript in `docs/Transcript.txt`.

---

## Project Overview

A personal **Progressive Web App (PWA)** to track personal spendings, hosted on GitHub Pages. The app tracks money across multiple "budget pots" (cash, bank account, Splitwise, etc.) and distinguishes between the date something was *spent* and the date it was *consumed*.

---

## Core Concepts

### Budget Pots
Named containers for money. Currently planned:
- **Bank** — main bank account
- **Cash** — physical cash (topped up via ATM withdrawals)
- **Splitwise** — shared expenses tracked with girlfriend

Budget pots can be expanded later.

### Transaction Types
| Type | Description | Example |
|------|-------------|---------|
| `expense` | Money leaves a budget pot for a real purchase | Buying groceries |
| `transfer` | Money moves between two budget pots | ATM withdrawal (Bank → Cash) |

### Categories
Applied to `expense` transactions (not transfers):

| Category | German |
|----------|--------|
| Shopping | Einkauf |
| Food & Dining | Essen |
| Transport | Transport |
| Health | Gesundheit |
| Leisure | Freizeit |
| Housing | Wohnen |
| Purchases | Anschaffungen |
| Going Out | Ausgehen |
| Other | Sonstiges |

> The UI will display category names in German.

### Spending Date vs. Consumption Range
- **Spending date** — when the money actually left the account
- **Consumption from** — start of the consumption period; defaults to `spending_date`
- **Consumption to** — end of the consumption period; optional
  - `null` → no distribution; the full amount counts on `consumption_from`
  - set → distribution activated; the amount is spread evenly across every day in the range `[consumption_from, consumption_to]`
- Example — festival ticket: spending_date = purchase date, consumption_from = festival start, consumption_to = festival end
- Example — annual fee: consumption_from = Jan 1, consumption_to = Dec 31 → averaged to a daily cost

---

## Fields per Transaction

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | auto | Unique identifier |
| `title` | string | yes | Name/description of the spending |
| `amount` | number | yes | In EUR (or chosen currency) |
| `spending_date` | date | yes | When money left the account |
| `consumption_from` | date | no | Start of consumption period; defaults to `spending_date` |
| `consumption_to` | date | no | End of consumption period; `null` = no distribution, set = spread amount evenly across range |
| `from_pot` | string | yes | Source budget pot (Bank, Cash, Splitwise, …) |
| `to_pot` | string | for transfers | Destination budget pot (for transfers only) |
| `type` | enum | yes | `expense` or `transfer` |
| `category` | enum | for expenses | One of the 9 categories (see above); not used for transfers |
| `notes` | string | no | Free-form notes |

---

## Screens

### 1. Add / Edit Transaction
- Form with all fields above
- Toggle between `expense` and `transfer` mode (hides/shows relevant fields)
- `consumption_from` defaults to `spending_date`; `consumption_to` is optional (enables distribution when set)
- Inline budget pot selector (dropdown from configured budget pots)
- Category picker (only shown for expenses, German labels)

### 2. Transaction List
- All transactions sorted by `spending_date` (descending)
- Shows: date, title, amount, budget pot, category, type badge
- Tap to edit or delete

### 3. Statistics
Two switchable views:

**Spending view** — "What did I pay, and when?"
- Daily/weekly/monthly totals by `spending_date`
- Useful for cash flow

**Consumption view** — "What did I consume, and when?"
- Daily/weekly/monthly totals based on consumption range
- If `consumption_to` is null: full amount lands on `consumption_from`
- If `consumption_to` is set: amount is spread evenly across `[consumption_from, consumption_to]`
- Shows a "true" daily cost of living

Both views can filter by budget pot, category, and date range.

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

- [x] **[Claude]** Read transcript and create project plan
- [x] **[Claude]** Create project folder structure
- [x] **[You]** Choose tech stack → **Vue 3 via CDN (no build step)**
- [x] **[You]** Decide on initial budget pots → Bar, Karte, Splitwise, Paypal, Granada Karte
- [x] **[Claude]** Scaffold base app (HTML shell, manifest.json, service worker stub)
- [x] **[You]** Configure GitHub Pages in repo settings (Settings → Pages → branch: `main`, folder: `/`)

---

### Phase 2: Data Layer

- [x] **[Claude]** Implement localStorage data layer (create, read, update, delete transactions)
- [x] **[Claude]** Implement budget pot configuration (stored in localStorage, editable)
- [x] **[You]** Review data model — confirmed, fields and types are good as-is

---

### Phase 3: Add / Edit Screen

- [x] **[Claude]** Build "Add Transaction" form (expense mode)
- [x] **[Claude]** Build transfer mode toggle (from_pot → to_pot)
- [x] **[Claude]** Add `consumption_from` (default = spending_date) and optional `consumption_to` fields; show distribution indicator when range is set
- [x] **[Claude]** Form validation (required fields, valid amounts)
- [ ] **[You]** Review and give feedback on form UX

---

### Phase 4: List Screen

- [x] **[Claude]** Build transaction list sorted by spending_date
- [x] **[Claude]** Add edit and delete actions per item
- [ ] **[You]** Review list and give feedback on what information to show per row

---

### Phase 5: Statistics Screen

- [ ] **[You]** Define what statistics matter most to you (e.g., weekly total? monthly by pot? rolling 30-day average?)
- [ ] **[Claude]** Implement spending-date view with daily/weekly/monthly aggregation
- [ ] **[Claude]** Implement consumption-date view
- [ ] **[Claude]** Implement daily distribution logic: spread amount evenly across `[consumption_from, consumption_to]` when `consumption_to` is set
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

1. ~~**Tech stack**~~ → Vue 3 via CDN
2. ~~**Budget pot names**~~ → Bar, Karte, Splitwise, Paypal, Granada Karte
3. **Currency** — Single currency (EUR) for now?
4. **Consumption range UX** — When entering a transaction, should `consumption_from` always be shown (pre-filled with spending_date), or hidden by default and only revealed via an "advanced" toggle?
5. **Statistics defaults** — What time range do you want to see first when opening the stats screen?

---

## Notes

- Repo will eventually be public → no secrets in code or config files
- The transcript that started this project is archived at `docs/Transcript.txt`
