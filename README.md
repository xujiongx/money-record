# 家庭记账（Next.js 移动端 + Supabase）

布布与一二共用的家庭账本：移动端视口、橙粉渐变 UI、多家庭编码隔离、收支记账、成员统计与图表。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS 4；**`app/manifest.ts`**（PWA）、**`app/icon.svg`** 与 **`lib/app-branding.ts`** 统一应用名 / 描述 / 主题色（详见 [docs/development-guide.md](./docs/development-guide.md)）
- Supabase（PostgreSQL）
- Recharts、Framer Motion、[lucide-react](https://lucide.dev/)（统一图标）、[@ssgoi/react](https://ssgoi.dev/docs/frameworks/nextjs)（路由页过渡：Tab 用 fade、详情钻入用 drill）、date-fns、[react-mobile-picker](https://github.com/adcentury/react-mobile-picker)（记账发生时间滚轮：年/月/日/时/分）、[react-draggable](https://github.com/react-grid-layout/react-draggable)（浮动按钮）、[react-markdown](https://github.com/remarkjs/react-markdown)（助手气泡）、zod、undici（Mistral 上游与代理）、`openai`（OpenRouter 兼容调用）
- **小布助手**：底部导航外的可拖动入口；多轮对话、结构化记账（自动识别支出/收入与分类，对不上归「其他」，信息够则直接入账、不先追问或「确认再记」）、**本月小结**与**本年小结**；每轮结合数据库快照生成事实块，弱化历史气泡里的旧数字。出站 LLM 经 `lib/foundation/llm`：**`MISTRAL_API_KEY` 与 `OPEN_ROUTER_API_KEY` 至少配置其一**（同时配置时优先 Mistral，失败则走 OpenRouter）。可选 **Web Speech** 播报（`lib/foundation/tts`）与语音输入（`lib/foundation/asr`），环境变量见 `.env.example`，模块说明见 [`lib/foundation/README.md`](./lib/foundation/README.md)

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
| `MISTRAL_API_KEY` / `OPEN_ROUTER_API_KEY` | 启用小布时**至少其一**，**仅服务端**；详见 `.env.example`（模型、超时、代理、`XIAOBU_LLM_PROVIDER` 等） |
| `NEXT_PUBLIC_TTS_PROVIDER` / `NEXT_PUBLIC_ASR_PROVIDER` | （可选）助手播报与麦克风：`web-speech`（默认）或 `noop`，见 `.env.example` |

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

多设备数据同步：列表数据随 **进入页面 / 路由跳转** 从服务端载入；他端更新可 **刷新整页**、再次打开页面，或在首页点 **「刷新数据」**（清 `ledger` 读缓存并重跑 RSC）。无定时轮询、无 Realtime。底部 Tab 在客户端会 **prefetch** 各页 RSC，配合服务端账本读缓存与 Next **`staleTimes`**，切换时更少重复打库（仍非浏览器多页 DOM 常驻）。

## 路由说明

| 路径 | 功能 |
|------|------|
| `/login` | 输入 6 位家庭编码（无 Cookie 时由中间件跳转） |
| `/` | 仪表盘：汇总、最近账单、成员头像墙 |
| `/record` | 智能记账（可选业务发生时间，默认此刻；**今天/昨天/前天**快捷 + **年/月/日/时/分**滚轮）；备注支持按分类的本地历史标签（点击回填，最多 150 条） |
| `/stats` | 收支统计（日/周/月/年）；右上角进 **分析**；图表为客户端按需加载（Recharts 分包） |
| `/stats/analysis` | 月度/年度收支分析（柱图滑动、分类汇总、交易排行） |
| `/members` | 成员列表与各人明细；底部可切换家庭 |

## 部署

将环境变量配置到 Vercel（或其它平台）项目设置中，**切勿**将 `SUPABASE_SERVICE_ROLE_KEY`、`MISTRAL_API_KEY`、`OPEN_ROUTER_API_KEY` 等服务端密钥设为 `NEXT_PUBLIC_` 前缀。OpenRouter 可选 Referer / Title 等见 `.env.example` 与 [docs/deployment.md](./docs/deployment.md)。

## 安全说明

当前 **RLS 无 anon 读策略**，账本数据**仅**通过服务端 **Service Role** 访问；浏览器携带的 **家庭编码** 相当于家庭口令，请勿向无关人员泄露。若应用对公网开放，建议后续接入账号体系并改为按用户鉴权。

## 项目文档（中文）

更完整的说明见 **[docs/](./docs/)** 目录，推荐优先阅读 [docs/development-guide.md](./docs/development-guide.md)（架构、目录结构、环境变量、FAQ）。
