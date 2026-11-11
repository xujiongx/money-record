-- 日常账本分类：按家庭 + 收支类型自定义；迁移时写入现有默认清单

CREATE TABLE ledger_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_categories_household_type_name_unique UNIQUE (household_id, type, name)
);

CREATE INDEX idx_ledger_categories_household_type_sort
  ON ledger_categories (household_id, type, sort_order, created_at);

ALTER TABLE ledger_categories ENABLE ROW LEVEL SECURITY;

-- 已有家庭补默认支出分类
INSERT INTO ledger_categories (household_id, type, name, sort_order)
SELECT h.id, 'expense', v.name, v.sort_order
FROM households h
CROSS JOIN (
  VALUES
    ('餐饮', 0),
    ('购物', 1),
    ('住宿', 2),
    ('交通', 3),
    ('娱乐', 4),
    ('还款', 5),
    ('旅行', 6),
    ('教育', 7),
    ('医疗', 8),
    ('其他', 9)
) AS v(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM ledger_categories c
  WHERE c.household_id = h.id AND c.type = 'expense'
);

-- 已有家庭补默认收入分类
INSERT INTO ledger_categories (household_id, type, name, sort_order)
SELECT h.id, 'income', v.name, v.sort_order
FROM households h
CROSS JOIN (
  VALUES
    ('工资', 0),
    ('奖金', 1),
    ('投资', 2),
    ('红包', 3),
    ('其他', 4)
) AS v(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM ledger_categories c
  WHERE c.household_id = h.id AND c.type = 'income'
);
