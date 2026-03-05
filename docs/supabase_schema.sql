-- ============================================================
-- Ausgaben App — Supabase schema
-- Run this in the Supabase SQL editor (Database → SQL Editor)
-- ============================================================


-- ── Transactions ─────────────────────────────────────────────

CREATE TABLE transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT        NOT NULL CHECK (type IN ('expense', 'transfer')),
  title            TEXT        NOT NULL,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  spending_date    DATE        NOT NULL,
  consumption_from DATE        NOT NULL,
  consumption_to   DATE,                         -- NULL = no distribution
  from_pot         TEXT        NOT NULL,
  to_pot           TEXT,                         -- transfers only
  category         TEXT,                         -- expenses only
  notes            TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for the two main access patterns:
--   1. List screen  → sorted by spending_date DESC
--   2. Stats screen → filter/sort by consumption_from
CREATE INDEX idx_transactions_spending_date    ON transactions (spending_date    DESC);
CREATE INDEX idx_transactions_consumption_from ON transactions (consumption_from ASC);


-- ── Row Level Security ───────────────────────────────────────
--
-- This is a single-user personal app.
-- Two options — choose one:
--
-- OPTION A (simpler): disable RLS entirely.
--   Access is protected only by keeping your anon key private.
--   Fine for a private project where the key never leaks.

ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- OPTION B (recommended if you ever share the codebase or repo):
--   Enable RLS and lock the table to authenticated users only.
--   Requires adding a login screen (Supabase Auth).
--   To switch to this option:
--     1. Comment out the DISABLE line above
--     2. Uncomment the lines below

-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Authenticated users only"
--   ON transactions
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
