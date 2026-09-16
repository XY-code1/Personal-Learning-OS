import { getWorkspaceContext } from "@/server/workspace/context";
import type { KnowledgeListItem } from "@/types/records";

export async function listKnowledge(limit = 50) {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status, knowledge: [] as KnowledgeListItem[] };

  const { data, error } = await context.supabase
    .from("knowledge")
    .select("id, title, summary, body_markdown, category, mastery_level, status, current_version_no, updated_at")
    .eq("workspace_id", context.workspace.id)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { status: "ready" as const, knowledge: (data ?? []) as KnowledgeListItem[] };
}
