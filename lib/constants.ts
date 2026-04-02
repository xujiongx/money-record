/** 与 supabase/migrations/001_init.sql 中种子 household id 一致 */
export const HOUSEHOLD_ID =
  process.env.NEXT_PUBLIC_HOUSEHOLD_ID ??
  "a0000000-0000-4000-8000-000000000001";
