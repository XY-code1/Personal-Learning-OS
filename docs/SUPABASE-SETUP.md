# Supabase 登录服务接入指南

更新时间：2026-08-31

这份指南帮你在 Supabase 上开一个免费项目、把登录服务接到 Personal Learning OS，让"发送验证码"真的能发出邮件。

## 当前 Phase A 配置状态（以本节为准）

此前记录的云端配置是历史操作记录，不代表当前工作区已经可用。当前 `.env.local` 文件存在，但 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 仍为空；请按下面步骤填写并重启开发服务器。

Phase A 需要按顺序执行全部 migration：

1. `supabase/migrations/20260830000000_phase1_initial_schema.sql`
2. `supabase/migrations/20260831000000_phase_a_integrity.sql`
3. `supabase/migrations/20260831010000_phase_a_write_transactions.sql`

Email provider、6 位 OTP 模板和 Redirect URL 仍需在 Dashboard 手动配置。免费项目默认邮件服务通常不能通过 API 修改模板，必须将 Magic Link / Confirm signup 模板改为显示 `{{ .Token }}`，具体步骤见第 5 节。
## 1. 在 Supabase 创建免费项目

1. 打开 https://supabase.com/dashboard，用 GitHub 账号登录。
3. 点击 "New project"。
   - **Organization**：选你已有的组织（没有就新建一个）。
   - **Name**：例如 `personal-learning-os`。
   - **Database Password**：自动生成一个，记下来（之后连数据库要用）。
   - **Region**：建议选 Singapore 或 Tokyo，物理上离你更近，OTP 邮件中转更稳。
   - **Plan**：选 Free（每月 50,000 MAU、500MB 数据库，OTP 邮件有频率限制）。
4. 等 1–2 分钟项目创建完成，进入 Project Dashboard。

## 2. 拿到前端可用的凭据

进项目 Dashboard 后：

1. 左侧菜单 **Project Settings → API**。
2. 复制：
   - **Project URL**（形如 `https://abcdefgh.supabase.co`）→ 填到 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_URL`。
   - **anon public** key（很长的 `eyJ...` JWT）→ 填到 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。

> 这两个值会被打包进浏览器，是公开的、不可绕过 RLS 的。

3. （可选，未来后端会用）同页底部复制 **service_role** key，填到 `SUPABASE_SERVICE_ROLE_KEY`。**注意：这个 key 能绕过 RLS，绝不能出现在浏览器代码里，仅服务端使用**。

## 3. 创建项目根目录的 `.env.local`

在 `E:\Personal Learning\` 下新建一个纯文本文件 `.env.local`（Next.js 自动加载它，且 `.gitignore` 已忽略所有 `.env*`）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... 你的anon key

# 仅服务端使用；当前前端不会读它，留空也能跑登录/注册
SUPABASE_SERVICE_ROLE_KEY=

# AI 模型网关（Phase 1 不强制，先留空）
AI_PROVIDER_KEY=
AI_MODEL_KEY=
AI_BASE_URL=
AI_API_KEY=
```

保存文件后**重启** `npm run dev`（Next.js 只在启动时读 `.env.local`）。

## 4. 启用并配置 Auth

回到 Supabase Dashboard：

1. **Authentication → Providers**
   - **Email** 默认就是开启的，确保开关是绿的。
   - 如果你以后想加 Google / GitHub 等，再单独开。
2. **Authentication → URL Configuration**
   - **Site URL**：填 `http://localhost:3000`（生产部署时再加正式域名）。
   - **Redirect URLs**：加上：
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/workspace/dashboard`
     - `http://localhost:3000/login`
   - 项目目前的 OTP 注册回调是 `window.location.origin + "/workspace/dashboard"`，所以登录流程会自动跳到本地的工作台。

## 5. 把邮件模板改成显示 6 位数字验证码

当前实现走的是 Supabase **email OTP**（一次性密码），不是 magic link。如果不调整，用户收到的邮件里只有链接、没有 6 位数字。

