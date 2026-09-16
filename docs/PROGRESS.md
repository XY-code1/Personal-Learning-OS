# Personal Learning OS 进度记录

更新时间：2026-09-16

## 当前阶段

V1 功能范围已冻结，当前在不破坏既有模块的前提下增量实现 Import / Export 与只读 AI Assistant MVP。P1.5 / P2.1.1 AI Understanding Review 已完成代码实现与本地验证；真实模型人工验收仍依赖服务端 AI 配置。

## 本轮增量修复：工作区页面切换性能

- 为整个工作区路由组增加共享 `loading.tsx`，动态页面切换期间立即显示统一骨架屏。
- 为 Sidebar 导航增加轻量进行中反馈，避免等待服务端响应时看起来像点击无效。
- development-only Auth bypass 下跳过 Proxy 的重复 Session 请求；页面数据访问和 RLS 保持不变，production 鉴权不变。
- development-only Auth bypass 下不再尝试失效或残留 Session Cookie；关闭 bypass 后恢复真实 Auth → Workspace 数据链路。
- 移除全局 `scroll-behavior: smooth`，让工作区路由切换使用即时滚动，避免 Next.js 16 处理平滑滚动时产生额外开销。

## 本轮增量实现：Import / Export + AI Assistant

### 已完成

- Import / Export 页面从说明性占位页升级为真实交互。
- Markdown / TXT 文件会通过认证的 Import API 作为新 Note 写入当前 Workspace，并复用 create_note_with_version，保留首个 Note Version 和 Timeline event。
- Personal Learning OS JSON 可导出当前 Workspace 的实体、版本、关系、Evidence、Knowledge Gap 和 Timeline 数据，不包含 auth.users 或 service role key。
- JSON 导入采用 additive insert：服务端覆盖文件中的 workspace_id、created_by 和用户 actor_id，不执行 update、delete 或覆盖已有记录；稳定 ID、版本和关系按原始 JSON 写入。
- AI Assistant 新增只读问答 API；仅从当前 Workspace 的 Notes、Knowledge、Projects、Reflections 和 Timeline 候选上下文中回答。
- AI 回答要求返回 source_ids，服务端只将模型返回且确实存在于当前 Workspace 上下文的来源映射为 Sources。
- 未配置 AI Provider、未登录、没有匹配来源或 Provider 失败时，页面分别显示明确状态；AI Assistant 没有任何写数据库操作。
- 新增 Import / Export 与 AI Assistant 的静态 smoke tests。

### 当前限制

- Markdown 导入当前是一条新 Note；Markdown 不尝试反向重建版本、关系或其他实体。
- JSON 导入是安全的新增 MVP，不提供冲突预览或跨表事务；重复稳定 ID 会由数据库拒绝，导入前应使用全新 Workspace 或确认目标 Workspace 没有这些 ID。
- AI Assistant 当前是关键词筛选上下文 + OpenAI-compatible JSON Provider，不是 Embedding、Personal RAG、流式对话、Tool Calling 或持久化聊天记录。
- 真实 AI 回答需要在服务端配置 AI_API_KEY 或 AI_PROVIDER_KEY、AI_MODEL_KEY，并使用真实登录 Session；开发 bypass 不会伪造用户数据。

## V1 Completion Matrix

本节是当前 V1 的唯一完成度记录和剩余工作依据。状态针对“当前 V1 产品闭环”评估，而不是只判断某个页面是否存在：

- Implemented：该模块在当前 V1 范围内已有真实可用闭环。
- Partial：已有真实数据或核心能力，但仍缺少 V1 必需的页面、CRUD、关系或状态处理。
- Placeholder：有入口和静态 UI，但没有连接真实业务数据流。
- Broken：已有数据/写入能力，但用户无法通过承诺的主入口完成读取或闭环。
- Not Implemented：当前没有可用实现。

能力列说明：Supabase 表示是否读取真实 Supabase 数据；Workspace / RLS 表示服务端是否从当前会话推导 Workspace 并受 RLS 保护；状态表示 Loading、Empty、Error 是否同时覆盖；关系表示跨模块关联是否已经能在产品中使用。开发 bypass 下显示“尚未连接用户数据”属于预期状态，不等同于 mock 数据。

