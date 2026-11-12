# Personal Learning OS TODO

更新时间：2026-11-12

当前阶段：**V1 收口（P0：修复 Broken / Placeholder 核心模块）**。Phase A、Phase 1、Phase 2、P1.5、P2.1、Import / Export MVP、只读 AI Assistant MVP 已完成代码实现；V1 剩余工作见 [docs/ROADMAP.md](docs/ROADMAP.md) 的「V1 收口待办」。

## 近期已完成

- [x] 数据完整性：版本 / 时间线 / 审计表 append-only 收敛（PR #1）。
- [x] Timeline 真实读取页、Global Search 禁用、Dashboard / AI 占位链接收敛（PR #2）。
- [x] README 重写、LICENSE、文档状态统一（PR #3）。
- [x] 工程化：CI、workspace layout `force-dynamic`、重复路由收敛、真实工作区名与记录数（PR #4）。
- [x] 核心表 insert 强制 `created_by = auth.uid()`（PR #5）。
- [x] 多成员 Workspace 运行时支持、密码找回 / 注册确认回调路由（PR #6）。
- [x] Knowledge Detail 关联链接不再指向占位模块（PR #7）。

## V1 收口待办

- [ ] Projects / Experiments / Topics / Reflections / Settings 从占位页升级为最小真实 CRUD。
- [ ] Global Search 实现跨模块关键词搜索。
- [ ] JSON 导入冲突预览与跨表原子导入。
- [ ] AI Assistant 流式对话、精确 Citation、Tool Calling。
- [ ] 真实登录态人工验收（RLS 隔离、非空 Explore、AI Review）。

## 历史完成项

### Phase 1 基础

- [x] Next.js App Router、TypeScript、Tailwind、shadcn/ui 初始化。
- [x] 项目规范与产品架构文档。
- [x] Supabase 环境模板与 workspace-scoped migration。
- [x] 工作区外壳、Sidebar、Dashboard 与独立路由。
- [x] lint / typecheck / build / test 修复。

### Landing UI

- [x] Hero 与区块标题文案审计。
- [x] 区块节奏重构，每个区块有独立的信息任务。
- [x] Hero Workspace Preview 视觉升级。
- [x] Note / Reflection / Project / Timeline / AI 产品预览。
- [x] GSAP / ScrollTrigger 动效与 reduced-motion 处理。
- [x] 响应式与可访问性一致性检查。
