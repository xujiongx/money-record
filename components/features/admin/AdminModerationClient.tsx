"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Check,
  ClipboardCheck,
  Eye,
  Inbox,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import {
  approveHousehold,
  rejectHousehold,
  type AdminHouseholdListRow,
} from "@/app/actions/admin";
import { AdminShell } from "@/components/features/admin/AdminShell";

type AdminTab = "pending" | "active";

type HouseholdRow = AdminHouseholdListRow & Record<string, unknown>;

function formatCreatedAt(iso: string) {
  return format(new Date(iso), "yyyy年M月d日 HH:mm", { locale: zhCN });
}

export function AdminModerationClient({
  username,
  initialPending,
  initialActive,
}: {
  username: string;
  initialPending: AdminHouseholdListRow[];
  initialActive: AdminHouseholdListRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("pending");
  const [pendingRows, setPendingRows] = useState(initialPending);
  const [activeRows, setActiveRows] = useState(initialActive);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const approve = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await approveHousehold(id);
        setPendingRows((prev) => {
          const row = prev.find((r) => r.id === id);
          if (row) {
            setActiveRows((active) => [
              row,
              ...active.filter((a) => a.id !== id),
            ]);
          }
          return prev.filter((r) => r.id !== id);
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "通过失败");
      }
    });
  };

  const reject = (id: string) => {
    if (!window.confirm("拒绝将删除该家庭申请并释放编码，确定？")) return;
    setError(null);
    startTransition(async () => {
      try {
        await rejectHousehold(id);
        setPendingRows((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "拒绝失败");
      }
    });
  };

  const rows: HouseholdRow[] = useMemo(
    () => (tab === "pending" ? pendingRows : activeRows) as HouseholdRow[],
    [tab, pendingRows, activeRows],
  );

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "家庭名称",
        width: proportional(2, { minWidth: 140 }),
        renderCell: (row: HouseholdRow) => (
          <Text weight="semibold">{String(row.name)}</Text>
        ),
      },
      {
        key: "code",
        header: "编码",
        width: proportional(1, { minWidth: 96 }),
        renderCell: (row: HouseholdRow) => (
          <Text type="code">{String(row.code)}</Text>
        ),
      },
      {
        key: "created_at",
        header: tab === "pending" ? "申请时间" : "创建时间",
        width: proportional(2, { minWidth: 160 }),
        renderCell: (row: HouseholdRow) => (
          <Text color="secondary">{formatCreatedAt(String(row.created_at))}</Text>
        ),
      },
      ...(tab === "pending"
        ? [
            {
              key: "actions",
              header: "操作",
              width: pixel(200),
              align: "end" as const,
              renderCell: (row: HouseholdRow) => (
                <HStack gap={2} justify="end">
                  <Button
                    label="通过"
                    variant="primary"
                    size="sm"
                    icon={<Icon icon={Check} />}
                    isDisabled={busy}
                    onClick={() => approve(String(row.id))}
                  />
                  <Button
                    label="拒绝"
                    variant="destructive"
                    size="sm"
                    icon={<Icon icon={X} />}
                    isDisabled={busy}
                    onClick={() => reject(String(row.id))}
                  />
                </HStack>
              ),
            },
          ]
        : [
            {
              key: "actions",
              header: "操作",
              width: pixel(120),
              align: "end" as const,
              renderCell: (row: HouseholdRow) => (
                <Button
                  label="详情"
                  variant="secondary"
                  size="sm"
                  icon={<Icon icon={Eye} />}
                  onClick={() =>
                    router.push(`/admin/households/${String(row.id)}`)
                  }
                />
              ),
            },
          ]),
    ],
    [tab, busy, router],
  );

  return (
    <AdminShell username={username}>
      <VStack gap={5} className="max-w-[1100px] p-6">
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

        <VStack gap={1}>
          <HStack gap={2} align="center">
            <Icon icon={ClipboardCheck} color="accent" />
            <Heading level={2}>家庭审核</Heading>
          </HStack>
          <Text color="secondary">
            通过后可用编码加入；拒绝将删除申请并释放编码
          </Text>
        </VStack>

        <TabList
          value={tab}
          onChange={(v) => setTab(v as AdminTab)}
          role="tablist"
          hasDivider
          aria-label="审核状态"
        >
          <Tab
            value="pending"
            label="未审核"
            icon={<Icon icon={Inbox} />}
            endContent={
              <Badge
                label={String(pendingRows.length)}
                variant={pendingRows.length > 0 ? "warning" : "neutral"}
              />
            }
          />
          <Tab
            value="active"
            label="已审核"
            icon={<Icon icon={ShieldCheck} />}
            endContent={
              <Badge label={String(activeRows.length)} variant="success" />
            }
          />
        </TabList>

        <Card padding={0} width="100%">
          {rows.length === 0 ? (
            <EmptyState
              title={tab === "pending" ? "暂无待审家庭" : "暂无已通过家庭"}
              description={
                tab === "pending"
                  ? "用户提交创建申请后会显示在这里"
                  : "通过待审申请后会出现在此列表"
              }
              icon={
                <Icon
                  icon={tab === "pending" ? Inbox : ShieldCheck}
                  size="lg"
                  color="secondary"
                />
              }
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
    </AdminShell>
  );
}
