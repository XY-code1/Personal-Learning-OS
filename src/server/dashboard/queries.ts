import { getWorkspaceContext } from "@/server/workspace/context";
import type { KnowledgeListItem, NoteListItem, TaskListItem } from "@/types/records";

export type DashboardSnapshot =
  | { status: "unconfigured" | "unauthenticated" }
  | { status: "ready"; workspaceName: string; counts: { notes: number; knowledge: number; tasks: number; projects: number }; notes: NoteListItem[]; knowledge: KnowledgeListItem[]; tasks: TaskListItem[] };

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status };

  const [notesResult, knowledgeResult, tasksResult, projectsResult] = await Promise.all([
    context.supabase.from("notes").select("id, title, content_markdown, excerpt, note_type, status, current_version_no, updated_at, captured_at", { count: "exact", head: false }).eq("workspace_id", context.workspace.id).neq("status", "deleted").order("updated_at", { ascending: false }).limit(4),
    context.supabase.from("knowledge").select("id, title, summary, body_markdown, category, mastery_level, status, current_version_no, updated_at", { count: "exact", head: false }).eq("workspace_id", context.workspace.id).neq("status", "deleted").order("updated_at", { ascending: false }).limit(4),
    context.supabase.from("tasks").select("id, title, description, task_kind, status, priority, due_at, updated_at", { count: "exact", head: false }).eq("workspace_id", context.workspace.id).is("deleted_at", null).neq("status", "done").order("priority", { ascending: true }).order("updated_at", { ascending: false }).limit(5),
    context.supabase.from("projects").select("id", { count: "exact", head: true }).eq("workspace_id", context.workspace.id).neq("status", "deleted"),
  ]);
  for (const result of [notesResult, knowledgeResult, tasksResult, projectsResult]) if (result.error) throw result.error;

  return {
    status: "ready",
    workspaceName: context.workspace.name,
    counts: { notes: notesResult.count ?? 0, knowledge: knowledgeResult.count ?? 0, tasks: tasksResult.count ?? 0, projects: projectsResult.count ?? 0 },
    notes: (notesResult.data ?? []) as NoteListItem[],
    knowledge: (knowledgeResult.data ?? []) as KnowledgeListItem[],
    tasks: (tasksResult.data ?? []) as TaskListItem[],
  };
}
