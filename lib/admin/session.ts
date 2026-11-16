import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin/constants";

function sessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (!secret) {
    throw new Error("缺少 ADMIN_SESSION_SECRET 或 SUPABASE_SERVICE_ROLE_KEY，无法签发管理会话");
  }
  return secret;
}

export type AdminSessionPayload = {
  adminId: string;
  username: string;
  exp: number;
};

function sign(body: string): string {
  return createHmac("sha256", sessionSecret()).update(body).digest("base64url");
}

export function encodeAdminSession(payload: AdminSessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeAdminSession(token: string): AdminSessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    if (!payload.adminId || !payload.username || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function adminSessionExpiryUnix(): number {
  return Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SEC;
}
