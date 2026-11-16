import { fetchHouseholdMonthBudget } from "@/app/actions/budget";
import { monthPeriodKey } from "@/lib/budget/period";
import { BudgetSettingsClient } from "@/components/features/budget/BudgetSettingsClient";

export default async function BudgetSettingsPage() {
  const periodKey = monthPeriodKey();
  let budget = null;
  try {
    budget = await fetchHouseholdMonthBudget(periodKey);
  } catch {
    budget = null;
  }

  return (
    <BudgetSettingsClient initialBudget={budget} periodKey={periodKey} />
  );
}
