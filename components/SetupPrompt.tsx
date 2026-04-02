export function SetupPrompt({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-white/90 p-5 shadow-sm">
      <h1 className="text-lg font-semibold text-stone-800">需要先配置 Supabase</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{message}</p>
      <p className="mt-4 text-xs text-stone-500">
        请查看仓库根目录 <code className="rounded bg-stone-100 px-1">README.md</code> 与{" "}
        <code className="rounded bg-stone-100 px-1">.env.example</code>，执行 SQL 迁移并填写环境变量。
      </p>
    </div>
  );
}
