import { getWorkspaceContext } from "@/server/workspace/context";
import type { TaskListItem } from "@/types/records";

export async function listTasks(limit = 50) {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status, tasks: [] as TaskListItem[] };

  const { data, error } = await context.supabase
    .from("tasks")
    .select("id, title, description, task_kind, status, priority, due_at, updated_at")
    .eq("workspace_id", context.workspace.id)
    .is("deleted_at", null)
    .order("status", { ascending: true })
    .order("priority", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { status: "ready" as const, tasks: (data ?? []) as TaskListItem[] };
}
