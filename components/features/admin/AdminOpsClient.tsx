"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Eye,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type {
  AdminOpsHouseholdRow,
  AdminOpsSummary,
} from "@/app/actions/admin";
import { AdminShell } from "@/components/features/admin/AdminShell";

type HouseholdRow = AdminOpsHouseholdRow & Record<string, unknown>;

function formatMoney(n: number) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatCard({
  label,
  value,
  hint,
  icon: Glyph,
  iconColor = "secondary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconColor?: "secondary" | "warning" | "success" | "error" | "accent";
}) {
  return (
    <Card padding={4} className="min-w-[140px] flex-1">
      <VStack gap={1}>
        <HStack gap={2} align="center">
          <Icon icon={Glyph} size="sm" color={iconColor} />
          <Text type="supporting" color="secondary">
            {label}
          </Text>
        </HStack>
        <Text weight="bold" size="xl">
          {value}
        </Text>
        {hint ? (
          <Text type="supporting" color="secondary">
            {hint}
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

export function AdminOpsClient({
  username,
  summary,
  households,
}: {
  username: string;
  summary: AdminOpsSummary;
  households: AdminOpsHouseholdRow[];
}) {
  const router = useRouter();

  const rows = households as HouseholdRow[];

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "家庭",
        width: proportional(2, { minWidth: 140 }),
        renderCell: (row: HouseholdRow) => (
          <Text weight="semibold">{String(row.name)}</Text>
        ),
      },
      {
        key: "code",
        header: "编码",
        width: proportional(1, { minWidth: 88 }),
        renderCell: (row: HouseholdRow) => (
          <Text type="code">{String(row.code)}</Text>
        ),
      },
      {
        key: "status",
        header: "状态",
        width: proportional(1, { minWidth: 88 }),
        renderCell: (row: HouseholdRow) => (
          <Badge
            label={row.status === "pending" ? "待审" : "已审"}
            variant={row.status === "pending" ? "warning" : "success"}
          />
        ),
      },
      {
        key: "created_at",
        header: "创建时间",
        width: proportional(2, { minWidth: 150 }),
        renderCell: (row: HouseholdRow) => (
          <Text color="secondary">
            {format(new Date(String(row.created_at)), "yyyy年M月d日 HH:mm", {
              locale: zhCN,
            })}
          </Text>
        ),
      },
      {
        key: "actions",
        header: "操作",
        width: pixel(100),
        align: "end" as const,
        renderCell: (row: HouseholdRow) => (
          <Button
            label="详情"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Eye} />}
            onClick={() => router.push(`/admin/households/${String(row.id)}`)}
          />
        ),
      },
    ],
    [router],
  );

  return (
    <AdminShell username={username}>
      <VStack gap={5} className="max-w-[1100px] p-6">
        <VStack gap={1}>
          <HStack gap={2} align="center">
            <Icon icon={LayoutDashboard} color="accent" />
            <Heading level={2}>运营概览</Heading>
          </HStack>
          <Text color="secondary">
            全站家庭与本月日常流水汇总；点进家庭查看成员与流水
          </Text>
        </VStack>

        <HStack gap={3} className="flex-wrap">
          <StatCard
            label="待审家庭"
            value={String(summary.pendingCount)}
            icon={Clock}
            iconColor="warning"
          />
          <StatCard
            label="已审家庭"
            value={String(summary.activeCount)}
            icon={ShieldCheck}
            iconColor="success"
          />
          <StatCard
            label="近 7 日新建"
            value={String(summary.createdLast7Days)}
            icon={Home}
            iconColor="accent"
          />
          <StatCard
            label="本月支出"
            value={formatMoney(summary.monthExpense)}
            hint={`${summary.monthTxnCount} 笔日常流水`}
            icon={ArrowUpRight}
            iconColor="error"
          />
          <StatCard
            label="本月收入"
            value={formatMoney(summary.monthIncome)}
            icon={ArrowDownLeft}
            iconColor="success"
          />
        </HStack>

        <VStack gap={3}>
          <HStack gap={2} align="center">
            <Icon icon={Users} size="sm" color="secondary" />
            <Heading level={3}>全部家庭</Heading>
          </HStack>
          <Card padding={0} width="100%">
            {rows.length === 0 ? (
              <EmptyState
                title="暂无家庭"
                description="还没有创建或待审的家庭"
                icon={<Icon icon={Home} size="lg" color="secondary" />}
                isCompact
                className="py-16"
              />
            ) : (
              <Table
                data={rows}
                idKey="id"
                columns={columns}
                density="spacious"
                dividers="rows"
                hasHover
                textOverflow="truncate"
              />
            )}
          </Card>
        </VStack>
      </VStack>
    </AdminShell>
  );
}
