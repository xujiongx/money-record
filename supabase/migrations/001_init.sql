-- 家庭记账：表结构 + 种子数据（布布、一二）
-- 每个家庭一条 households 记录，用 6 位数字 code 作为进入应用的「家庭编码」

CREATE TABLE households (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '我的家庭',
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT households_code_check CHECK (code ~ '^[0-9]{6}$'),
  CONSTRAINT households_code_unique UNIQUE (code)
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

-- RLS：不授予 anon 策略，数据仅通过服务端 Service Role 访问（按 Cookie 中的家庭编码解析 household_id）
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 默认家庭：编码 000001（布布、一二）
INSERT INTO households (id, name, code)
VALUES ('a0000000-0000-4000-8000-000000000001', '布布和一二的家', '000001');

INSERT INTO members (id, household_id, name, sort_order)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '布布', 1),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '一二', 2);

-- 示例第二个家庭：编码 000002（可自行删除或改码）
INSERT INTO households (id, name, code)
VALUES ('d0000000-0000-4000-8000-000000000001', '示例家庭乙', '000002');

INSERT INTO members (id, household_id, name, sort_order)
VALUES
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '成员甲', 1),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '成员乙', 2);
