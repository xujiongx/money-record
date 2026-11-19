"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardCheck, LayoutDashboard, LogOut } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { SideNav } from "@astryxdesign/core/SideNav";
import { SideNavItem } from "@astryxdesign/core/SideNav";
import { Text } from "@astryxdesign/core/Text";
import { TopNav } from "@astryxdesign/core/TopNav";
import { TopNavHeading } from "@astryxdesign/core/TopNav";
import { clearAdminSession } from "@/app/actions/admin";
import { ILLUSTRATIONS } from "@/lib/branding/illustrations";

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const isModeration =
    pathname === "/admin" || pathname === "/admin/";
  const isOps =
    pathname.startsWith("/admin/ops") ||
    pathname.startsWith("/admin/households");

  const logout = () => {
    startTransition(async () => {
      await clearAdminSession();
      router.replace("/admin/login");
      router.refresh();
    });
  };

  return (
    <AppShell
      height="fill"
      contentPadding={0}
      variant="surface"
      topNav={
        <TopNav
          label="管理后台顶栏"
          heading={
            <TopNavHeading
              logo={
                // shortcut: Astryx reset 的 img height:auto 压过 Tailwind，顶栏用行内尺寸；有媒体 token 再改
                <img
                  src={ILLUSTRATIONS.homeKpi}
                  alt="布布和一二"
                  width={72}
                  height={40}
                  decoding="async"
                  style={{
                    height: 40,
                    width: "auto",
                    maxWidth: 72,
                    objectFit: "contain",
                  }}
                />
              }
              heading="管理后台"
              subheading="家庭记账"
            />
          }
          endContent={
            <HStack gap={3} align="center">
              <Text color="secondary" type="supporting">
                {username}
              </Text>
              <Button
                label="退出"
                variant="secondary"
                size="sm"
                icon={<Icon icon={LogOut} />}
                isDisabled={busy}
                onClick={logout}
              />
            </HStack>
          }
        />
      }
      sideNav={
        <SideNav>
          <SideNavItem
            label="家庭审核"
            icon={ClipboardCheck}
            isSelected={isModeration}
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              router.push("/admin");
            }}
          />
          <SideNavItem
            label="运营概览"
            icon={LayoutDashboard}
            isSelected={isOps}
            href="/admin/ops"
            onClick={(e) => {
              e.preventDefault();
              router.push("/admin/ops");
            }}
          />
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
