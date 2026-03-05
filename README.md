# Ausgaben App

A personal spending tracker built as a Progressive Web App (PWA), hosted on GitHub Pages. Tracks expenses and transfers across multiple budget pots, with support for spreading costs over a consumption date range.

## Features

- **Expenses & transfers** — log spending or move money between budget pots
- **Consumption ranges** — spread a cost (e.g. a festival ticket or annual fee) evenly across a date range for accurate daily cost tracking
- **Statistics** — rolling 30-day view or month-by-month breakdown, with per-category bars
- **Offline-capable** — service worker caches all assets
- **Installable** — add to home screen on iOS and Android

## Backend Setup (Supabase)

The app stores all data in a [Supabase](https://supabase.com) project via its REST API. No SDK required — just a project URL and an anon key.

### 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) and create a new project.

### 2. Run the schema

In your Supabase dashboard go to **Database → SQL Editor**, paste the contents of [`docs/supabase_schema.sql`](docs/supabase_schema.sql), and run it. This creates the `transactions` table, indexes, and an `updated_at` trigger.

### 3. Get your credentials

In **Project Settings → API** you'll find:

- **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
- **Anon / public key** — the `anon` key under "Project API keys"

### 4. Enter credentials in the app

Open the app, tap the cogwheel icon in the top-right corner of the list screen, and paste in your Project URL and anon key. Tap **Verbindung testen** to verify, then **Speichern**.

Credentials are stored in `localStorage` and never committed to the repository.

### Security note

With RLS disabled (the default in the schema), your anon key is the only thing protecting your data. Keep it out of any public repository. If you want stronger protection, see the commented-out Option B in the SQL file, which restricts access to authenticated users via Supabase Auth.

## Project Structure

```
/
├── css/
│   └── style.css               # All styles (mobile-first)
├── docs/
│   ├── supabase_schema.sql     # Run this to set up the database
│   └── Transcript.txt          # Original voice memo that started the project
├── js/
│   ├── app.js                  # Vue app root, global state
│   ├── config.js               # Budget pots and categories
│   ├── db.js                   # Supabase REST API wrapper
│   ├── store.js                # localStorage (pot configuration)
│   └── components/
│       ├── NavBar.js
│       ├── AddTransaction.js
│       ├── TransactionList.js
│       ├── Statistics.js
│       └── Settings.js
├── index.html
├── manifest.json
├── sw.js                       # Service worker (cache-first)
├── icon.svg
└── PLAN.md                     # Phased project plan
```

## Tech Stack

- **Vue 3** via CDN (ES modules, no build step)
- **Supabase** for data storage (REST API, no SDK)
- **GitHub Pages** for hosting

## Disclaimer

This software is provided "as is", without warranty of any kind. The author is not responsible for any data loss, inaccuracies, or financial decisions made based on information displayed by this app. Use at your own risk.

## Credits

Built using the approach described by [Matt Webb](https://interconnected.org/home/2026/02/12/mist?utm_source=genmon&utm_medium=email&utm_campaign=interconnected-mist-share-and-edit-markdown-78b1) — using Claude as a collaborator to plan and build a personal app from a voice transcript.
