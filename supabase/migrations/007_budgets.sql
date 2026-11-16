-- 家庭月度预算（日常支出）；scope=household 为总预算，scope=category 预留分类预算

CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  period_type text NOT NULL DEFAULT 'month' CHECK (period_type IN ('month')),
  period_key text NOT NULL CHECK (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  scope text NOT NULL CHECK (scope IN ('household', 'category')),
  category text NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_scope_category_check CHECK (
    (scope = 'household' AND category IS NULL)
    OR (scope = 'category' AND category IS NOT NULL AND length(trim(category)) > 0)
  )
);

CREATE UNIQUE INDEX budgets_household_month_unique
  ON budgets (household_id, period_type, period_key)
  WHERE scope = 'household';

CREATE UNIQUE INDEX budgets_category_month_unique
  ON budgets (household_id, period_type, period_key, category)
  WHERE scope = 'category';

CREATE INDEX idx_budgets_household_period
  ON budgets (household_id, period_type, period_key);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
