import { getWorkspaceContext } from "@/server/workspace/context";
import type { NoteListItem } from "@/types/records";

export async function listNotes(options: { limit?: number; quickOnly?: boolean } = {}) {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status, notes: [] as NoteListItem[] };

  let query = context.supabase
    .from("notes")
    .select("id, title, content_markdown, excerpt, note_type, status, current_version_no, updated_at, captured_at")
    .eq("workspace_id", context.workspace.id)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (options.quickOnly) query = query.eq("note_type", "quick");

  const { data, error } = await query;
  if (error) throw error;
  return { status: "ready" as const, notes: (data ?? []) as NoteListItem[] };
}