| 模块 | 状态 | UI | 真实 Supabase 数据 | CRUD | Workspace / RLS | Loading / Empty / Error | Responsive | Cross-module relations | 审计结论 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Partial | Implemented | Implemented：真实 counts、Notes、Knowledge、Tasks、Projects snapshot | Partial：Quick Capture 可创建 Note，其他区块为摘要 | Implemented：context + workspace_id + RLS | Partial：Empty / WorkspaceState 有；无独立 dashboard loading/error boundary | 基础响应式 | Partial：摘要链接存在，不能管理关系 | 具备真实工作台外壳，但项目和 Reflection 仍是提示区 |
| Inbox | Partial | Implemented | Implemented：读取 quick Notes，创建写入 Notes | Partial：快速记录可创建；整理/转换流程缺失 | Implemented | Partial：Empty 与 action feedback 有；无独立 loading/error | 基础响应式 | Not Implemented：没有 Note → Knowledge 整理关系 | 入口可用，但仍只是 Capture 队列 |
| Notes | Partial | Implemented | Implemented：真实 Notes 与 note_versions | Implemented：创建、编辑、软归档、版本写入 | Implemented：服务端推导 Workspace，RLS 保护 | Implemented：loading/error route、empty、操作反馈 | 基础响应式 | Partial：schema 有关系表，页面没有主题、标签、Knowledge、Project、Task 关联操作 | 基础 CRUD 已闭环，完整内容工作流未完成 |
| Knowledge | Partial | Implemented：列表、Detail、Cognitive Core、AI Review 入口 | Implemented：Knowledge、knowledge_versions、Cognitive 数据均走 Supabase | Implemented：创建、带 reason 更新、软归档、版本、Evidence、Reflection、Gap、Task link | Implemented | Implemented：loading/error、empty、动作反馈、Inspector 状态 | 基础响应式 | Partial：Detail 展示多种关系，关系管理和实体详情仍不完整 | Cognitive Core 已较完整，但 V1 内容组织和独立实体工作流仍缺 |
| Topics / Tags | Placeholder | Placeholder：共享 ModuleEmptyPage | Not Implemented：仅 schema 存在 | Not Implemented | Schema 有 RLS；页面没有运行时数据访问 | Placeholder only：没有数据感知 loading/error | 外壳可响应式 | Not Implemented | topics、tags、四类 Note/Knowledge join 表均未接入 UI |
| Explore / Knowledge Constellation | Implemented | Implemented：真实图谱、Inspector、列表降级 | Implemented：Knowledge 节点、knowledge_relations 边和批量指标 | 只读视图：无写 CRUD，符合探索定位 | Implemented：所有查询限定当前 Workspace，RLS 仍生效 | Implemented：loading、error、0 节点、筛选空结果、Inspector retry | Implemented：Desktop / Tablet / Mobile 列表降级 | Implemented：relations、Topic、Gap、Evidence 等指标可查看 | 代码满足 P2.1；真实非空数据交互仍需带真实 Session 人工验证 |
| Projects | Placeholder | Placeholder：共享 ModuleEmptyPage | Not Implemented：schema 有，页面无 query | Not Implemented | Schema 有 RLS；页面未接入 | Placeholder only | 外壳可响应式 | Not Implemented：Knowledge/Task/Experiment 只有底层关系 | Dashboard 和 Knowledge Detail 有入口，但落点没有 CRUD |
| Tasks | Partial | Implemented | Implemented：真实 Tasks | Implemented：创建、编辑、状态更新、软归档 | Implemented | Implemented：loading/error、empty、pending/feedback | 基础响应式 | Partial：可通过 Knowledge Detail 关联为 Next Action，Project 关系页面未接入 | 基础 Task 闭环可用，但项目上下文和问题流未完成 |
| Experiments | Placeholder | Placeholder：共享 ModuleEmptyPage | Not Implemented：schema 有，页面无 query | Not Implemented | Schema 有 RLS；页面未接入 | Placeholder only | 外壳可响应式 | Not Implemented：experiment_notes、experiment_knowledge 未接入 | Knowledge Detail 能展示入口，但无法创建或管理实验 |
| Reflections | Partial | Partial：独立页面是 Placeholder，Knowledge Detail 可创建 Reflection v1 | Partial：Reflection v1、reflection_versions、reflection_knowledge 可真实写入 | Partial：Detail 可创建；独立列表、编辑和后续版本缺失 | Implemented for Detail action | Partial：Detail 有空状态/action feedback；独立页无数据状态 | 基础响应式 | Partial：Knowledge Detail 可关联；Notes/Projects/Tasks 关系管理缺失 | 核心认知记录存在，但一级 Reflections 入口尚未形成闭环 |
| Timeline | Broken | Placeholder：页面共享 ModuleEmptyPage | Broken：写入 timeline_events 的 action 存在，但主路由不查询 | Not Implemented：只有写入投影，没有列表读取 | Schema 有 RLS；主页面没有 query | Placeholder only | 外壳可响应式 | Broken：用户无法从 Timeline 入口查看任何跨模块事件 | 这是明确 Broken flow：事件已生成但产品入口不可读 |
| Global Search | Placeholder | Placeholder：有输入外观和 EmptyState | Not Implemented：没有 query、API 或搜索索引 | Not Implemented | Not Implemented at runtime | Placeholder only：输入无 submit/change 行为 | 基础响应式 | Not Implemented | 这是死交互，不应在 V1 宣称可搜索 |
| AI Assistant | Partial | Implemented：/ai 有只读问答表单、状态和 Sources 展示；Knowledge Detail 保留 Review UI | Partial：服务端按 Workspace 读取 Notes、Knowledge、Projects、Reflections、Timeline，并调用可替换 Provider | Partial：Review 是 proposal-first；Assistant 不写库、不保存会话 | Implemented for API：context + workspace_id + RLS | Implemented：加载、未配置、未登录、无匹配、Provider 错误和回答状态 | 基础响应式 | Partial：回答来源可回链；尚无 Personal RAG、Citation 片段和 Tool Calling | 只读问答 MVP 已接入，完整 Assistant 能力仍未完成 |
| Import / Export | Partial | Implemented：文件选择、导入反馈、Markdown / JSON 下载 | Partial：Markdown/TXT 创建真实 Note；JSON 读取/写入当前 Workspace | Partial：JSON additive insert，不覆盖；无冲突预览和跨表事务 | Implemented for API：context + workspace_id + RLS；不使用 service role | Partial：客户端错误/成功状态有；API 有格式、认证和服务错误 | 基础响应式 | Partial：JSON 保留版本与关系；Markdown 只生成可读副本 | 迁移 MVP 已接入，完整冲突预览、原子导入和 Obsidian 目录仍未完成 |
| Settings | Placeholder | Placeholder：共享 ModuleEmptyPage | Not Implemented：没有 profile/preferences 读写 | Not Implemented | Schema 有 profiles/workspaces；页面未接入 | Placeholder only | 外壳可响应式 | Not Implemented | 账户、Workspace、偏好和 AI 配置尚未形成设置流程 |

