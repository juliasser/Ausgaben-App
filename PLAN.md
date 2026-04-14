# Ausgaben App — Project Plan

## Completed

| Version | Summary |
|---------|---------|
| [v0.1](CHANGELOG.md#v01) | Vue CDN scaffold, PWA shell, GitHub Pages |
| [v0.2](CHANGELOG.md#v02) | localStorage CRUD, pot config |
| [v0.3](CHANGELOG.md#v03) | Add/Edit form with validation, Erweitert accordion |
| [v0.4](CHANGELOG.md#v04) | Transaction list grouped by date, tap to edit |
| [v0.5](CHANGELOG.md#v05) | Statistics: 30-day + month, consumption distribution, category bars |
| [v0.6](CHANGELOG.md#v06) | PWA polish: manifest, service worker, icon |
| [v0.7](CHANGELOG.md#v07) | Supabase backend: REST wrapper, settings screen |
| [v0.8](CHANGELOG.md#v08) | Split payments: secondary_pot/secondary_amount, Splitwise tab, statistics use consumed amount |
| [v0.9](CHANGELOG.md#v09) | localStorage backup after every fetch; CSV + JSON export in settings |
| [v0.10](CHANGELOG.md#v010) | Schulden pot, initial balances, saldo in statistics, Splitwise badge, collapsible filter panel |
| [v0.11](CHANGELOG.md#v011) | Bug fixes (note duplication, monthly average, double-tap zoom); Geschenke category, category accordion, distributed filter, Dieser Monat button, Einkauf default |
| [v0.12](CHANGELOG.md#v012) | Bug fixes (icon alignment, persistent filters, Splitwise "andere" pre-fill); shopping cart icon, whole-row tap in stats, per-pot balance tag, year bar chart in statistics |

<br/>

## Upcoming

### Design & Polish
- [ ] Define colour palette and typography
- [ ] Apply consistent design system
- [ ] Replace SVG placeholder icon

### Shared expenses (replacing Splitwise)

Replace the external Splitwise dependency with a built-in two-user shared ledger. No authentication — both users share the same Supabase project and identify themselves by a name set once in settings.

**DB migration**
- [ ] Add `user_id TEXT` column to transactions
- [ ] Add `linked_tx_id UUID NULL` to pair mirrored transactions

**App changes**
- [ ] Settings: add "Mein Name" field (stored in localStorage alongside credentials)
- [ ] Settings: add roommate name field (needed to tag mirrored transactions)
- [ ] `db.js`: tag every new transaction with `user_id` on save
- [ ] `AddTransaction.js`: when saving a splitwise "ich hat bezahlt" expense, auto-create a mirrored `from_pot=splitwise` transaction tagged with the roommate's `user_id`
- [ ] `AddTransaction.js`: when editing/deleting a splitwise expense with a `linked_tx_id`, also update/delete the mirror
- [ ] `TransactionList.js`: show a small "from [name]" badge on transactions created by the roommate

### Deferred
- [ ] JSON import (restore from backup file)
