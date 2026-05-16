-- ============================================================
-- Arc Arena — Polymarket UI Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Sub-markets table (for multi-row cards like Polymarket)
CREATE TABLE IF NOT EXISTS event_sub_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Event outcomes table (buttons like Yes/No, Win/Draw/Lose)
CREATE TABLE IF NOT EXISTS event_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sub_market_id UUID REFERENCES event_sub_markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add outcome_id to stakes (optional — links a stake to a specific outcome)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stakes' AND column_name = 'outcome_id'
  ) THEN
    ALTER TABLE stakes ADD COLUMN outcome_id UUID REFERENCES event_outcomes(id);
  END IF;
END $$;

-- 4. Add winning_outcome_id to events (tracks which outcome won)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'winning_outcome_id'
  ) THEN
    ALTER TABLE events ADD COLUMN winning_outcome_id UUID REFERENCES event_outcomes(id);
  END IF;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_event_sub_markets_event_id ON event_sub_markets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_outcomes_event_id ON event_outcomes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_outcomes_sub_market_id ON event_outcomes(sub_market_id);
CREATE INDEX IF NOT EXISTS idx_stakes_outcome_id ON stakes(outcome_id);

-- 6. RLS for event_sub_markets
ALTER TABLE event_sub_markets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_sub_markets_read') THEN
    CREATE POLICY event_sub_markets_read ON event_sub_markets FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_sub_markets_admin_insert') THEN
    CREATE POLICY event_sub_markets_admin_insert ON event_sub_markets FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_sub_markets_admin_update') THEN
    CREATE POLICY event_sub_markets_admin_update ON event_sub_markets FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_sub_markets_admin_delete') THEN
    CREATE POLICY event_sub_markets_admin_delete ON event_sub_markets FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

-- 7. RLS for event_outcomes
ALTER TABLE event_outcomes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_outcomes_read') THEN
    CREATE POLICY event_outcomes_read ON event_outcomes FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_outcomes_admin_insert') THEN
    CREATE POLICY event_outcomes_admin_insert ON event_outcomes FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_outcomes_admin_update') THEN
    CREATE POLICY event_outcomes_admin_update ON event_outcomes FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'event_outcomes_admin_delete') THEN
    CREATE POLICY event_outcomes_admin_delete ON event_outcomes FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );
  END IF;
END $$;

-- Done!
-- After running this, the admin API can now create events with outcomes and sub-markets.
-- Run the winning_outcome_id migration (section 4) if you haven't already.