### 审计范围与证据

- 路由检查覆盖 Dashboard、Inbox、Notes、Knowledge、Explore、Topics、Projects、Tasks、Experiments、Reflections、Timeline、Search、AI、Import / Export、Settings；均能返回对应页面，没有 404。
- Explore 使用 knowledge 生成节点、knowledge_relations 生成边，并通过 Promise.all 批量读取版本、Evidence、Reflection、Project、Experiment、Gap、Topic 和 Relation 指标；未发现 mock node、mock edge 或按节点循环查询。
- Notes、Knowledge、Tasks 的 query/action 均通过 getWorkspaceContext 或 requireWorkspaceContext 获取当前用户 Workspace；Dashboard、Inbox、Knowledge Detail、Constellation Inspector 复用同一隔离边界。
- 本地 migration 共 6 条：初始 schema、Phase A integrity、Phase A transaction、Cognitive Layer MVP、Cognitive Evolution、AI Understanding Review。初始 schema 已包含 Projects、Experiments、Reflections、Topics、Tags、Timeline、全部核心 join 表和通用 RLS；Cognitive migration 新增 learning_evidence、knowledge_gaps，并复用 knowledge_versions、reflection_versions、knowledge_tasks、timeline_events。
- 当前开发 bypass 只允许绕过 UI 登录重定向，不伪造 Supabase Session、不关闭 RLS、不为数据查询使用 service role；因此浏览器开发态无法证明真实用户数据交互，非空 Explore 和跨用户隔离仍需要真实 Session 人工验收。
- 本次基线验证：npm run lint 通过；npm run typecheck 通过；npm test 通过，9/9；npm run build 通过。仓库当前没有历史 Git commit，git status 显示项目文件均为未跟踪状态，未发现可比较的历史 diff。

## V1 剩余问题清单

### 真正未完成的核心模块

1. Projects：没有列表、创建、编辑、状态/进度、项目任务和项目详情数据流。
2. Experiments：没有实验 CRUD，无法把项目实践变成可回看的验证记录。
3. Topics / Tags：schema 和 join 表已存在，但创建、管理、筛选、关联 UI 均未接入。
4. Reflections：Knowledge Detail 可创建 v1，但独立 Reflections 页面、列表、编辑和版本继续记录缺失。
5. Timeline：事件写入已存在，主页面却没有读取查询，是当前最明确的 Broken flow。
6. Global Search：输入控件无搜索行为，搜索 API、结果模型和跨模块查询均未实现。
7. Import / Export：Markdown/TXT Note 导入与 Markdown/JSON 导出已完成 MVP；JSON 冲突预览、跨表原子导入和 Obsidian 目录导入仍未完成。
8. Settings：profile、Workspace 设置、偏好与 AI 配置没有读写页面。
9. AI Assistant：/ai 已有只读问答 MVP；仍缺少流式对话、Personal RAG、精确 Citation、Tool Calling、异步 Run 和持久化会话。

### 关系断点

- Inbox → Notes 已可用，但 Inbox → Knowledge 的整理/转换没有完成。
- Knowledge Detail 能展示 Notes、Projects、Experiments、Reflections、Evidence、Gaps、Tasks 的关系，但 Projects、Experiments、Reflections 的目标页面大多仍是占位。
- 底层已有 note_topics、knowledge_topics、note_tags、knowledge_tags、note_knowledge、note_projects、note_tasks、knowledge_projects、knowledge_tasks、experiment_notes、experiment_knowledge、reflection_* 等关系表；关系数据模型不需要重建，缺的是安全的查询、写入和 UI。
- Dashboard 会读取 Projects 数量，但打开 Projects 仍进入占位页，形成“摘要有数据、实体入口不可用”的闭环断点。

### 重复或边界重叠

