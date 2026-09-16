/**
 * Checked-in application-facing database shape for the migrations.
 * Regenerate a complete Supabase type file with `supabase gen types` when
 * deploying to a project; keep this boundary so UI code remains portable.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = { id: string; display_name: string; timezone: string; locale: string; learning_context_markdown: string };
export type WorkspaceRow = { id: string; owner_id: string; name: string; slug: string; settings_jsonb: Json };
export type WorkspaceMemberRow = { workspace_id: string; user_id: string; role: string; joined_at: string };
export type NoteRow = { id: string; workspace_id: string; created_by: string; note_type: string; title: string; content_markdown: string; excerpt: string; status: string; current_version_no: number; captured_at: string; updated_at: string; deleted_at: string | null };
export type NoteVersionRow = { id: string; workspace_id: string; note_id: string; version_no: number; title: string; content_markdown: string; save_source: string; change_summary: string; created_by: string; created_at: string };
export type KnowledgeRow = { id: string; workspace_id: string; created_by: string; title: string; summary: string; body_markdown: string; category: string; mastery_level: number; status: string; current_version_no: number; updated_at: string; deleted_at: string | null };
export type KnowledgeVersionRow = { id: string; workspace_id: string; knowledge_id: string; version_no: number; title: string; summary: string; body_markdown: string; category: string; mastery_level: number; change_reason: string; created_by: string; created_at: string };
export type ReflectionRow = { id: string; workspace_id: string; created_by: string; title: string; reflection_type: string; current_version_no: number; status: string };
export type ReflectionVersionRow = { id: string; workspace_id: string; reflection_id: string; version_no: number; initial_understanding: string; trigger_event: string; discovered_problem: string; error_point: string; error_cause: string; revised_understanding: string; current_limitations: string; next_action: string; evidence_markdown: string; change_summary: string; created_by: string; created_at: string };
export type ProjectRow = { id: string; workspace_id: string; created_by: string; name: string; goal: string; status: string; progress_percent: number };
export type ExperimentRow = { id: string; workspace_id: string; created_by: string; project_id: string | null; title: string; status: string };
export type TaskRow = { id: string; workspace_id: string; created_by: string; project_id: string | null; title: string; task_kind: string; status: string; priority: number; due_at: string | null; deleted_at: string | null };
export type LearningEvidenceRow = { id: string; workspace_id: string; knowledge_id: string; knowledge_version_id: string | null; reflection_id: string | null; reflection_version_id: string | null; project_id: string | null; experiment_id: string | null; note_id: string | null; evidence_type: string; title: string; description: string; source: string; created_by: string; created_at: string };
export type KnowledgeGapRow = { id: string; workspace_id: string; knowledge_id: string; topic_id: string | null; project_id: string | null; title: string; description: string; gap_type: string; severity: string; status: string; confidence: number; created_by: string; created_at: string; resolved_at: string | null };
export type TopicRow = { id: string; workspace_id: string; created_by: string; name: string; slug: string };
export type TagRow = { id: string; workspace_id: string; created_by: string; name: string; slug: string };
export type TimelineEventRow = { id: string; workspace_id: string; event_type: string; entity_type: string; entity_id: string; actor_type: string; actor_id: string | null; title: string; summary: string; occurred_at: string };
export type AuditLogRow = { id: string; workspace_id: string; actor_type: string; actor_id: string | null; action: string; entity_type: string; entity_id: string; created_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      workspaces: Table<WorkspaceRow>;
      workspace_members: Table<WorkspaceMemberRow>;
      notes: Table<NoteRow>;
      note_versions: Table<NoteVersionRow>;
      knowledge: Table<KnowledgeRow>;
      knowledge_versions: Table<KnowledgeVersionRow>;
      reflections: Table<ReflectionRow>;
      reflection_versions: Table<ReflectionVersionRow>;
      projects: Table<ProjectRow>;
      experiments: Table<ExperimentRow>;
      tasks: Table<TaskRow>;
      learning_evidence: Table<LearningEvidenceRow>;
      knowledge_gaps: Table<KnowledgeGapRow>;
      topics: Table<TopicRow>;
      tags: Table<TagRow>;
      timeline_events: Table<TimelineEventRow>;
      audit_logs: Table<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
