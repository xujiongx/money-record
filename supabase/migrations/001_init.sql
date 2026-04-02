-- 家庭记账：表结构 + 种子数据（布布、一二）
-- 固定 household UUID 需与 .env 中 NEXT_PUBLIC_HOUSEHOLD_ID 一致

CREATE TABLE households (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '我的家庭',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members (id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_household_occurred ON transactions (household_id, occurred_at DESC);

-- RLS：匿名仅可查本家庭（Realtime + 客户端读取）；写入仅服务端 Service Role
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY households_select_anon ON households
  FOR SELECT TO anon
  USING (id = 'a0000000-0000-4000-8000-000000000001'::uuid);

CREATE POLICY members_select_anon ON members
  FOR SELECT TO anon
  USING (household_id = 'a0000000-0000-4000-8000-000000000001'::uuid);

CREATE POLICY transactions_select_anon ON transactions
  FOR SELECT TO anon
  USING (household_id = 'a0000000-0000-4000-8000-000000000001'::uuid);

-- 种子
INSERT INTO households (id, name)
VALUES ('a0000000-0000-4000-8000-000000000001', '布布和一二的家');

INSERT INTO members (id, household_id, name, sort_order)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '布布', 1),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '一二', 2);

-- Realtime：在 Supabase 控制台「Database → Replication」中为 transactions 打开，
-- 或在 SQL 编辑器执行（需有足够权限）：
-- ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
