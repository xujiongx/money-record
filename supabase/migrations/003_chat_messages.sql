-- 小布助手：按家庭持久化对话（Service Role 访问，RLS 无 anon 策略）

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_household_created ON chat_messages (household_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
