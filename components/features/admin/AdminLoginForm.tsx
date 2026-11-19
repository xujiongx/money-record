"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Shield } from "lucide-react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { adminLogin } from "@/app/actions/admin";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await adminLogin({ username, password });
        router.replace("/admin");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "登录失败");
      }
    });
  };

  return (
    <Center axis="both" height="100dvh" padding={4}>
      <Card width="100%" maxWidth={420} padding={6}>
        <VStack gap={5} hAlign="stretch">
          <VStack gap={2} hAlign="center">
            <Icon icon={Shield} size="lg" color="accent" label="管理后台" />
            <VStack gap={1} hAlign="center">
              <Text type="supporting" color="secondary">
                家庭记账
              </Text>
              <Heading level={1}>管理后台</Heading>
              <Text color="secondary">账号密码登录后审核家庭创建申请</Text>
            </VStack>
          </VStack>

          {error ? (
            <Banner
              status="error"
              title={error}
              role="alert"
              collapsible={false}
            />
          ) : null}

          <FormLayout direction="vertical">
            <TextInput
              label="账号"
              type="text"
              htmlName="username"
              value={username}
              onChange={(value) => setUsername(value)}
              placeholder="用户名"
              isDisabled={pending}
              width="100%"
              hasAutoFocus
            />
            <TextInput
              label="密码"
              type="password"
              htmlName="password"
              value={password}
              onChange={(value) => setPassword(value)}
              placeholder="密码"
              isDisabled={pending}
              width="100%"
              onEnter={submit}
            />
          </FormLayout>

          <Button
            label={pending ? "登录中…" : "登录"}
            variant="primary"
            size="lg"
            icon={<Icon icon={LogIn} />}
            isDisabled={pending || !username.trim() || !password}
            isLoading={pending}
            onClick={submit}
            width="100%"
          />
        </VStack>
      </Card>
    </Center>
  );
}
