export type LedgerType = "income" | "expense";

export type MemberRow = {
  id: string;
  household_id: string;
  name: string;
  avatar_url: string | null;
  sort_order: number;
};

export type TransactionRow = {
  id: string;
  household_id: string;
  member_id: string;
  type: LedgerType;
  category: string;
  amount: number;
  note: string | null;
  occurred_at: string;
  members: { id: string; name: string } | null;
};

export function parseAmount(v: string | number): number {
  return typeof v === "number" ? v : parseFloat(v);
}