1. **Authentication → Email Templates**
2. 打开 **Magic Link** template：
   - 把 `{{ .ConfirmationURL }}` 替换成 `{{ .Token }}`，并把 Subject 改成 `【Personal Learning OS】你的登录验证码是 {{ .Token }}`，正文写一段中文引导，提示用户回到登录页面输入 6 位数字。
3. 打开 **Confirm signup** template：同样把 `{{ .ConfirmationURL }}` 替换成 `{{ .Token }}`，Subject 改成 `【Personal Learning OS】注册验证码 {{ .Token }}`。
4. 点 Save。

> Supabase 默认会把 `{{ .Token }}` 渲染成 6 位数字。改完之后，"发送验证码"才会真的发出可用的 6 位数字邮件。

## 6. 在 Supabase 里执行数据库 migration

项目里的三条 `supabase/migrations/` 文件按时间顺序准备好 Phase A 的表、索引、触发器、事务函数和 RLS。请全部执行，不要只执行初始 migration。

执行方式二选一：

### 方式 A：用 Supabase SQL Editor（最简单）

1. Supabase Dashboard → **SQL Editor → New query**。
2. 按顺序把 `supabase/migrations/` 下这三条文件的完整内容粘贴并执行：`20260830000000_phase1_initial_schema.sql`、`20260831000000_phase_a_integrity.sql`、`20260831010000_phase_a_write_transactions.sql`。
3. 点 Run。
4. 切到 **Table Editor**，确认看到 `profiles`、`workspaces`、`workspace_members`、`notes`、`knowledge`、`reflections` 等表。

### 方式 B：用 Supabase CLI（推荐给后续阶段）

需要先装 [Supabase CLI](https://supabase.com/docs/guides/cli) 和 [Docker Desktop](https://www.docker.com/products/docker-desktop/)：

```bash
# 登录（会打开浏览器授权）
supabase login

# 关联到远程项目（项目 ID 在 Dashboard → Project Settings → General）
supabase link --project-ref <你的项目ID>

# 把 migration 推到远程
supabase db push
```

`supabase db push` 会执行 `supabase/migrations/` 下所有未应用的 migration，并记录到 `_supabase_migrations` 表。

## 7. 验证"发送验证码"真的能跑

1. 启动开发服务器：
   ```bash
   cd "E:\Personal Learning"
   npm run dev
   ```
2. 打开 http://localhost:3000/register。
3. 选"邮箱验证码"、输入一个**真实可接收邮件**的邮箱，点"发送验证码"。
4. 如果一切正常：右上角提示"验证码已发送"，且收件箱里能收到一封带 6 位数字的邮件。
5. 如果仍报错"当前登录服务尚未配置"：回到第 3 步检查 `.env.local` 的两个变量值是否准确、有没有多余空格或换行；然后**完全重启** dev server。

## 8. 频率与生产前提示

- **免费项目 OTP 邮件**每小时约 4 封、同 IP 触发风控时会更慢，仅供本地调试够用。
- 正式部署前强烈建议在 **Authentication → SMTP Settings** 接入自建 SMTP（如 Resend、Mailgun、阿里云邮件推送），把 Supabase 内置邮件关掉，避免被限流。
- **Anon key 可以公开**，但 `service_role` 必须只在服务端使用；Phase 2 起所有写后台操作的代码会要求读 `SUPABASE_SERVICE_ROLE_KEY`。

## 9. 常见错误速查

| 现象 | 排查 |
| --- | --- |
| "当前登录服务尚未配置" | `.env.local` 缺失 / 拼错 / 有多余空格；dev server 没重启 |
| "Missing NEXT_PUBLIC_SUPABASE_URL" | 同上 |
| 邮件里只有链接没有 6 位数字 | 第 5 步：Email Templates 没改成 `{{ .Token }}` |
| 邮件收不到 | 检查垃圾邮件；免费项目有 IP 风控，多试几次或换邮箱 |
| verifyOtp 报 "otp_expired" | 6 分钟内没输入就过期，点"重新发送验证码"再试 |
| 注册后看不到个人 Workspace | migration 没跑；回到第 6 步 |

完成第 3–6 步后，"发送验证码"就应该真的可以发了。如果还卡在某一步，把控制台报错或具体步骤截图发给我，我帮你接着排。