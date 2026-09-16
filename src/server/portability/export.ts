import { getWorkspaceContext } from "@/server/workspace/context";
import { portableTables, type PortableSnapshot, type PortableTable } from "@/types/portability";

type WorkspaceResult =
  | { status: "ready"; snapshot: PortableSnapshot }
  | { status: "unconfigured" | "unauthenticated" };

function textValue(row: Record<string, unknown>, key: string, fallback = "") {
  return typeof row[key] === "string" ? row[key] as string : fallback;
}

function addMarkdownSection(lines: string[], heading: string, rows: Array<Record<string, unknown>>, bodyKey: string) {
  for (const row of rows) {
    const title = textValue(row, "title", textValue(row, "name", "未命名记录"));
    const id = textValue(row, "id");
    const body = textValue(row, bodyKey, textValue(row, "description", ""));
    lines.push("## " + heading + " · " + title, "<!-- id: " + id + " -->", "", body || "（空）", "");
  }
}

export async function getWorkspaceExport(): Promise<WorkspaceResult> {
  const context = await getWorkspaceContext({ ensure: true });
  if (context.status !== "ready") return context;

  const { supabase, workspace } = context;
  const tableResults = await Promise.all(portableTables.map(async (table) => {
    let query = supabase.from(table).select("*").eq("workspace_id", workspace.id);
    if (["notes", "knowledge", "reflections"].includes(table)) query = query.neq("status", "deleted");
    if (["projects", "experiments"].includes(table)) query = query.neq("status", "deleted");
    if (table === "tasks") query = query.is("deleted_at", null);
    const result = await query;
    return { table, result };
  }));

  const data: PortableSnapshot["data"] = {};
  for (const { table, result } of tableResults) {
    if (result.error) throw result.error;
    data[table as PortableTable] = (result.data ?? []) as Array<Record<string, unknown>>;
  }

  return {
    status: "ready",
    snapshot: {
      format: "personal-learning-os",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      data,
    },
  };
}

export function createMarkdownExport(snapshot: PortableSnapshot) {
  const lines = [
    "# Personal Learning OS",
    "",
    "> Workspace: " + snapshot.workspace.name,
    "> Exported: " + snapshot.exportedAt,
    "> Format: Markdown 1.0",
    "",
    "这是一份可读的学习资料导出。完整关系、版本和稳定 ID 请使用同批次 JSON 导出。",
    "",
    "## Notes",
    "",
  ];
  addMarkdownSection(lines, "Note", snapshot.data.notes ?? [], "content_markdown");
  lines.push("## Knowledge", "");
  addMarkdownSection(lines, "Knowledge", snapshot.data.knowledge ?? [], "body_markdown");
  lines.push("## Projects", "");
  addMarkdownSection(lines, "Project", snapshot.data.projects ?? [], "description");
  lines.push("## Experiments", "");
  addMarkdownSection(lines, "Experiment", snapshot.data.experiments ?? [], "conclusion_markdown");
  lines.push("## Reflections", "");
  addMarkdownSection(lines, "Reflection", snapshot.data.reflections ?? [], "current_summary");
  lines.push("## Tasks", "");
  addMarkdownSection(lines, "Task", snapshot.data.tasks ?? [], "description");
  return lines.join("\n");
}
