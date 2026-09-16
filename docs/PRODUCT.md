# Personal Learning OS 产品说明

## 定位

Personal Learning OS 是个人知识与认知成长工作台。它把笔记、知识、项目、任务、实验、心得、错误复盘、认知变化和 AI 知识库问答放在同一个可关联、可版本化、可迁移的系统中。

## 核心对象

| 对象 | 定义 |
| --- | --- |
| Note | 原始笔记、随笔、灵感和思考素材 |
| Knowledge | 整理后的可复用知识 |
| Reflection | 错误、心得和认知变化 |
| Project | 实践上下文 |
| Experiment | 实验与验证记录 |
| Task | 下一步行动 |
| Timeline | 学习和业务事件时间线 |

## 产品模块

- Dashboard：今日任务、最近内容、学习概览、最近认知变化。
- Inbox：快速记录和待整理内容。
- Notes：快速笔记、随笔、Markdown、标签、主题、自动保存和关联。
- Knowledge：知识卡片、摘要、正文、分类、掌握等级、关系和版本。
- Projects：目标、技术栈、状态、进度、任务、实验和复盘。
- Tasks：Todo、学习任务、项目任务、Bug 和待解决问题。
- Experiments：目标、环境、过程、结果、问题、解决方案和结论。
- Reflections：初始理解、触发事件、问题、错误原因、修正观点、当前不足和下一步行动。
- Timeline：学习记录、知识变化、项目进度、认知变化和任务完成。
- Import/Export：Markdown、TXT、PDF 和 JSON，优先保证 Markdown/JSON 迁移。
- AI Assistant：后续接入个人知识库 RAG；回答必须带引用，写操作必须确认。

## Phase 1 范围

Phase 1 只建立长期可维护的项目骨架、工作区 UI、Dashboard 第一版、Supabase 接入位置、Workspace-scoped 数据库 Schema、项目规范和独立路由。

Phase 1 不实现真实 AI、RAG、Embedding、Agent、Tool Calling、知识图谱、PDF 导出、复杂全文搜索、微服务或 GraphQL。

## 产品原则

- 原始记录和整理后的知识分离。
- 认知变化不可覆盖，只能追加新版本。
- 所有个人数据必须属于 Workspace。
- 数据必须可迁移。
- AI 默认只读。
- 不用大量虚假数据装饰空状态。
