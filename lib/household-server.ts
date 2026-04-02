import { cookies } from "next/headers";
import {
  HOUSEHOLD_CODE_COOKIE,
  normalizeHouseholdCode,
} from "@/lib/household";

/** 从请求 Cookie 读取已校验格式的家庭编码（不含 DB 存在性校验） */
export async function getHouseholdCodeFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(HOUSEHOLD_CODE_COOKIE)?.value ?? "";
  return normalizeHouseholdCode(raw);
}
