import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordTimelineEvent(
  supabase: SupabaseClient,
  event: {
    workspaceId: string;
    actorId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    title: string;
    summary?: string;
  },
) {
  const { error } = await supabase.from("timeline_events").insert({
    workspace_id: event.workspaceId,
    event_type: event.eventType,
    entity_type: event.entityType,
    entity_id: event.entityId,
    actor_type: "user",
    actor_id: event.actorId,
    title: event.title,
    summary: event.summary ?? "",
  });
  if (error) console.error("[timeline event]", error);
}
