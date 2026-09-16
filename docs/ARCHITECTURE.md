# Personal Learning OS 架构

## 技术基线

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL + Supabase
- Supabase Auth + Storage
- pgvector 作为后续向量能力的扩展位置
- 模型适配层支持 OpenAI-compatible 接口，但业务代码不绑定具体供应商

## 当前形态

使用模块化单体，而不是微服务：

```text
Next.js UI / Route Handlers
        ↓
Auth + Workspace Context
        ↓
Validation
        ↓
Server Domain Modules
        ↓
PostgreSQL / Supabase Storage
        ↓
Timeline + Audit + Future Jobs
```

页面和路由位于 `src/app`，通用 UI 位于 `src/components`，功能 UI 位于 `src/features`，服务端业务和数据访问位于 `src/server`。

## 分层规则

1. UI 负责展示和交互，不直接使用数据库密钥。
2. Route Handler 负责 HTTP 边界，不承载复杂业务规则。
3. Server module 负责业务规则、权限检查和事务编排。
4. Repository/SQL 负责持久化和查询。
5. Storage 只保存文件；核心 Markdown 内容仍保存在数据库。

## 数据一致性

业务实体的写入、版本记录、Timeline 事件、Audit Log 和索引任务记录应尽量在同一个数据库事务中完成。异步任务只处理可重试的后续工作。

## 编辑器策略

编辑器可以使用 Tiptap/ProseMirror。Markdown 是迁移和导出的稳定格式，编辑器 JSON 只能作为编辑状态缓存。Markdown 往返测试是发布前要求。

## 权限策略

所有个人数据带 `workspace_id`，数据库使用 RLS 做工作区隔离。普通请求使用用户会话；服务密钥只允许在服务端 Worker 使用。

## Phase 1 不实现

- AI Provider 实际调用
- RAG 和 Embedding
- pgvector 实际检索
- Agent 和 Tool Calling
- 复杂搜索
- 独立向量数据库
- 微服务和 GraphQL
