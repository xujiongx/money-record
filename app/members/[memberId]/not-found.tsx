import Link from "next/link";

export default function MemberLedgerNotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-stone-600">未找到该成员</p>
      <Link
        href="/members"
        className="inline-block rounded-xl bg-orange-500 px-5 py-2 text-sm font-medium text-white shadow-md"
      >
        返回成员
      </Link>
    </div>
  );
}
