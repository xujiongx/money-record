/** Tab 切换时立即展示，避免白屏等待 RSC */
export default function Loading() {
  return (
    <div className="space-y-5 pb-4" aria-busy="true" aria-label="加载中">
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded-md bg-stone-200/80" />
        <div className="h-8 w-40 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-3 w-32 animate-pulse rounded-md bg-stone-200/70" />
      </div>
      <div className="paper-panel grid grid-cols-3 divide-x divide-[var(--line)] overflow-hidden p-0">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[4.5rem] animate-pulse bg-stone-100/80"
          />
        ))}
      </div>
      <div className="h-36 animate-pulse rounded-xl border border-[var(--line)] bg-paper" />
      <div className="h-48 animate-pulse rounded-xl border border-[var(--line)] bg-paper" />
    </div>
  );
}
