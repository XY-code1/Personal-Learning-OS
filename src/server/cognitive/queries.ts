import { getWorkspaceContext } from "@/server/workspace/context";
import type {
  KnowledgeDetailSnapshot,
  KnowledgeGapItem,
  KnowledgeListItem,
  KnowledgeReflectionItem,
  KnowledgeRelatedExperiment,
  KnowledgeRelatedNote,
  KnowledgeRelatedProject,
  KnowledgeTaskItem,
  KnowledgeVersionListItem,
  LearningEvidenceItem,
  ReflectionVersionListItem,
  TimelineEventItem,
} from "@/types/records";

export type KnowledgeDetailResult = KnowledgeDetailSnapshot | { status: "unconfigured" | "unauthenticated" | "not_found" };

export async function getKnowledgeDetail(id: string): Promise<KnowledgeDetailResult> {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status };

  const { supabase, workspace } = context;
  const [knowledgeResult, versionsResult, noteLinksResult, projectLinksResult, experimentLinksResult, reflectionLinksResult, taskLinksResult, evidenceResult, gapResult] = await Promise.all([
    supabase.from("knowledge").select("id, title, summary, body_markdown, category, mastery_level, status, current_version_no, updated_at").eq("id", id).eq("workspace_id", workspace.id).neq("status", "deleted").maybeSingle(),
    supabase.from("knowledge_versions").select("id, knowledge_id, version_no, title, summary, body_markdown, category, mastery_level, change_reason, created_at").eq("knowledge_id", id).eq("workspace_id", workspace.id).order("version_no", { ascending: false }),
    supabase.from("note_knowledge").select("note_id").eq("knowledge_id", id).eq("workspace_id", workspace.id),
    supabase.from("knowledge_projects").select("project_id").eq("knowledge_id", id).eq("workspace_id", workspace.id),
    supabase.from("experiment_knowledge").select("experiment_id").eq("knowledge_id", id).eq("workspace_id", workspace.id),
    supabase.from("reflection_knowledge").select("reflection_id").eq("knowledge_id", id).eq("workspace_id", workspace.id),
    supabase.from("knowledge_tasks").select("task_id").eq("knowledge_id", id).eq("workspace_id", workspace.id),
    supabase.from("learning_evidence").select("id, knowledge_id, knowledge_version_id, reflection_id, reflection_version_id, project_id, experiment_id, note_id, evidence_type, title, description, source, created_at").eq("knowledge_id", id).eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
    supabase.from("knowledge_gaps").select("id, knowledge_id, topic_id, project_id, title, description, gap_type, severity, status, confidence, created_at, resolved_at").eq("knowledge_id", id).eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
  ]);

  for (const result of [knowledgeResult, versionsResult, noteLinksResult, projectLinksResult, experimentLinksResult, reflectionLinksResult, taskLinksResult, evidenceResult, gapResult]) {
    if (result.error) throw result.error;
  }

  if (!knowledgeResult.data) return { status: "not_found" };

  const noteIds = (noteLinksResult.data ?? []).map((row: { note_id: string }) => row.note_id);
  const projectIds = (projectLinksResult.data ?? []).map((row: { project_id: string }) => row.project_id);
  const experimentIds = (experimentLinksResult.data ?? []).map((row: { experiment_id: string }) => row.experiment_id);
  const reflectionIds = (reflectionLinksResult.data ?? []).map((row: { reflection_id: string }) => row.reflection_id);
  const taskIds = (taskLinksResult.data ?? []).map((row: { task_id: string }) => row.task_id);

  const workspaceRows = (table: string, columns: string, ids: string[]) => ids.length
    ? supabase.from(table).select(columns).eq("workspace_id", workspace.id).in("id", ids)
    : Promise.resolve({ data: [], error: null });

  const [notesResult, projectsResult, experimentsResult, reflectionsResult, reflectionVersionsResult, tasksResult, availableTasksResult] = await Promise.all([
    workspaceRows("notes", "id, title, excerpt, updated_at", noteIds),
    workspaceRows("projects", "id, name, status, progress_percent, updated_at", projectIds),
    workspaceRows("experiments", "id, project_id, title, status, result_markdown, updated_at", experimentIds),
    workspaceRows("reflections", "id, title, reflection_type, current_version_no, current_summary, status, updated_at", reflectionIds),
    reflectionIds.length
      ? supabase.from("reflection_versions").select("id, reflection_id, version_no, initial_understanding, trigger_event, discovered_problem, error_point, error_cause, revised_understanding, current_limitations, next_action, created_at").eq("workspace_id", workspace.id).in("reflection_id", reflectionIds).order("version_no", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    taskIds.length
      ? supabase.from("tasks").select("id, title, description, task_kind, status, priority, due_at").eq("workspace_id", workspace.id).in("id", taskIds).is("deleted_at", null)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("tasks").select("id, title, description, task_kind, status, priority, due_at").eq("workspace_id", workspace.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(100),
  ]);

  for (const result of [notesResult, projectsResult, experimentsResult, reflectionsResult, reflectionVersionsResult, tasksResult, availableTasksResult]) {
    if (result.error) throw result.error;
  }

  const reflectionVersions = (reflectionVersionsResult.data ?? []) as ReflectionVersionListItem[];
  const latestReflectionVersions = new Map<string, ReflectionVersionListItem>();
  for (const version of reflectionVersions) {
    if (!latestReflectionVersions.has(version.reflection_id)) latestReflectionVersions.set(version.reflection_id, version);
  }

  const timelineEntityIds = Array.from(new Set([
    id,
    ...noteIds,
    ...projectIds,
    ...experimentIds,
    ...reflectionIds,
    ...((evidenceResult.data ?? []).map((item: { id: string }) => item.id)),
    ...((gapResult.data ?? []).map((item: { id: string }) => item.id)),
    ...taskIds,
  ]));
  const timelineResult = await supabase
    .from("timeline_events")
    .select("id, event_type, entity_type, entity_id, title, summary, occurred_at")
    .eq("workspace_id", workspace.id)
    .in("entity_id", timelineEntityIds)
    .order("occurred_at", { ascending: false })
    .limit(100);
  if (timelineResult.error) throw timelineResult.error;

  const reflections = ((reflectionsResult.data ?? []) as unknown as Omit<KnowledgeReflectionItem, "latest_version">[]).map((reflection) => ({
    ...reflection,
    latest_version: latestReflectionVersions.get(reflection.id) ?? null,
  }));

  return {
    status: "ready",
    knowledge: knowledgeResult.data as KnowledgeListItem,
    versions: (versionsResult.data ?? []) as KnowledgeVersionListItem[],
    notes: (notesResult.data ?? []) as unknown as KnowledgeRelatedNote[],
    projects: (projectsResult.data ?? []) as unknown as KnowledgeRelatedProject[],
    experiments: (experimentsResult.data ?? []) as unknown as KnowledgeRelatedExperiment[],
    evidence: (evidenceResult.data ?? []) as LearningEvidenceItem[],
    reflections,
    gaps: (gapResult.data ?? []).map((gap: KnowledgeGapItem) => ({ ...gap, confidence: Number(gap.confidence) })),
    tasks: (tasksResult.data ?? []) as KnowledgeTaskItem[],
    availableTasks: (availableTasksResult.data ?? []) as KnowledgeTaskItem[],
    timeline: (timelineResult.data ?? []) as TimelineEventItem[],
  };
}
