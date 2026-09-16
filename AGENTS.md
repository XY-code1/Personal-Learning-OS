# Personal Learning OS Development Guide

## Framework guidance

This project uses the current Next.js App Router. Before changing framework conventions, inspect the relevant guide under `node_modules/next/dist/docs/` and keep route handlers, server components, and client components in their intended boundaries.

## Product vocabulary

- Note = 原始笔记、随笔、灵感和思考素材
- Knowledge = 整理后的可复用知识
- Reflection = 错误、心得和认知变化
- Project = 实践上下文
- Experiment = 实验与验证记录
- Task = 下一步行动
- Timeline = 学习和业务事件时间线

## Architecture rules

- Keep UI, business logic, and data access separate.
- Every personal record belongs to a Workspace.
- Keep route handlers thin; domain rules belong in server modules.
- AI providers must be replaceable through an adapter boundary.
- Markdown and JSON must remain long-term migration formats.
- AI is read-only by default.
- Any AI modification must first become a user-visible pending operation.
- AI must never delete data or make large-scale changes without explicit user confirmation.
- Reflection and Knowledge history are append-only versions.
- Validate external input at trust boundaries and keep secrets server-only.

## UI rules

- Build a focused personal learning workspace, not an enterprise admin dashboard.
- Prefer calm surfaces, clear hierarchy, restrained borders, meaningful whitespace, and one intentional accent.
- Keep reusable primitives in `src/components`; keep feature-specific UI in `src/features`.
- Every route needs a useful loading, empty, error, or success state as appropriate.
- Preserve keyboard focus, labels, contrast, and touch-friendly targets.

## Data rules

- Use PostgreSQL migrations as the schema source of truth.
- Use UUID identifiers and UTC timestamps.
- Use explicit join tables for core relationships.
- Use JSONB only for settings, editor cache, provider metadata, and import/export manifests.
- Prefer soft deletion; hard deletion must be an explicit user action.

## AI safety rules

- Read-only AI tools may search and summarize indexed personal data.
- Write-capable AI flows must produce a diff, target list, base version, and impact preview.
- Approval must re-check the current version inside a transaction before applying.
- Record approved AI changes in `audit_logs` and `timeline_events`.

## Phase discipline

- Run tests and provide manual acceptance steps after every Phase.
- Do not automatically start the next Phase after completing the current one.
- Avoid speculative abstractions, microservices, GraphQL, and extra dependencies until a measured need exists.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
