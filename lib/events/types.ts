export type MajorEventStatus = "active" | "archived";

export type MajorEventRow = {
  id: string;
  household_id: string;
  title: string;
  note: string | null;
  status: MajorEventStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

/** 列表页附带支出汇总 */
export type MajorEventListItem = MajorEventRow & {
  expense_total: number;
  expense_count: number;
};

export type MajorEventExpenseRow = {
  id: string;
  household_id: string;
  event_id: string;
  member_id: string;
  category: string;
  amount: number;
  note: string | null;
  occurred_at: string;
  members: { id: string; name: string } | null;
};

export type MajorEventCategoryRow = {
  id: string;
  household_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export function parseEventAmount(v: string | number): number {
  return typeof v === "number" ? v : parseFloat(v);
}