- /dashboard 与 /workspace/dashboard 都指向同一个 Dashboard 实现，是兼容入口别名，不应再复制第二套 Dashboard 业务逻辑。
- Dashboard Quick Capture 与 Inbox New 复用 QuickCapture 和 Note 写入动作，这是合理复用，不是重复领域模型。
- Knowledge Detail 与 Constellation Inspector 展示部分相同认知字段；它们应继续作为 Detail 与只读投影复用同一查询/类型，不应新增 Understanding 或 Cognitive Timeline 主表。
- /ai 静态 Assistant 入口与 Knowledge Detail 的 AI Understanding Review 目前存在产品入口错位；后续应让 Assistant 明确承载问答，Review 保留在 Knowledge Detail。
- Topics / Tags 是一个组合入口，但数据库是 topics 与 tags 两个实体；后续应保持实体分离、统一管理入口，不要重复建表。
- 未发现 understanding_versions、cognitive_timeline 或 next_actions 重复表；现有 knowledge_versions、reflection_versions、timeline_events、tasks 的复用方向正确。

## 唯一 V1 Roadmap

以下顺序是 V1 冻结后的唯一剩余路线。完成每个优先级后都必须停止、运行验证并等待人工验收，不自动进入下一项。

### P0：修复 Broken / Placeholder 核心模块

- 完成 Timeline 真实查询和列表展示，覆盖 Note、Knowledge、Task、Version、Evidence、Reflection、Gap、Task link 事件。
- 完成 Projects、Experiments、Reflections 的最小真实列表和 CRUD 入口。
- 完成 Topics / Tags 的最小管理、关联和筛选。
- 补齐动态路由的 loading、empty、error；删除无行为的死搜索输入或在实现前明确为 disabled。
- 验收：核心入口不再落入共享占位页，创建后的记录可以从对应一级导航读取。

### P1：完成 Cognitive Core + Knowledge Constellation

- 收敛 Knowledge Detail 的 Current Understanding、版本历史、Evidence、Reflection、Gap、Next Action、Timeline 读取和关系管理。
- 完成 Projects / Experiments / Reflections 与 Knowledge Detail 的真实可回链关系。
- 使用现有 knowledge_versions、reflection_versions、learning_evidence、knowledge_gaps、knowledge_tasks、timeline_events、knowledge_relations，不新增重复主表。
- 验收：Knowledge → Understanding Version → Evidence → Reflection → Gap → Task → Timeline 可从真实用户 Workspace 完整走通；Explore 通过真实数据显示节点、边和 Inspector。

### P2：AI Understanding Review

- 为真实模型配置提供 Review 运行时验收。
- 保留 verdict、confidence、correct_points、issues、missing_points、suggested_revision 的 proposal-first 流程。
- 用户确认后才创建新版本或 Knowledge Gap，禁止 AI 直接修改或删除。
- 验收：真实 AI Review、版本冲突保护、Proposal 编辑和确认后的 Timeline / Audit Log 均可验证。

### P3：AI Assistant + Tool Calling

- 在 /ai 建立只读个人知识问答入口。
- AI Provider、工具协议和业务服务保持解耦；写操作只能生成待确认 Proposal。
- 首批工具仅允许按 Workspace 搜索、读取和总结 Notes、Knowledge、Projects、Reflections、Timeline。
- 验收：回答有明确数据边界；任何写操作都有目标、diff、基础版本和用户确认。

### P4：Global Search + Personal RAG + Citation

- 先完成跨模块关键词搜索，再接入索引、Embedding 和 pgvector。
- 建立 chunk、metadata、source reference 和 citation ViewModel，引用必须回到 Note、Knowledge Version、Evidence、Reflection 或 Project。
- 验收：搜索和问答都只返回当前 Workspace 数据，并可打开引用源。

### P5：Import / Export

- 优先 Markdown / Obsidian-compatible 导入导出。
- JSON 作为完整保真迁移格式，保留 UUID、Workspace 内关系、版本和时间线。
- TXT / PDF 仅在明确文本抽取边界后接入，不影响 Markdown / JSON 主路径。
- 验收：导出后可在全新 Workspace 导入，关系和版本不丢失；冲突有预览，不静默覆盖。

### P6：Settings & Preferences

- 接入 profiles、workspaces、preferences、时区/语言、AI Provider 配置入口。
- Secret 只保留在服务端环境或安全配置，不写入客户端和普通数据表。
- 验收：用户只能修改自己有权限的 Profile / Workspace 设置，刷新和重新登录后保持。

### P7：AI Runs / Jobs / Error Handling / Observability

- 在已有 AI Provider 边界上增加可追踪 Run、异步 Job、重试、幂等和错误分类。
- 记录耗时、Provider、模型、token/cost（可用时）、引用数量和用户确认结果；不记录密钥。
- 验收：失败可重试、超时不阻塞 UI、同一任务不会重复写入，敏感信息不进日志。

### P8：Responsive Mobile Web + PWA

