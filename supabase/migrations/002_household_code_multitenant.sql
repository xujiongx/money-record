-- 从旧版（无 code、带 anon RLS）升级到多家庭编码模型
-- 若你已从零执行新版 001_init.sql，可跳过本文件

ALTER TABLE households ADD COLUMN IF NOT EXISTS code text;

UPDATE households
SET code = '000001'
WHERE code IS NULL
  AND id = 'a0000000-0000-4000-8000-000000000001'::uuid;

-- 若仍有 code 为 NULL 的行，请在控制台手工为每行设置互不重复的 6 位数字后再执行下方 NOT NULL

ALTER TABLE households ALTER COLUMN code SET NOT NULL;

ALTER TABLE households DROP CONSTRAINT IF EXISTS households_code_check;
ALTER TABLE households ADD CONSTRAINT households_code_check CHECK (code ~ '^[0-9]{6}$');

CREATE UNIQUE INDEX IF NOT EXISTS households_code_unique ON households (code);

DROP POLICY IF EXISTS households_select_anon ON households;
DROP POLICY IF EXISTS members_select_anon ON members;
DROP POLICY IF EXISTS transactions_select_anon ON transactions;
