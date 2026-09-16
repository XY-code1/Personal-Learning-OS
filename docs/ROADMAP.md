# Personal Learning OS 开发路线

## Phase 0：基础工程

- Next.js、TypeScript、Tailwind、shadcn/ui
- 环境变量、代码规范、Git、CI
- Supabase 配置和 migration 体系

## Phase A：基础数据层 + Auth（当前阶段）

- Supabase Email password Auth
- Supabase Email OTP：6 位验证码、倒计时、重新发送和验证
- User → Workspace → Personal Data 隔离
- Note、Knowledge、Task 的真实读取、创建、编辑、软归档
- Note/Knowledge append-only version 的首个版本和更新版本写入
- Timeline event 写入基础
- RLS、事务型 RPC、loading/empty/error 状态

验收：注册/验证码/登录/退出/重新登录可用；创建的数据刷新后仍存在；RLS 隔离不同用户；Note、Knowledge、Task CRUD 可用；lint/typecheck/build/test 通过。

## Phase 1：Cognitive Layer MVP（当前执行）

- Knowledge Detail：Current Understanding、Understanding History、Evidence、Reflections、Knowledge Gaps、Next Actions、Timeline
- 手动创建 Learning Evidence、Reflection v1、Knowledge Gap，并关联现有 Task
- 复用 knowledge_versions、reflection_versions、knowledge_tasks、timeline_events
- 不接入 AI、RAG、Embedding 或自动推断

验收：用户可以从 Knowledge Detail 创建 Reflection、Evidence、Knowledge Gap，关联已有 Task，并看到对应的版本与 Timeline 事件。

## Phase 2：Cognitive Evolution（当前执行）

- Knowledge Detail 展示 Understanding V1、V2、V3 等真实版本历史
- Knowledge Version 精确关联来源 Evidence、Reflection、Project 和 Experiment
- 手动记录变化原因，并在 Timeline 展示“你更新了对某条知识的理解”
- Compare Versions 使用轻量文本比较展示 Added、Removed、Changed 和 Reason
- 继续复用 knowledge_versions、learning_evidence、reflection_versions 和 timeline_events

验收：编辑 Knowledge 后可看到新版本；不同版本可比较；来源和变化原因可追溯；既有数据无需迁移回填。

## P1.5 / P2.1.1：AI Understanding Review

- 在 Knowledge Detail 选择已有 Understanding Version，主动请求只读 AI Review。
- Review 输出 verdict、confidence、correct_points、issues、missing_points 和 suggested_revision。
- AI 结果先作为 Proposal 展示；用户确认后才能创建新 Knowledge Version 或 Knowledge Gap。
- 创建新版本时复用 knowledge_versions，并在事务内校验基础版本；确认记录写入 timeline_events 和 audit_logs。
- AI Provider 使用 OpenAI-compatible Adapter，服务端密钥隔离；本阶段不实现 RAG、Embedding、Agent 或自动修改。

验收：用户可以请求 Review、编辑建议内容、明确确认创建新版本或 Knowledge Gap；版本冲突时拒绝写入并要求重新 Review。

## Phase B：最小 Cognitive Loop

- Knowledge → Reflection → Reflection Version
- 复用现有 `knowledge_versions`、`reflection_versions`、`timeline_events`
- Knowledge Detail 增强：Current Understanding、认知版本历史、关联 Note/Project/Experiment
- Cognitive Timeline 作为现有 Timeline 的增强投影

## Phase C：Evidence、Gap、Next Action

- Learning Evidence
- Knowledge Gap
- Next Action
- 使用 additive migration，不破坏旧数据
- 暂不自动推断历史，不自动批量回填

## Phase D：Notes 内容工作流

- Inbox 整理为 Note
- Markdown 编辑器和自动保存
- 标签、主题和核心关联
- Note 版本浏览与迁移

## Phase E：Projects、Tasks、Experiments 增强

- 项目、任务、Bug、问题和实验的完整工作流
- 项目与知识、笔记、实验关联
- 真实进度和复盘上下文

## Phase F：迁移能力

- Markdown 导入导出
- JSON 完整导入导出
- TXT 和 PDF 文本导入
- 冲突预览和恢复

## Phase G：只读 AI / RAG

- Embedding pipeline
- 混合搜索
- 带引用问答
- 摘要和知识卡片草稿

## Phase H：确认式 AI 写入

- Diff 预览
- 用户批准/拒绝
- 版本冲突检查
- Audit Log

## Phase I：发布与运维

- 性能、安全、备份恢复
- 全流程 E2E
- 监控和运维文档

完成一个 Phase 后必须停止，等待人工验收，不自动进入下一阶段。