- 在真实业务闭环稳定后补齐移动端导航、编辑、图谱降级、触控目标、离线边界和安装能力。
- 继续复用 Supabase/API/AI backend，Native App 不在 V1 范围。
- 验收：核心查看、创建、编辑和确认流程在移动 Web 可用，无明显横向溢出。

### P9：最终 Information Architecture / Sidebar 重构

- 只有 P0-P8 业务闭环稳定后，才统一收敛 Sidebar 和一级导航。
- 保留现有路由兼容或提供迁移重定向，不删除已有功能。
- 验收：每个一级入口有清晰产品职责，没有重复入口和死链接。

### P10：最终 UI / Motion / Accessibility / Production QA

- 最后统一视觉细节、动效节奏、键盘操作、焦点、对比度、屏幕阅读器、性能和生产构建验证。
- 验收：完成真实浏览器回归、关键 E2E、RLS 安全测试、错误恢复和部署前检查。

## 推荐的依赖执行顺序

当前不要进入新功能开发。下一次恢复应从 P0.1 Timeline read model 开始，之后按以下顺序推进：

1. Timeline 读取页与时间线查询。
2. Projects 最小 CRUD 和详情基础。
3. Experiments 最小 CRUD，并连接 Project。
4. Reflections 独立列表/详情/版本入口，并连接 Knowledge。
5. Topics / Tags 管理、关联、筛选。
6. 补齐 Notes、Knowledge、Tasks 的跨模块关系管理。
7. 用真实用户完成 P0 / P1 全链路和 RLS 人工验收。
8. 配置并验收 P1.5 Review 后，再开始 P3 AI Assistant。
9. 按 P4 → P5 → P6 → P7 → P8 → P9 → P10 顺序推进。

本轮完成 V1 审计，并新增 Import / Export 与只读 AI Assistant MVP；没有新增 migration、依赖或数据库结构修改。

## P2.1 Knowledge Constellation — Completed

### 已完成

- 新增 `/explore` 独立探索路由，并加入工作区 Sidebar。
- 使用 `knowledge` 作为唯一节点来源，使用 `knowledge_relations` 作为唯一边来源；未引入 mock、随机或 AI 生成关系。
- 新增服务端批量聚合查询，统一读取版本、Evidence、Reflection、Project、Experiment、Gap、Topic 和 Relation 指标，图谱上限为 500 个 Knowledge，避免按节点 N+1 查询。
- 新增基于认知与实践丰富度的节点尺寸计算；尺寸表达上下文丰富度，不表达掌握程度。
- 新增 React Flow 图谱交互：平移、缩放、重置视图、节点选择、搜索高亮/非匹配淡化、Topic 过滤、Gap 状态过滤、键盘选择和列表降级视图。
- 新增按 Knowledge ID 加载的 Inspector API 和右侧/底部响应式 Inspector，展示当前理解、认知统计、最近变化、开放 Gap、Evidence、Reflection、Project、Experiment、关联 Knowledge 和完整详情入口。
- 增加 reduced-motion 处理、空状态、加载/错误状态和 0/3/20/100 节点规模下的静态结构测试。

### 当前状态

本地代码、自动化检查和开发态路由检查已完成。开发 bypass 且没有真实 Supabase Session 时，探索页会显示既有的开发模式空状态；需要在真实登录 Workspace 中验证非空星图、筛选和 Inspector 数据。

### 尚未完成

- P1.5 / P2.1.1 AI Understanding Review 已在下一节完成；AI 不会自动修改 Knowledge。
- 不属于 P2.1 范围的 P2.2 Cognitive River、P2.3 Learning Pulse、P3 Obsidian、P4 RAG 和 P5 Agent 均未开始。
- 未增加 Force Simulation、复杂聚类、AI 关系推断或新的数据库主表。

## P1.5 / P2.1.1：AI Understanding Review

### 已完成

- Knowledge Detail 新增 Understanding Version 选择器和“让 AI 检查我的理解”入口。
- 新增服务端 OpenAI-compatible Provider Adapter；只读取当前 Workspace 的 Knowledge Version 与该版本关联的 Evidence，API Key、Base URL 和 Model 均只在服务端使用。
- Review 输出经过服务端结构化校验，包含 `verdict`、`confidence`、`correct_points`、`issues`、`missing_points` 和 `suggested_revision`。
- Review 结果先作为用户可见 Proposal；用户可以编辑建议内容，再明确选择创建新版本或记录 Knowledge Gap。
- 新增 additive migration `20260901020000_ai_understanding_review.sql`，提供版本安全的确认 RPC；事务内锁定 Knowledge 并复核 `knowledge_version_id` 与 `current_version_no`。
- 用户确认创建新版本后复用 `knowledge_versions`，并记录现有 `timeline_events` 和 `audit_logs`；创建 Gap 复用现有 Cognitive Action。
- 未创建 AI Review 主表，未接入 RAG、Embedding、Agent 或自动修改。

### 当前状态

