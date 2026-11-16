/** 管理后台会话 Cookie（与家庭编码会话分离） */
export const ADMIN_SESSION_COOKIE = "ledger_admin_session";

/** 初始超管用户名（种子） */
export const SEED_ADMIN_USERNAME = "xujiong";

/** 初始超管密码（仅用于首次种子；入库为哈希） */
export const SEED_ADMIN_PASSWORD = "258099";

/** 可进入管理后台入口的家庭编码 */
export const ADMIN_ENTRY_HOUSEHOLD_CODE = "258099";

export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;
