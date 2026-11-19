"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Users,
} from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Table, proportional } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import {
  fetchAdminHouseholdTransactions,
  type AdminHouseholdDetail,
  type AdminMemberRow,
  type AdminTxnRow,
} from "@/app/actions/admin";
import { AdminShell } from "@/components/features/admin/AdminShell";

type MemberTableRow = AdminMemberRow & Record<string, unknown>;
type TxnTableRow = AdminTxnRow & Record<string, unknown>;

function formatMoney(n: number) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AdminHouseholdDetailClient({
  username,
  household,
  members,
  initialTxns,
  initialTotal,
  pageSize,
}: {
  username: string;
  household: AdminHouseholdDetail;
  members: AdminMemberRow[];
  initialTxns: AdminTxnRow[];
  initialTotal: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [txns, setTxns] = useState(initialTxns);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const loadPage = (next: number) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetchAdminHouseholdTransactions(household.id, next);
        setTxns(res.rows);
        setTotal(res.total);
        setPage(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载流水失败");
      }
    });
  };

  const memberColumns = useMemo(
    () => [
      {
        key: "name",
        header: "成员",
        width: proportional(2),
        renderCell: (row: MemberTableRow) => (
          <Text weight="semibold">{String(row.name)}</Text>
        ),
      },
      {
        key: "sort_order",
        header: "排序",
        width: proportional(1),
      },
    ],
    [],
  );

  const txnColumns = useMemo(
    () => [
      {
        key: "occurred_at",
        header: "时间",
        width: proportional(2, { minWidth: 140 }),
        renderCell: (row: TxnTableRow) => (
          <Text color="secondary">
            {format(new Date(String(row.occurred_at)), "yyyy-MM-dd HH:mm", {
              locale: zhCN,
            })}
          </Text>
        ),
      },
      {
        key: "member_name",
        header: "记账人",
        width: proportional(1, { minWidth: 72 }),
        renderCell: (row: TxnTableRow) => (
          <Text>{String(row.member_name ?? "—")}</Text>
        ),
      },
      {
        key: "type",
        header: "类型",
        width: proportional(1, { minWidth: 64 }),
        renderCell: (row: TxnTableRow) => (
          <Badge
            label={row.type === "income" ? "收入" : "支出"}
            variant={row.type === "income" ? "success" : "neutral"}
          />
        ),
      },
      {
        key: "category",
        header: "分类",
        width: proportional(1, { minWidth: 72 }),
      },
      {
        key: "amount",
        header: "金额",
        width: proportional(1, { minWidth: 88 }),
        align: "end" as const,
        renderCell: (row: TxnTableRow) => (
          <Text weight="semibold">{formatMoney(Number(row.amount))}</Text>
        ),
      },
      {
        key: "note",
        header: "备注",
        width: proportional(2, { minWidth: 100 }),
        renderCell: (row: TxnTableRow) => (
          <Text color="secondary">{String(row.note ?? "—")}</Text>
        ),
      },
    ],
    [],
  );

  return (
    <AdminShell username={username}>
      <VStack gap={5} className="max-w-[1100px] p-6">
        <HStack gap={3} align="center">
          <Button
            label="返回运营概览"
            variant="secondary"
            size="sm"
            icon={<Icon icon={ArrowLeft} />}
            onClick={() => router.push("/admin/ops")}
          />
        </HStack>

        {error ? (
          <Banner
            status="error"
            title={error}
            role="alert"
            collapsible={false}
            isDismissable
            onDismiss={() => setError(null)}
          />
        ) : null}

        <VStack gap={2}>
          <HStack gap={3} align="center">
            <Heading level={2}>{household.name}</Heading>
            <Badge
              label={household.status === "pending" ? "待审" : "已审"}
              variant={household.status === "pending" ? "warning" : "success"}
            />
          </HStack>
          <HStack gap={2} align="center" className="flex-wrap">
            <Text color="secondary">编码</Text>
            <Text type="code">{household.code}</Text>
            <Text color="secondary">
              · 创建于{" "}
              {format(new Date(household.created_at), "yyyy年M月d日 HH:mm", {
                locale: zhCN,
              })}
            </Text>
          </HStack>
        </VStack>

        <VStack gap={3}>
          <HStack gap={2} align="center">
            <Icon icon={Users} size="sm" color="secondary" />
            <Heading level={3}>成员</Heading>
          </HStack>
          <Card padding={0} width="100%">
            {members.length === 0 ? (
              <EmptyState
                title="暂无成员"
                icon={<Icon icon={Users} size="lg" color="secondary" />}
                isCompact
                className="py-10"
              />
            ) : (
              <Table
                data={members as MemberTableRow[]}
                idKey="id"
                columns={memberColumns}
                density="balanced"
                dividers="rows"
              />
            )}
          </Card>
        </VStack>

        <VStack gap={3}>
          <HStack justify="between" align="center">
            <HStack gap={2} align="center">
              <Icon icon={Receipt} size="sm" color="secondary" />
              <Heading level={3}>日常流水</Heading>
            </HStack>
            <Text color="secondary" type="supporting">
              共 {total} 笔 · 第 {page + 1}/{pageCount} 页
            </Text>
          </HStack>
          <Card padding={0} width="100%">
            {txns.length === 0 ? (
              <EmptyState
                title="暂无流水"
                description="该家庭还没有日常记账"
                icon={<Icon icon={Receipt} size="lg" color="secondary" />}
                isCompact
                className="py-16"
              />
            ) : (
              <Table
                data={txns as TxnTableRow[]}
                idKey="id"
                columns={txnColumns}
                density="balanced"
                dividers="rows"
                hasHover
                textOverflow="truncate"
              />
            )}
          </Card>
          {total > pageSize ? (
            <HStack gap={2} justify="end">
              <Button
                label="上一页"
                variant="secondary"
                size="sm"
                icon={<Icon icon={ChevronLeft} />}
                isDisabled={busy || page <= 0}
                onClick={() => loadPage(page - 1)}
              />
              <Button
                label="下一页"
                variant="secondary"
                size="sm"
                endContent={<Icon icon={ChevronRight} />}
                isDisabled={busy || page + 1 >= pageCount}
                onClick={() => loadPage(page + 1)}
              />
            </HStack>
          ) : null}
        </VStack>
      </VStack>
    </AdminShell>
  );
}
