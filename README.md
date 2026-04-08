# 家庭记账（Next.js 移动端 + Supabase）

布布与一二共用的家庭账本：移动端视口、橙粉渐变 UI、多家庭编码隔离、收支记账、成员统计与图表。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS 4
- Supabase（PostgreSQL）
- Recharts、Framer Motion、date-fns、[react-draggable](https://github.com/react-grid-layout/react-draggable)（浮动按钮）、undici（Mistral 上游请求）
- **小布助手**：底部导航外的可拖动入口，多轮对话与「本月小结」（需配置 `MISTRAL_API_KEY`，见 `.env.example`）

## 本地运行

### 1. 创建 Supabase 项目

在 [Supabase](https://supabase.com) 新建项目，打开 **SQL Editor**，执行仓库内：

`supabase/migrations/001_init.sql`

### 2. 环境变量

复制 `.env.example` 为 `.env.local`，至少配置：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **仅服务端**，所有读写经 Server Actions，勿提交或暴露 |
| `MISTRAL_API_KEY` | （可选）启用小布对话 / 本月小结，**仅服务端**；代理相关变量见 `.env.example` |

### 3. 家庭编码与登录

首次访问会跳转到 **`/login`**：

- **加入家庭**：输入已有 **6 位数字家庭编码**（示例 **`000001`**、**`000002`** 见迁移脚本）。
- **创建新家**：填写家庭名称与 **6 位数字编码**（未被占用即可），系统将创建家庭并自动添加成员 **布布**、**一二**，然后直接进入账本。

验证或创建成功后，编码会写入 **httpOnly Cookie** 与 **localStorage**。在 **成员** 页底部可「切换家庭 / 重新输入编码」。

### 4. 安装与启动

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)（无有效家庭 Cookie 时会跳转 `/login`），建议使用移动端调试或窄屏查看。

多设备数据同步：列表数据随 **进入页面 / 路由跳转** 从服务端载入；他端更新需刷新或再次打开页面（无定时轮询、无 Realtime）。

## 路由说明

| 路径 | 功能 |
|------|------|
| `/login` | 输入 6 位家庭编码（无 Cookie 时由中间件跳转） |
| `/` | 仪表盘：汇总、最近账单、成员头像墙 |
| `/record` | 智能记账 |
| `/stats` | 收支统计（日/周/月/年）；图表为客户端按需加载（Recharts 分包） |
| `/members` | 成员列表与各人明细；底部可切换家庭 |

## 部署

将环境变量配置到 Vercel（或其它平台）项目设置中，**切勿**将 `SUPABASE_SERVICE_ROLE_KEY` 设为 `NEXT_PUBLIC_` 前缀。

## 安全说明

当前 **RLS 无 anon 读策略**，账本数据**仅**通过服务端 **Service Role** 访问；浏览器携带的 **家庭编码** 相当于家庭口令，请勿向无关人员泄露。若应用对公网开放，建议后续接入账号体系并改为按用户鉴权。

## 项目文档（中文）

更完整的说明见 **[docs/](./docs/)** 目录，推荐优先阅读 [docs/development-guide.md](./docs/development-guide.md)（架构、目录结构、环境变量、FAQ）。
