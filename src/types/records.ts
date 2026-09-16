export type WorkspaceAvailability = "ready" | "unconfigured" | "unauthenticated";

export type NoteListItem = {
  id: string;
  title: string;
  content_markdown: string;
  excerpt: string;
  note_type: string;
  status: string;
  current_version_no: number;
  updated_at: string;
  captured_at: string;
};

export type KnowledgeListItem = {
  id: string;
  title: string;
  summary: string;
  body_markdown: string;
  category: string;
  mastery_level: number;
  status: string;
  current_version_no: number;
  updated_at: string;
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string;
  task_kind: string;
  status: string;
  priority: number;
  due_at: string | null;
  updated_at: string;
};

export type KnowledgeVersionListItem = {
  id: string;
  knowledge_id: string;
  version_no: number;
  title: string;
  summary: string;
  body_markdown: string;
  category: string;
  mastery_level: number;
  change_reason: string;
  created_at: string;
};

export type KnowledgeRelatedNote = { id: string; title: string; excerpt: string; updated_at: string };
export type KnowledgeRelatedProject = { id: string; name: string; status: string; progress_percent: number; updated_at: string };
export type KnowledgeRelatedExperiment = { id: string; project_id: string | null; title: string; status: string; result_markdown: string; updated_at: string };
export type LearningEvidenceItem = {
  id: string;
  knowledge_id: string;
  knowledge_version_id: string | null;
  reflection_id: string | null;
  reflection_version_id: string | null;
  project_id: string | null;
  experiment_id: string | null;
  note_id: string | null;
  evidence_type: string;
  title: string;
  description: string;
  source: string;
  created_at: string;
};
export type ReflectionVersionListItem = {
  id: string;
  reflection_id: string;
  version_no: number;
  initial_understanding: string;
  trigger_event: string;
  discovered_problem: string;
  error_point: string;
  error_cause: string;
  revised_understanding: string;
  current_limitations: string;
  next_action: string;
  created_at: string;
};
export type KnowledgeReflectionItem = {
  id: string;
  title: string;
  reflection_type: string;
  current_version_no: number;
  current_summary: string;
  status: string;
  updated_at: string;
  latest_version: ReflectionVersionListItem | null;
};
export type KnowledgeGapItem = {
  id: string;
  knowledge_id: string;
  topic_id: string | null;
  project_id: string | null;
  title: string;
  description: string;
  gap_type: string;
  severity: string;
  status: string;
  confidence: number;
  created_at: string;
  resolved_at: string | null;
};
export type KnowledgeTaskItem = { id: string; title: string; description: string; task_kind: string; status: string; priority: number; due_at: string | null };
export type TimelineEventItem = { id: string; event_type: string; entity_type: string; entity_id: string; title: string; summary: string; occurred_at: string };

export type KnowledgeDetailSnapshot = {
  status: "ready";
  knowledge: KnowledgeListItem;
  versions: KnowledgeVersionListItem[];
  notes: KnowledgeRelatedNote[];
  projects: KnowledgeRelatedProject[];
  experiments: KnowledgeRelatedExperiment[];
  evidence: LearningEvidenceItem[];
  reflections: KnowledgeReflectionItem[];
  gaps: KnowledgeGapItem[];
  tasks: KnowledgeTaskItem[];
  availableTasks: KnowledgeTaskItem[];
  timeline: TimelineEventItem[];
};

export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };
