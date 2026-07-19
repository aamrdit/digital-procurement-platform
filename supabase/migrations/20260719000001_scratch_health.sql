-- Step 6 (Phase 1, "walking skeleton") scratch migration.
-- Throwaway table proving browser -> Nitro route -> Postgres -> browser
-- end-to-end. NOT part of the real schema (Backend Schema §6) — deleted in
-- Step 8 once the auth smoke test is proven.

CREATE TABLE health (
  id serial PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO health (checked_at) VALUES
  (now()),
  (now()),
  (now());

-- RLS: trivial permissive read policy. This table carries no tenant or user
-- data, so "anyone can read" is fine and expected for a scratch smoke-test
-- table (contrast with Backend Schema §8 patterns for real tables).
ALTER TABLE health ENABLE ROW LEVEL SECURITY;

CREATE POLICY health_select ON health
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS alone isn't sufficient: this project's local config leaves
-- `auto_expose_new_tables` at the new (unset/false) default (see
-- supabase/config.toml [api] comment), so newly created tables aren't
-- reachable through the Data API roles without an explicit GRANT. Table-level
-- privilege, on top of the RLS policy above.
GRANT SELECT ON health TO anon, authenticated;
