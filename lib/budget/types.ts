export type BudgetScope = "household" | "category";

export type BudgetRow = {
  id: string;
  household_id: string;
  period_type: "month";
  period_key: string;
  scope: BudgetScope;
  category: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
};
