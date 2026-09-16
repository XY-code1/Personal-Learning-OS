# AI / RAG 预留设计

## Phase 1 边界

Phase 1 不调用真实模型，不生成 Embedding，不执行 RAG 检索，不实现 Agent、Tool Calling 或 AI 数据修改。

## P1.5 / P2.1.1：AI Understanding Review

用户可以在 Knowledge Detail 选择一个已有的 Understanding Version，主动发起只读 Review。服务端只把该版本和当前 Workspace 内已关联的 Evidence 发送给可替换的 OpenAI-compatible Chat Provider，要求返回结构化字段：

- `verdict`
- `confidence`
- `correct_points`
- `issues`
- `missing_points`
- `suggested_revision`

Review 结果是临时的用户可见 Proposal，不会自动写入 Knowledge。用户可以明确选择：

```text
AI Review Proposal
  ├─ 用户编辑并确认 → apply_approved_knowledge_review RPC → 新 Knowledge Version
  └─ 用户确认 → 现有 createKnowledgeGapAction → Knowledge Gap
```

确认创建新版本时，RPC 会在数据库事务中锁定 Knowledge，重新检查 `knowledge_version_id` 与 `current_version_no`；如果版本已经变化，操作会拒绝并要求重新 Review。成功确认会写入现有 `knowledge_versions`、`timeline_events` 和 `audit_logs`，不创建新的 Review 主表。

本阶段不实现 RAG、Embedding、自动修订、自动 Gap 检测或 AI Agent。

### 服务端配置

在 `.env.local` 填写以下服务端变量：

```text
AI_API_KEY=your-server-side-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL_KEY=your-model-name
```

也兼容已有的 `AI_PROVIDER_KEY` 作为 API key fallback。不要使用 `NEXT_PUBLIC_` 前缀，也不要把密钥提交到仓库。

## 模型解耦

服务端使用内部能力边界：Chat、Embedding、Rerank 和可选 OCR。每个能力通过 Provider Adapter 接入。业务模块只依赖能力契约，不依赖具体 SDK、供应商或模型名称。

## 只读检索流程

```text
用户问题
  ↓
身份与 Workspace 校验
  ↓
关键词 + 语义检索
  ↓
按 Workspace、类型、版本过滤
  ↓
合并和可选重排
  ↓
带来源上下文生成答案
  ↓
保存消息和引用
```

## 引用

每条引用应指向 `source_id`、`source_version_id` 和 `chunk_id`，并保存可展示的原文片段和位置。无法从个人知识库找到依据时，AI 必须明确说明。

## AI 写入安全

AI 不能直接更新核心表。AI 只能创建 `ai_change_requests`，其中包含目标、基础版本、Diff、影响范围和操作类型。用户确认后，服务端重新读取目标版本并在事务中应用。

任何涉及删除、大规模修改、关联重构或批量标签变更的操作都需要显式确认。

## 索引版本

每个搜索文档记录内容哈希、Embedding 模型、向量维度和索引版本。模型更换后重新索引，不混用不兼容的向量。
