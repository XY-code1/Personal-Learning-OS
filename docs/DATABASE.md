# Personal Learning OS 数据库

## 数据原则

- `auth.users` 由 Supabase Auth 管理。
- 应用用户通过 `profiles` 扩展。
- `workspaces` 是所有个人数据的隔离边界。
- 业务表使用 UUID、UTC `timestamptz` 和软删除。
- 状态使用可演进的文本代码和约束，不把频繁变化的状态硬编码成数据库 enum。
- 核心关联使用显式多对多表，不使用失去外键完整性的通用关联表。

## 第一版表清单

### 身份与工作区

- `profiles`
- `workspaces`
- `workspace_members`

### 内容

- `notes`
- `note_versions`
- `knowledge`
- `knowledge_versions`
- `topics`
- `tags`

### 关系

- `note_topics`
- `knowledge_topics`
- `note_tags`
- `knowledge_tags`
- `note_knowledge`
- `note_projects`
- `note_tasks`
- `knowledge_projects`
- `knowledge_tasks`
- `knowledge_relations`
- `experiment_notes`
- `experiment_knowledge`
- `reflection_topics`
- `reflection_notes`
- `reflection_knowledge`
- `reflection_projects`
- `reflection_tasks`

### 实践与认知

- `projects`
- `tasks`
- `experiments`
- `reflections`
- `reflection_versions`
- `learning_evidence`
- `knowledge_gaps`
- `timeline_events`
- `audit_logs`

### 后续能力预留

- `file_assets`
- `import_export_jobs`
- `import_items`
- `search_documents`
- `search_chunks`
- `embedding_jobs`
- `ai_conversations`
- `ai_messages`
- `ai_citations`
- `ai_change_requests`

## Workspace 归属

所有 Notes、Knowledge、Projects、Tasks、Experiments、Reflections、Topics、Tags、Timeline、AI 会话和导入导出任务都必须携带 `workspace_id`。

## Reflection 版本

`reflections` 表示一个持续思考主题；`reflection_versions` 追加保存 v1、v2、v3 等认知版本，字段覆盖初始观点、触发事件、发现问题、错误原因、修正观点、当前不足和下一步行动。

历史版本不允许被更新覆盖。

## 后续向量结构

## Phase 2：Cognitive Evolution

Phase 2 在现有 Knowledge、knowledge_versions、learning_evidence、reflection_versions、projects 和 experiments 之上增加版本来源追踪。learning_evidence 新增 nullable 的 knowledge_version_id 外键，旧 Evidence 不需要回填即可继续读取。

Knowledge 更新通过新的带人工变化原因 RPC 写入下一条 knowledge_versions，并将变化原因与“你更新了对某条知识的理解”事件写入 timeline_events。旧的更新 RPC 保留，保证既有调用方兼容。

Compare Versions 使用客户端轻量文本行比较展示 Added、Removed、Changed 和 Reason，不创建额外版本表或 Diff 表。
## Cognitive Layer MVP

learning_evidence 是 Knowledge 的手动证据记录，可选关联 Note、Project、Experiment、Reflection 或 Reflection Version；knowledge_gaps 是 Knowledge 当前不足的手动记录，可选关联 Topic 和 Project。

本 MVP 复用 knowledge_versions 作为 Understanding History，复用 reflection_versions 作为 Reflection History，复用 knowledge_tasks 作为 Next Action 关联，复用 timeline_events 作为 Cognitive Timeline 投影。迁移文件为 supabase/migrations/20260901000000_cognitive_layer_mvp.sql，只使用 additive migration，没有创建 understanding_versions、cognitive_timeline 或 next_actions。

Evidence、Knowledge Gap、Reflection 创建和 Knowledge-Task 关联都会写入 Timeline event；Reflection、Reflection Version、关系记录和 Timeline event 通过数据库 RPC 在同一事务中创建。

`search_documents` 对应实体或实体版本，`search_chunks` 保存切片和向量，`embedding_jobs` 负责重建索引。Embedding 模型、维度和索引版本必须记录，便于替换模型后重新索引。

## Phase A 增量实现补充

Phase A 复用已有 `notes`、`note_versions`、`knowledge`、`knowledge_versions`、`tasks` 和 `timeline_events`，没有创建重复的 Cognitive Layer 主表。

新增 migration：

- `supabase/migrations/20260831000000_phase_a_integrity.sql`：收紧核心 insert 的 `created_by = auth.uid()`，并校验用户 Timeline event 的 `actor_id`。
- `supabase/migrations/20260831010000_phase_a_write_transactions.sql`：提供 `create_note_with_version`、`update_note_with_version`、`create_knowledge_with_version`、`update_knowledge_with_version` RPC，将主体、append-only 版本和 Timeline event 放在同一数据库事务中。

执行顺序必须是初始 migration、integrity migration、transaction migration。Workspace ID 由当前会话服务端查询得到，客户端表单不接受任意 Workspace 归属。
