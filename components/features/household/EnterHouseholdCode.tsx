"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  createHouseholdAndLogin,
  setHouseholdSession,
} from "@/app/actions/household";
import {
  HOUSEHOLD_CODE_STORAGE_KEY,
  normalizeHouseholdCode,
} from "@/lib/household";
import { MascotIllustration } from "@/components/common/MascotIllustration";

type Mode = "login" | "create";

type Notice =
  | { kind: "error"; text: string }
  | { kind: "pending-join"; code: string }
  | { kind: "pending-create"; code: string }
  | { kind: "pending-code"; code: string };

function CodeMono({ code }: { code: string }) {
  return (
    <span className="font-mono font-semibold tracking-wider text-ink">
      {code}
    </span>
  );
}

function WaitNotice({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      className="mt-4 rounded-2xl border border-accent/20 bg-accent-soft/70 px-4 py-3.5 text-center"
      role="status"
    >
      <p className="text-sm font-extrabold text-accent">{title}</p>
      <div className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink/75">
        {children}
      </div>
      {actions ? <div className="mt-3 flex flex-col items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EnterHouseholdCode() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [householdName, setHouseholdName] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  const codeString = digits.join("");

  useEffect(() => {
    const stored = localStorage.getItem(HOUSEHOLD_CODE_STORAGE_KEY);
    const normalized = normalizeHouseholdCode(stored ?? "");
    if (!normalized) return;
    startTransition(async () => {
      const result = await setHouseholdSession(normalized);
      if (result.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      localStorage.removeItem(HOUSEHOLD_CODE_STORAGE_KEY);
      if (result.reason === "pending" && result.code) {
        setDigits(result.code.split(""));
        setNotice({ kind: "pending-join", code: result.code });
      }
    });
  }, [router]);

  const resetDigits = () => setDigits(["", "", "", "", "", ""]);

  const onModeChange = (next: Mode) => {
    setMode(next);
    setNotice(null);
    resetDigits();
    setHouseholdName("");
  };

  const onDigitChange = (index: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    setNotice(null);
    if (d && index < 5) {
      const el = document.getElementById(`household-digit-${index + 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const el = document.getElementById(`household-digit-${index - 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  };

  const submitLogin = () => {
    setNotice(null);
    const code = normalizeHouseholdCode(codeString);
    if (!code) {
      setNotice({ kind: "error", text: "请输入完整的 6 位数字" });
      return;
    }
    startTransition(async () => {
      const result = await setHouseholdSession(code);
      if (result.ok) {
        localStorage.setItem(HOUSEHOLD_CODE_STORAGE_KEY, code);
        router.replace("/");
        router.refresh();
        return;
      }
      if (result.reason === "pending") {
        setNotice({ kind: "pending-join", code: result.code ?? code });
        return;
      }
      setNotice({ kind: "error", text: result.message });
    });
  };

  const submitCreate = () => {
    setNotice(null);
    const code = normalizeHouseholdCode(codeString);
    if (!code) {
      setNotice({ kind: "error", text: "请输入完整的 6 位数字家庭编码" });
      return;
    }
    if (!householdName.trim()) {
      setNotice({ kind: "error", text: "请输入家庭名称" });
      return;
    }
    startTransition(async () => {
      const result = await createHouseholdAndLogin({
        name: householdName,
        codeRaw: codeString,
      });
      if (result.ok) {
        setNotice({ kind: "pending-create", code: result.code });
        resetDigits();
        setHouseholdName("");
        return;
      }
      if (result.reason === "pending_code") {
        setNotice({
          kind: "pending-code",
          code: result.code ?? code,
        });
        return;
      }
      setNotice({ kind: "error", text: result.message });
    });
  };

  const DigitRow = (
    <div className="mt-4 flex justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`household-digit-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="off"
          autoFocus={mode === "login" && i === 0}
          value={d}
          onChange={(e) => onDigitChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="h-12 w-10 rounded-2xl border border-[var(--line)] bg-paper text-center text-xl font-bold text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
          aria-label={`第 ${i + 1} 位`}
        />
      ))}
    </div>
  );

  const showCreateForm = mode === "create" && notice?.kind !== "pending-create";

  return (
    <div className="flex min-h-[70vh] flex-col justify-center space-y-6 px-1">
      <header className="text-center">
        <div className="flex justify-center">
          <MascotIllustration
            name="loginHero"
            size="lg"
            className="drop-shadow-sm"
            alt=""
          />
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
          小账本
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-white/90">
          {mode === "login"
            ? "输入家里的 6 位编码进入账本（须已通过审核）。"
            : "取个名字、设好新编码；提交后需管理员审核通过才能使用。"}
        </p>
      </header>

      <div className="flex rounded-full bg-white/20 p-1 ring-1 ring-white/30">
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
            mode === "login" ? "bg-white text-accent" : "text-white/90"
          }`}
        >
          加入家庭
        </button>
        <button
          type="button"
          onClick={() => onModeChange("create")}
          className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${
            mode === "create" ? "bg-white text-accent" : "text-white/90"
          }`}
        >
          创建新家
        </button>
      </div>

      <div className="paper-panel p-6">
        {showCreateForm ? (
          <>
            <label className="block text-center text-xs font-semibold text-stone-500">
              家庭名称
            </label>
            <input
              type="text"
              placeholder="例如：我们的小家"
              value={householdName}
              autoFocus={mode === "create"}
              onChange={(e) => {
                setHouseholdName(e.target.value);
                setNotice(null);
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-paper px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
              maxLength={60}
            />
          </>
        ) : null}

        {notice?.kind === "pending-create" ? (
          <WaitNotice
            title="申请已提交，等待审核"
            actions={
              <>
                <button
                  type="button"
                  className="text-xs font-bold text-accent underline-offset-2 hover:underline"
                  onClick={() => {
                    setMode("login");
                    setDigits(notice.code.split(""));
                    setNotice({ kind: "pending-join", code: notice.code });
                    setHouseholdName("");
                  }}
                >
                  去加入家庭（审核通过后）
                </button>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-stone-500 underline-offset-2 hover:underline"
                  onClick={() => {
                    setNotice(null);
                    resetDigits();
                    setHouseholdName("");
                  }}
                >
                  再申请一个
                </button>
              </>
            }
          >
            <p>
              编码 <CodeMono code={notice.code} />，请先牢记或截图保存。
            </p>
            <p>管理员通过后，用「加入家庭」输入同一编码即可打开账本。</p>
            <p className="text-ink/55">通过前无需重复提交；稍后再来试试即可。</p>
          </WaitNotice>
        ) : (
          <>
            <p
              className={`text-center text-xs font-medium text-stone-500 ${
                showCreateForm ? "mt-5" : ""
              }`}
            >
              {mode === "create"
                ? "自设家庭编码（6 位数字，请牢记）"
                : "家庭编码（6 位数字）"}
            </p>
            {DigitRow}
          </>
        )}

        {notice?.kind === "pending-join" ? (
          <WaitNotice
            title="家庭正在审核中"
            actions={
              mode === "login" ? (
                <button
                  type="button"
                  className="text-xs font-bold text-accent underline-offset-2 hover:underline"
                  onClick={() => onModeChange("create")}
                >
                  不是这个家？去创建新家
                </button>
              ) : null
            }
          >
            <p>
              编码 <CodeMono code={notice.code} /> 的创建申请还在排队。
            </p>
            <p>管理员通过后，再点「进入账本」即可；通过前无法加入。</p>
          </WaitNotice>
        ) : null}

        {notice?.kind === "pending-code" ? (
          <WaitNotice
            title="这个编码已在审核中"
            actions={
              <button
                type="button"
                className="text-xs font-bold text-accent underline-offset-2 hover:underline"
                onClick={() => {
                  setMode("login");
                  setDigits(notice.code.split(""));
                  setNotice({ kind: "pending-join", code: notice.code });
                  setHouseholdName("");
                }}
              >
                改用「加入家庭」查看状态
              </button>
            }
          >
            <p>
              编码 <CodeMono code={notice.code} /> 已有人提交过创建申请。
            </p>
            <p>请换一个编码再申请，或等审核通过后用「加入家庭」进入。</p>
          </WaitNotice>
        ) : null}

        {notice?.kind === "error" ? (
          <p className="mt-4 text-center text-sm text-expense" role="alert">
            {notice.text}
          </p>
        ) : null}

        {notice?.kind === "pending-create" ? null : mode === "login" ? (
          <button
            type="button"
            disabled={pending || codeString.length !== 6}
            onClick={submitLogin}
            className="btn-primary mt-6"
          >
            {pending
              ? "验证中…"
              : notice?.kind === "pending-join"
                ? "再试一次"
                : "进入账本"}
          </button>
        ) : (
          <button
            type="button"
            disabled={
              pending || codeString.length !== 6 || !householdName.trim()
            }
            onClick={submitCreate}
            className="btn-primary mt-6"
          >
            {pending ? "提交中…" : "提交创建申请"}
          </button>
        )}

        {mode === "login" && notice?.kind !== "pending-join" ? (
          <p className="mt-4 text-center text-xs text-stone-400">
            示例编码：<span className="font-mono text-stone-600">000001</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
