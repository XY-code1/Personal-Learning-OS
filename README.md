# Personal Learning OS

个人学习工作台：把笔记、知识、项目、任务、实验、心得和认知变化，放在同一个可关联、可版本化、可迁移的系统里。

> **当前状态：V1 收口阶段。** Auth → Workspace → Note / Knowledge / Task / Cognitive 核心链路已经打通，Import / Export 与只读 AI Assistant 可用；Projects、Experiments、Topics、Reflections、Settings 等模块仍在逐步补齐。详见 [docs/ROADMAP.md](docs/ROADMAP.md) 与 [docs/PROGRESS.md](docs/PROGRESS.md)。

## 功能模块

| 模块 | 说明 | 状态 |
| --- | --- | --- |
| Dashboard | 今日任务、最近内容、学习概览 | 可用 |
| Inbox | 快速记录、待整理内容 | 可用（快速记录） |
| Notes | Markdown 笔记、append-only 版本、软归档 | 可用 |
| Knowledge | 知识卡片、理解版本、Evidence、Reflection、Gap、Next Action | 可用 |
| Explore | Knowledge Constellation 知识图谱 | 可用 |
| Timeline | 学习事件时间线 | 可用 |
| Tasks | Todo / 学习 / 项目 / 问题 / Bug 任务 | 可用 |
| Import / Export | Markdown / TXT / JSON 迁移 | MVP |
| AI Assistant | 只读个人知识问答，回答带来源 | MVP |
| AI Understanding Review | Knowledge 版本只读 Review，确认后写入新版本 | 已实现（需配置模型） |
| Projects / Experiments / Topics / Reflections / Settings | 实践与认知模块 | 占位，待补齐 |
| Global Search | 跨模块搜索 | 未实现 |

## 技术栈

- [Next.js](https://nextjs.org/) 16（App Router）+ TypeScript
- Tailwind CSS + shadcn/ui
- Supabase（Auth + PostgreSQL + Row Level Security）
- OpenAI-compatible Provider Adapter（密钥仅保留在服务端）

## 快速开始

### 前置要求

- Node.js 20+
- 一个 [Supabase](https://supabase.com/) 项目（免费档即可）

### 1. 配置环境变量

在项目根目录创建 `.env.local`：

```env
# Supabase 公开配置（可暴露到浏览器，真正隔离靠 RLS）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 仅服务端使用
SUPABASE_SERVICE_ROLE_KEY=

# AI Provider（可选，OpenAI-compatible）
AI_API_KEY=
AI_MODEL_KEY=
AI_BASE_URL=
```

完整步骤见 [docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md)。

### 2. 执行数据库 migration

按顺序执行 `supabase/migrations/` 下的全部 SQL（可用 Supabase SQL Editor，或 `supabase db push`）。

### 3. 启动

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 检查 |
| `npm test` | 运行 `tests/` 下的测试 |

## 项目结构

```text
src/
  app/            # 路由（App Router）
  components/     # 通用 UI 与布局
  features/       # 功能模块 UI
  server/         # 服务端业务规则、数据访问、AI Provider
  lib/            # Supabase 客户端等
supabase/
  migrations/     # 数据库 schema 与 RLS（唯一事实来源）
docs/             # 产品、架构、数据库、路线文档
tests/            # 结构与回归断言
```

## 数据与安全

- 所有个人数据都归属 Workspace，数据库使用 RLS 做工作区隔离。
- 版本历史、时间线与审计日志为追加式记录。
- AI 默认只读；任何 AI 修改都必须先形成用户可见的 Proposal，确认后才在事务中写入。
- 密钥仅保留在服务端环境变量中，不进入客户端和数据表。

## 文档

- [产品说明](docs/PRODUCT.md)
- [架构](docs/ARCHITECTURE.md)
- [数据库](docs/DATABASE.md)
- [开发路线](docs/ROADMAP.md)
- [进度记录](docs/PROGRESS.md)
- [Supabase 接入指南](docs/SUPABASE-SETUP.md)

## License

[MIT](LICENSE)
