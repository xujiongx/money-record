-- 大事记账：与日常 transactions 隔离，复用同一家庭 members（布布 / 一二）

CREATE TABLE major_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  title text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE major_event_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES major_events (id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members (id) ON DELETE RESTRICT,
  category text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_major_events_household_created
  ON major_events (household_id, created_at DESC);

CREATE INDEX idx_major_event_expenses_event_occurred
  ON major_event_expenses (event_id, occurred_at DESC);

CREATE INDEX idx_major_event_expenses_household_occurred
  ON major_event_expenses (household_id, occurred_at DESC);

ALTER TABLE major_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE major_event_expenses ENABLE ROW LEVEL SECURITY;
