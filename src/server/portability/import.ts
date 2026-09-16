import { revalidatePath } from "next/cache";

import { getWorkspaceContext } from "@/server/workspace/context";
import { portableTables, type PortableSnapshot, type PortableTable, type PortabilityResult } from "@/types/portability";

export class ImportValidationError extends Error {}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxImportedRows = 2000;

const insertColumns: Record<PortableTable, readonly string[]> = {
  notes: ["id", "note_type", "title", "content_markdown", "editor_jsonb", "excerpt", "status", "captured_at", "last_opened_at", "current_version_no", "created_at", "updated_at", "deleted_at"],
  note_versions: ["id", "note_id", "version_no", "title", "content_markdown", "editor_jsonb", "save_source", "change_summary", "created_at"],
  knowledge: ["id", "title", "summary", "body_markdown", "category", "mastery_level", "status", "current_version_no", "last_reviewed_at", "next_review_at", "created_at", "updated_at", "deleted_at"],
  knowledge_versions: ["id", "knowledge_id", "version_no", "title", "summary", "body_markdown", "category", "mastery_level", "change_reason", "created_at"],
  projects: ["id", "name", "slug", "goal", "description", "tech_stack_jsonb", "status", "progress_percent", "start_date", "target_date", "repo_url", "last_activity_at", "created_at", "updated_at", "deleted_at"],
  tasks: ["id", "project_id", "title", "description", "task_kind", "status", "priority", "due_at", "completed_at", "created_at", "updated_at", "deleted_at"],
  experiments: ["id", "project_id", "title", "goal", "environment_markdown", "procedure_markdown", "result_markdown", "problem_markdown", "solution_markdown", "conclusion_markdown", "status", "started_at", "ended_at", "created_at", "updated_at", "deleted_at"],
  reflections: ["id", "title", "reflection_type", "current_version_no", "current_summary", "status", "started_at", "last_reflected_at", "created_at", "updated_at", "deleted_at"],
  reflection_versions: ["id", "reflection_id", "version_no", "initial_understanding", "trigger_event", "discovered_problem", "error_point", "error_cause", "revised_understanding", "current_limitations", "next_action", "evidence_markdown", "change_summary", "created_at"],
  topics: ["id", "name", "slug", "description", "color", "created_at", "updated_at"],
  tags: ["id", "name", "slug", "created_at", "updated_at"],
  timeline_events: ["id", "event_type", "entity_type", "entity_id", "actor_type", "actor_id", "title", "summary", "payload_jsonb", "occurred_at", "created_at"],
  learning_evidence: ["id", "knowledge_id", "reflection_id", "reflection_version_id", "project_id", "experiment_id", "note_id", "knowledge_version_id", "evidence_type", "title", "description", "source", "created_at"],
  knowledge_gaps: ["id", "knowledge_id", "topic_id", "project_id", "title", "description", "gap_type", "severity", "status", "confidence", "created_at", "resolved_at"],
  note_topics: ["note_id", "topic_id", "created_at"],
  knowledge_topics: ["knowledge_id", "topic_id", "created_at"],
  note_tags: ["note_id", "tag_id", "created_at"],
  knowledge_tags: ["knowledge_id", "tag_id", "created_at"],
  note_knowledge: ["note_id", "knowledge_id", "created_at"],
  note_projects: ["note_id", "project_id", "created_at"],
  note_tasks: ["note_id", "task_id", "created_at"],
  knowledge_projects: ["knowledge_id", "project_id", "created_at"],
  knowledge_tasks: ["knowledge_id", "task_id", "created_at"],
  knowledge_relations: ["knowledge_id", "related_knowledge_id", "relation_type", "weight", "created_at"],
  experiment_notes: ["experiment_id", "note_id", "created_at"],
  experiment_knowledge: ["experiment_id", "knowledge_id", "created_at"],
  reflection_topics: ["reflection_id", "topic_id", "created_at"],
  reflection_notes: ["reflection_id", "note_id", "created_at"],
  reflection_knowledge: ["reflection_id", "knowledge_id", "created_at"],
  reflection_projects: ["reflection_id", "project_id", "created_at"],
  reflection_tasks: ["reflection_id", "task_id", "created_at"],
};

