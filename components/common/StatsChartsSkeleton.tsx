/** 统计页骨架：路由 loading 与 Recharts 动态分包时的占位，避免布局跳动 */
export function StatsChartsSkeleton({
  hint,
}: {
  /** 例如：正在加载数据 / 正在加载图表 */
  hint?: string;
}) {
  return (
    <div className="space-y-4 pb-2" aria-busy="true" aria-label={hint ?? "加载中"}>
      <header>
        <div className="h-4 w-20 animate-pulse rounded-md bg-white/45" />
        <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-white/55" />
        <div className="mt-2 h-3 w-36 animate-pulse rounded-md bg-white/40" />
      </header>

      {hint ? (
        <p className="text-center text-[11px] text-white/75">{hint}</p>
      ) : null}

      <div className="rounded-2xl bg-white/95 p-3 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <div className="mx-auto h-3 w-16 animate-pulse rounded bg-stone-200/80" />
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-11 min-w-0 flex-1 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-stone-100" />
        </div>
        <div className="mx-auto mt-2 h-8 w-full max-w-[200px] animate-pulse rounded-lg bg-stone-100" />
      </div>

      <div className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80">
        <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
        <div className="mt-2 h-3 w-full animate-pulse rounded bg-stone-100" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[3.25rem] animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-orange-500/10 ring-1 ring-orange-100/80"
        >
          <div className="h-4 w-28 animate-pulse rounded bg-stone-200" />
          <div className="mt-2 h-3 w-[75%] max-w-[240px] animate-pulse rounded bg-stone-100" />
          <div className="mt-3 h-44 w-full animate-pulse rounded-xl bg-stone-100/90" />
        </div>
      ))}
    </div>
  );
}
