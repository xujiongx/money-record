-- 大事记账分类：按家庭自定义，默认仅「其他」

CREATE TABLE major_event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT major_event_categories_household_name_unique UNIQUE (household_id, name)
);

CREATE INDEX idx_major_event_categories_household_sort
  ON major_event_categories (household_id, sort_order, created_at);

ALTER TABLE major_event_categories ENABLE ROW LEVEL SECURITY;

-- 已有家庭补默认分类
INSERT INTO major_event_categories (household_id, name, sort_order)
SELECT h.id, '其他', 0
FROM households h
WHERE NOT EXISTS (
  SELECT 1 FROM major_event_categories c WHERE c.household_id = h.id
);
