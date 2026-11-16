/** 本机「我是谁」（影响默认记账人与首页「对方刚记了」） */
export const SELF_MEMBER_KEY = "money-record:self-member-id";

/** 记账页上次选择的记录人（本机；无「我是谁」时作回退） */
export const LAST_RECORD_MEMBER_KEY = "money-record:last-record-member-id";

/** 从 localStorage 读取成员 id，且必须落在当前家庭成员列表中 */
export function readPreferredMemberId(
  key: string,
  validIds: readonly string[],
): string | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored && validIds.includes(stored)) return stored;
  } catch {
    /* private mode or storage blocked */
  }
  return null;
}

/** 解析本机身份：优先「我是谁」，否则上次记账人 */
export function resolveSelfMemberId(
  validIds: readonly string[],
): string | null {
  return (
    readPreferredMemberId(SELF_MEMBER_KEY, validIds) ??
    readPreferredMemberId(LAST_RECORD_MEMBER_KEY, validIds)
  );
}