const importOrder: readonly PortableTable[] = [
  "topics",
  "tags",
  "notes",
  "knowledge",
  "projects",
  "tasks",
  "experiments",
  "reflections",
  "note_versions",
  "knowledge_versions",
  "reflection_versions",
  "learning_evidence",
  "knowledge_gaps",
  "note_topics",
  "knowledge_topics",
  "note_tags",
  "knowledge_tags",
  "note_knowledge",
  "note_projects",
  "note_tasks",
  "knowledge_projects",
  "knowledge_tasks",
  "knowledge_relations",
  "experiment_notes",
  "experiment_knowledge",
  "reflection_topics",
  "reflection_notes",
  "reflection_knowledge",
  "reflection_projects",
  "reflection_tasks",
  "timeline_events",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSnapshot(value: unknown): PortableSnapshot {
  if (!isRecord(value) || value.format !== "personal-learning-os" || value.schemaVersion !== 1 || !isRecord(value.workspace) || !isRecord(value.data)) {
    throw new ImportValidationError("不支持的 JSON 导出格式。请使用 Personal Learning OS 导出的 JSON 文件。");
  }
  const data: PortableSnapshot["data"] = {};
  for (const table of portableTables) {
    const rows = value.data[table];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) throw new ImportValidationError("JSON 数据结构不完整。");
    data[table] = rows as Array<Record<string, unknown>>;
  }
  return {
    format: "personal-learning-os",
    schemaVersion: 1,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    workspace: {
      id: typeof value.workspace.id === "string" ? value.workspace.id : "",
      name: typeof value.workspace.name === "string" ? value.workspace.name : "Imported Workspace",
      slug: typeof value.workspace.slug === "string" ? value.workspace.slug : "imported-workspace",
    },
    data,
  };
}

function prepareRows(table: PortableTable, rows: Array<Record<string, unknown>>, workspaceId: string, userId: string) {
  return rows.map((row) => {
    if (!isRecord(row)) throw new ImportValidationError("JSON 中包含无效记录。");
    const columns = insertColumns[table];
    const prepared: Record<string, unknown> = { workspace_id: workspaceId, created_by: userId };
    if (columns.includes("id")) {
      if (typeof row.id !== "string" || !uuidPattern.test(row.id)) throw new ImportValidationError("JSON 中包含无效记录 ID。");
    }
    for (const column of columns) {
      if (column in row) prepared[column] = row[column];
    }
    if (table === "timeline_events") {
      prepared.actor_id = prepared.actor_type === "user" ? userId : null;
    }
    return prepared;
  });
}

function refreshImportedData() {
  for (const path of ["/dashboard", "/workspace/dashboard", "/inbox", "/notes", "/knowledge", "/explore", "/projects", "/tasks", "/experiments", "/reflections", "/timeline"]) {
    revalidatePath(path);
  }
}

function fileTitle(fileName: string, content: string) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && heading !== "Personal Learning OS") return heading.slice(0, 200);
  return fileName.replace(/\.(markdown|md|txt)$/i, "").trim().slice(0, 200) || "导入的笔记";
}

async function importMarkdown(context: Extract<Awaited<ReturnType<typeof getWorkspaceContext>>, { status: "ready" }>, fileName: string, content: string): Promise<PortabilityResult> {
  const body = content.trim();
  if (!body) throw new ImportValidationError("文件内容为空。");
  if (body.length > 200000) throw new ImportValidationError("文件过大，单条 Note 不能超过 200000 个字符。");
  const { data: noteId, error } = await context.supabase.rpc("create_note_with_version", {
    p_workspace_id: context.workspace.id,
    p_note_type: "markdown",
    p_title: fileTitle(fileName, body),
    p_content_markdown: body,
  });
  if (error) throw error;
  if (!noteId) throw new Error("NOTE_IMPORT_FAILED");
  refreshImportedData();
  return { imported: [{ table: "notes", count: 1 }], noteTitle: fileTitle(fileName, body) };
}

async function importJson(context: Extract<Awaited<ReturnType<typeof getWorkspaceContext>>, { status: "ready" }>, content: string): Promise<PortabilityResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new ImportValidationError("JSON 文件无法解析。");
  }
  const snapshot = validateSnapshot(parsed);
  const totalRows = portableTables.reduce((total, table) => total + (snapshot.data[table]?.length ?? 0), 0);
  if (totalRows === 0) throw new ImportValidationError("JSON 文件中没有可导入的记录。");
  if (totalRows > maxImportedRows) throw new ImportValidationError("单次最多导入 2000 条记录。");

  const imported: PortabilityResult["imported"] = [];
  for (const table of importOrder) {
    const rows = snapshot.data[table];
    if (!rows?.length) continue;
    const prepared = prepareRows(table, rows, context.workspace.id, context.user.id);
    const { error } = await context.supabase.from(table).insert(prepared);
    if (error) throw error;
    imported.push({ table, count: prepared.length });
  }
  refreshImportedData();
  return { imported };
}

export async function importPortableFile(fileName: string, content: string) {
  const context = await getWorkspaceContext({ ensure: true });
  if (context.status !== "ready") return context;
  if (content.length > 8_000_000) throw new ImportValidationError("文件过大，单次最多处理 8 MB。");
  if (/\.json$/i.test(fileName)) return importJson(context, content);
  if (/\.(md|markdown|txt)$/i.test(fileName)) return importMarkdown(context, fileName, content);
  throw new ImportValidationError("仅支持 Markdown、TXT 和 Personal Learning OS JSON 文件。");
}
