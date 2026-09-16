export const portableTables = [
  "notes",
  "note_versions",
  "knowledge",
  "knowledge_versions",
  "projects",
  "tasks",
  "experiments",
  "reflections",
  "reflection_versions",
  "topics",
  "tags",
  "timeline_events",
  "learning_evidence",
  "knowledge_gaps",
  "note_topics",
  "knowledge_topics",
  "note_tags",
  "knowledge_tags",
  "note_knowledge",
  "note_projects",
  "note_tasks",
  "knowledge_projects",
  "knowledge_tasks",
  "knowledge_relations",
  "experiment_notes",
  "experiment_knowledge",
  "reflection_topics",
  "reflection_notes",
  "reflection_knowledge",
  "reflection_projects",
  "reflection_tasks",
] as const;

export type PortableTable = (typeof portableTables)[number];

export type PortableSnapshot = {
  format: "personal-learning-os";
  schemaVersion: 1;
  exportedAt: string;
  workspace: { id: string; name: string; slug: string };
  data: Partial<Record<PortableTable, Array<Record<string, unknown>>>>;
};

export type PortabilityResult = {
  imported: Array<{ table: string; count: number }>;
  noteTitle?: string;
};
