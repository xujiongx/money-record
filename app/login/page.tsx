import { redirect } from "next/navigation";
import { EnterHouseholdCode } from "@/components/EnterHouseholdCode";
import { getHouseholdCodeFromCookies } from "@/lib/household-server";

export default async function LoginPage() {
  const code = await getHouseholdCodeFromCookies();
  if (code) redirect("/");
  return <EnterHouseholdCode />;
}
