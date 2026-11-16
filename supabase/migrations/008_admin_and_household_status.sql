-- 家庭创建审核状态 + 管理后台账号

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS status text;

UPDATE households
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE households
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE households
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE households DROP CONSTRAINT IF EXISTS households_status_check;
ALTER TABLE households
  ADD CONSTRAINT households_status_check CHECK (status IN ('pending', 'active'));

CREATE INDEX IF NOT EXISTS idx_households_status_created
  ON households (status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
