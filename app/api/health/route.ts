import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/health
 *
 * 用途：被 GitHub Actions 定时调用，触发一次轻量数据库查询，
 * 防止 Supabase 免费项目因长期不活跃被暂停。
 *
 * 鉴权：请求头须携带 Authorization: Bearer <HEALTH_CHECK_SECRET>
 * 若未配置 HEALTH_CHECK_SECRET，则接口拒绝所有请求（安全兜底）。
 */
export async function GET(request: Request) {
  const secret = process.env.HEALTH_CHECK_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "未配置 HEALTH_CHECK_SECRET" }, { status: 503 });
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== secret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    // 最轻量的查询：只取 households 表第 1 行的 id，不做全表扫描
    const { error } = await supabase
      .from("households")
      .select("id")
      .limit(1);

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