本地 lint、typecheck、test 和 build 已完成。若未配置 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL_KEY`，页面会显示清晰的未配置状态，不会伪造 Review 结果。

### 尚未完成

- 需要在 `.env.local` 配置真实的 OpenAI-compatible 服务后，使用真实 Workspace 人工验证 Review 输出、确认创建 V(n+1)、并发版本冲突和创建 Knowledge Gap。
- P2.2 Cognitive River、P2.3 Learning Pulse、P3 Obsidian、P4 RAG 和 P5 Agent 均未开始。

## 历史阶段记录

## Phase 1：Cognitive Layer MVP

### 原计划

1. 审计并复用 knowledge_versions、reflection_versions、knowledge_tasks 和 timeline_events。
2. 仅新增 learning_evidence 与 knowledge_gaps 两张确实缺失的表。
3. 增加 Knowledge Detail 路由，展示 Current Understanding、Understanding History、Related Notes、Related Projects、Experiments、Evidence、Reflections、Knowledge Gaps、Next Actions 和 Timeline。
4. 通过服务端 Workspace context 和 RLS 保证所有数据属于当前 Workspace。
5. 提供手动创建 Evidence、Reflection v1、Knowledge Gap 和关联现有 Task 的入口。
6. 不接入 AI、RAG、Embedding、自动回填或自动推断。

### 已完成

- 新增 migration 20260901000000_cognitive_layer_mvp.sql，创建 learning_evidence、knowledge_gaps、RLS、索引和 Reflection v1 事务 RPC。
- 新增 cognitive queries/actions，服务端验证当前 Workspace、关联记录和 UUID 输入。
- 新增 Knowledge Detail 动态路由和客户端工作区。
- Knowledge Detail 已展示现有 Knowledge 版本、关联 Notes、Projects、Experiments、Reflections、Evidence、Knowledge Gaps、Tasks 和 Timeline。
- Knowledge Detail 已提供手动新增 Evidence、Reflection v1、Knowledge Gap，以及关联现有 Task 的表单。
- Knowledge 列表已增加进入认知详情的链接，Knowledge 更新会刷新对应详情页。
- 更新数据库文档、路线图和静态 smoke tests。

### 当前进行到哪一步

本地代码和自动化检查已完成。下一步只需要在 Supabase 按顺序执行原始 Phase A migration、Phase A integrity migration、Phase A transaction migration、Cognitive Layer MVP migration，然后使用真实登录态完成人工验收。

### 尚未完成

- 尚未在当前 Supabase 项目执行 Cognitive Layer MVP migration，云端新表和 RPC 需要手动应用。
- 需要使用真实 Workspace 人工验证创建 Knowledge、Knowledge v2、Evidence、Reflection、Knowledge Gap、关联 Task 和 Timeline 事件。
- Reflection 的后续版本编辑 UI、Knowledge Gap 状态更新/解决操作、Evidence 编辑/删除和跨模块实体详情页不属于本 MVP。
- AI、RAG、Embedding、Agent、自动推断和批量回填未实现。

### 当前发现但尚未解决的错误

没有 lint、typecheck、test 或 build 错误。外部未完成项是 Supabase migration 应用和带真实登录态的人工验收。

### 已修改的重要文件

- supabase/migrations/20260901000000_cognitive_layer_mvp.sql
- src/server/cognitive/queries.ts
- src/server/cognitive/actions.ts
- src/features/knowledge/knowledge-detail.tsx
- src/app/(workspace)/knowledge/[id]/page.tsx
- src/features/knowledge/knowledge-workspace.tsx
- src/server/knowledge/actions.ts
- src/types/records.ts
- src/types/database.ts
- tests/navigation.test.mjs
- docs/DATABASE.md
- docs/ROADMAP.md

### 下次恢复开发应该从哪里继续

先执行四条 migration 并使用真实用户按验收步骤测试 Cognitive Layer MVP；发现问题只修复本阶段数据读写、RLS、Timeline 或 Knowledge Detail，不要进入后续 AI/RAG 阶段。

### 下一条推荐给 Codex 的恢复指令

Personal Learning OS Phase 1 Cognitive Layer MVP 代码已完成，请先读取 AGENTS.md 和 docs/PROGRESS.md。不要重做、不要回滚、不要进入下一 Phase。先确认四条 Supabase migration 已执行，再用真实用户验收 Knowledge Detail 的 Knowledge v2、Evidence、Reflection v1、Knowledge Gap、Task 关联和 Timeline 事件；只修复本阶段发现的问题。

### Phase 1 验证结果

- npm run lint：通过。
- npm run typecheck：通过。
- npm test：通过，6/6。
- npm run build：通过，Next.js 16.3.3 production build 成功，并识别动态路由 knowledge/[id]。

### Phase 1 人工验收

1. 在 Supabase 依次执行初始 schema、Phase A integrity、Phase A transaction、Cognitive Layer MVP 四条 migration。
2. 使用真实登录用户创建一条 Knowledge，刷新后打开详情页。
3. 在 Knowledge 列表编辑该条记录，确认 Understanding History 出现 v2，Timeline 出现更新事件。
4. 在详情页手动创建 Evidence、Reflection v1、Knowledge Gap，确认刷新后仍存在，并看到对应 Timeline 事件。
5. 在 Tasks 创建一条任务，在详情页关联为 Next Action，确认任务和关联事件出现。
6. 使用另一用户确认无法读取第一用户的 Knowledge Detail、Evidence、Gap 或 Task 关联。

## Phase 2：Cognitive Evolution

### 已完成

- 新增 migration 20260901010000_phase2_cognitive_evolution.sql，为 learning_evidence 增加 nullable 的 knowledge_version_id。
- 新增带人工变化原因的 Knowledge 更新 RPC，保留旧 RPC 和旧数据兼容。
- Knowledge 编辑表单支持记录变化原因。
- Knowledge Detail 版本卡片展示 Understanding V1、V2、V3，以及内容、时间、Reason、Source Evidence、Reflection、Project / Experiment。
- 新增 Compare Versions，支持选择 From/To 并展示 Added、Removed、Changed 和 Reason。
- Timeline 更新事件标题改为“你更新了对「知识标题」的理解”。
- 新增 Phase 2 静态验收测试和数据库文档说明。

### 当前进行到哪一步

Phase 2 代码和自动化验证已完成。下一步只需要在 Supabase 执行 Phase 2 migration，再用真实用户创建 Knowledge v2 和版本 Evidence，确认版本历史、比较器、来源和 Timeline。

### Phase 2 验证结果

- npm run lint：通过。
- npm run typecheck：通过。
- npm test：通过，7/7。
- npm run build：通过，Next.js 16.3.3 production build 成功，并识别动态路由 knowledge/[id]。

### Phase 2 人工验收

1. 在已有 Phase A 和 Phase 1 migration 之后执行 20260901010000_phase2_cognitive_evolution.sql。
2. 创建或打开一条 Knowledge，编辑正文并填写“这次理解发生了什么变化”。
3. 保存后确认 Knowledge Detail 出现新的 Understanding V2，并显示内容、时间和 Reason。
4. 新增 Evidence，选择对应 Understanding Version，并关联 Reflection Version、Project 或 Experiment。
5. 在 Compare Versions 中选择 V1 → V2，确认 Added、Removed、Changed 和 Reason。
6. 查看 Timeline，确认出现“你更新了对「知识标题」的理解”。
7. 刷新页面并重新登录，确认版本和 Evidence 仍存在。

### 尚未完成

- 尚未在远程 Supabase 执行 Phase 2 migration。
- 旧 Evidence 的 knowledge_version_id 保持为空，未自动推断或批量回填。
- 当前 Compare Versions 使用轻量的按行位置比较，不提供复杂的词级 diff。
- Reflection v2 编辑、Knowledge Gap 状态操作、AI/RAG 和自动认知推断仍未实现。

### 当前发现但尚未解决的错误

没有 lint、typecheck、test 或 build 错误。外部未完成项是远程 migration 应用和真实用户人工验收。

### 下次恢复开发应该从哪里继续

先在已有三条 migration 之后执行 20260901000000_cognitive_layer_mvp.sql，再执行 20260901010000_phase2_cognitive_evolution.sql。随后使用真实用户编辑 Knowledge、绑定版本 Evidence，并验收 Compare Versions 与 Timeline。

### 下一条推荐给 Codex 的恢复指令

Personal Learning OS Phase 2 Cognitive Evolution 代码已完成，请先读取 AGENTS.md 和 docs/PROGRESS.md。不要重做、不要回滚、不要进入下一 Phase。先确认 Phase 2 migration 已执行，再用真实用户验收 Knowledge v2、变化原因、版本 Evidence、Reflection、Project/Experiment 来源、Compare Versions 和 Timeline；只修复本阶段发现的问题。

## Phase A 原计划

1. 保留现有 Next.js App Router、Workspace UI、路由和设计体系。
2. 检查并复用现有 Supabase SSR/browser client、Proxy、Auth 和 Workspace bootstrap。
3. 建立真实持久化链路：Auth → Workspace → Note → Knowledge → Task。
4. 所有基础数据从当前会话推导 Workspace，不能从客户端传入任意 workspace_id。
5. Note、Knowledge、Task 提供真实读取、创建、编辑和软归档，并显示 loading、empty、error 状态。
6. Note/Knowledge 首次创建和后续更新保留 append-only version；重要写入记录 Timeline event。
7. Email password Auth、6 位邮箱 OTP、重新发送倒计时、找回密码和退出登录保持可用。
8. 执行 lint、typecheck、build、tests，并提供人工验收步骤。

## 中断前状态

中断前已经写入了服务端 Workspace context、Note/Knowledge/Task queries/actions、ActionResult 与输入校验辅助文件，但页面接入、OTP 倒计时、事务边界和最终验证尚未完成。Git 仓库当前没有历史提交，文件显示为工作区未跟踪状态；没有执行回滚或删除。

## 本次继续完成

- 保留并审查中断前的服务端辅助文件，没有重复创建领域模型。
- 修复 Workspace context 的 TypeScript narrowing，并增强 bootstrap：已有 Workspace 也会补齐 owner membership。
- 将 Quick Capture 从本地预览改为真实 Note 写入。
- Notes、Knowledge、Tasks 页面接入 Supabase server-side 查询和 Server Actions。
- Note、Knowledge 支持创建、编辑、软归档；Task 支持创建、编辑、状态更新、软归档。
- Note/Knowledge 创建与更新改为调用数据库事务函数，主体、版本和 Timeline event 在同一事务中写入。
- 新增 Phase A RLS hardening migration：核心记录 insert 必须使用当前 auth.uid() 作为 created_by；用户 Timeline event 的 actor_id 必须匹配当前用户。
- Auth 保留原视觉和 Supabase Auth 逻辑，补充邮箱格式校验、6 位 OTP 校验、发送中/验证中文案、60 秒重新发送倒计时、重新发送和错误提示。
- 新增基础 route loading/error boundary；列表为空时显示业务化 Empty State。
- 补充数据库类型边界、Dashboard 真实计数/最近记录读取，以及当前阶段的 setup 文档说明。

## 当前进行到哪一步

代码实现和本地自动化验证已完成。下一步不是继续写功能，而是：

1. 在本地 `.env.local` 填入 Supabase URL 和 anon public key。
2. 在 Supabase 中按顺序执行三条 migration：
   - `20260830000000_phase1_initial_schema.sql`
   - `20260831000000_phase_a_integrity.sql`
   - `20260831010000_phase_a_write_transactions.sql`
3. 按 `docs/SUPABASE-SETUP.md` 配置 Email provider、6 位 Token 模板和 Redirect URL。
4. 完成人工注册、OTP、登录、退出、重新登录、CRUD 和跨用户 RLS 测试。

## 尚未完成

- 本地 `.env.local` 的两个公开 Supabase 变量现已填写；匿名 REST 探测确认核心表可访问，但未创建测试账号，因此真实 Auth、带登录态 RLS 和 RPC 事务仍需人工验收。
- 新增两条 Phase A migration 的 RPC 不能用匿名请求确认（函数仅授予 authenticated）；需要通过 Supabase migration history 或登录态实际创建记录确认。
- 免费 Supabase 默认邮件服务下，Magic Link/Confirm signup 模板仍需在 Dashboard 手动改为显示 `{{ .Token }}`；否则邮件不会展示页面需要的 6 位数字。
- 真实 SMTP、生产域名、正式 Redirect URL 尚未配置。
- Phase B 的 Reflection、Knowledge version UI、Cognitive Timeline 未实现；Phase C Evidence/Gap/Next Action 也未实现。
- AI、RAG、Embedding、Agent、Tool Calling、知识图谱、自动推断均未实现。

## 当前发现但尚未解决的错误

没有 lint、TypeScript、build 或现有 smoke test 错误。未解决的是外部验收事项：尚未使用真实邮箱完成 OTP，也未使用两个登录用户完成 RLS 隔离和 Note/Knowledge/Task 持久化验收。

## 已修改或新增的重要文件

### Auth / Workspace

- `src/features/auth/auth-form.tsx`
- `src/lib/supabase/bootstrap.ts`
- `src/server/workspace/context.ts`

### Persistence / domain actions

- `src/types/records.ts`
- `src/types/database.ts`
- `src/server/action-errors.ts`
- `src/server/timeline/record.ts`
- `src/server/dashboard/queries.ts`
- `src/server/notes/queries.ts`
- `src/server/notes/actions.ts`
- `src/server/knowledge/queries.ts`
- `src/server/knowledge/actions.ts`
- `src/server/tasks/queries.ts`
- `src/server/tasks/actions.ts`

### UI / routes

- `src/features/dashboard/quick-capture.tsx`
- `src/features/dashboard/dashboard-page.tsx`
- `src/features/notes/notes-workspace.tsx`
- `src/features/knowledge/knowledge-workspace.tsx`
- `src/features/tasks/tasks-workspace.tsx`
- `src/components/supabase/workspace-state.tsx`
- `src/components/layout/route-loading.tsx`
- `src/components/layout/route-error.tsx`
- `src/app/(workspace)/notes/page.tsx`
- `src/app/(workspace)/knowledge/page.tsx`
- `src/app/(workspace)/tasks/page.tsx`
- `src/app/(workspace)/inbox/page.tsx`
- `src/app/(workspace)/inbox/new/page.tsx`

### Database

- `supabase/migrations/20260831000000_phase_a_integrity.sql`
- `supabase/migrations/20260831010000_phase_a_write_transactions.sql`

## 验证结果

- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过，Next.js 16.3.3 production build 成功。
- `npm test`：通过，4/4。

## 下次恢复指令

> Personal Learning OS Phase A 代码已完成，请先读取 `AGENTS.md` 和 `docs/PROGRESS.md`。不要重做、不要回滚、不要进入 Phase B。先配置并检查 Supabase 三条 migration、Email OTP 模板和 Redirect URL，然后按 Phase A 人工验收步骤验证真实 Auth、Workspace、RLS、Note、Knowledge、Task 链路；发现问题只修复 Phase A。
