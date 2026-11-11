import { getWorkspaceContext } from "@/server/workspace/context";
import type { TimelineEventItem } from "@/types/records";

export async function listTimelineEvents(limit = 100) {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status, events: [] as TimelineEventItem[] };

  const { data, error } = await context.supabase
    .from("timeline_events")
    .select("id, event_type, entity_type, entity_id, title, summary, occurred_at")
    .eq("workspace_id", context.workspace.id)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { status: "ready" as const, events: (data ?? []) as TimelineEventItem[] };
}
