import { getKnowledgeDetail } from "@/server/cognitive/queries";
import { getWorkspaceContext } from "@/server/workspace/context";
import type {
  ConstellationEdge,
  ConstellationNode,
  ConstellationResult,
  ConstellationSnapshot,
  ConstellationTopicOption,
  KnowledgeInspector,
  KnowledgeInspectorResult,
} from "@/types/constellation";
import type { KnowledgeListItem } from "@/types/records";

const MAX_GRAPH_NODES = 500;

type KnowledgeGraphRow = Pick<KnowledgeListItem, "id" | "title" | "summary" | "body_markdown" | "current_version_no" | "updated_at">;
type VersionRow = { knowledge_id: string; created_at: string };
type EvidenceRow = { knowledge_id: string };
type ReflectionLinkRow = { knowledge_id: string; reflection_id: string };
type ProjectLinkRow = { knowledge_id: string; project_id: string };
type ExperimentLinkRow = { knowledge_id: string; experiment_id: string };
type GapRow = { knowledge_id: string; status: string };
type TopicLinkRow = { knowledge_id: string; topic_id: string };
type RelationRow = { knowledge_id: string; related_knowledge_id: string; relation_type: string; weight: number | string };

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function addToSet(map: Map<string, Set<string>>, key: string, value: string) {
  const values = map.get(key) ?? new Set<string>();
  values.add(value);
  map.set(key, values);
}

function maxDate(...dates: Array<string | null | undefined>) {
  const valid = dates.filter((date): date is string => Boolean(date));
  if (valid.length === 0) return null;
  return valid.reduce((latest, date) => (date > latest ? date : latest));
}

function toNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function makeEmptyNode(row: KnowledgeGraphRow): ConstellationNode {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    currentUnderstanding: row.body_markdown || row.summary,
    versionCount: 0,
    evidenceCount: 0,
    reflectionCount: 0,
    projectCount: 0,
    experimentCount: 0,
    openGapCount: 0,
    relatedKnowledgeCount: 0,
    lastChangedAt: row.updated_at,
    topicIds: [],
    gapStatuses: [],
  };
}

export async function getConstellationSnapshot(): Promise<ConstellationResult> {
  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status };

  const { supabase, workspace } = context;
  const { data: knowledgeData, error: knowledgeError, count } = await supabase
    .from("knowledge")
    .select("id, title, summary, body_markdown, current_version_no, updated_at", { count: "exact" })
    .eq("workspace_id", workspace.id)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false })
    .limit(MAX_GRAPH_NODES);

  if (knowledgeError) throw knowledgeError;

  const knowledgeRows = (knowledgeData ?? []) as KnowledgeGraphRow[];
  const totalKnowledgeCount = count ?? knowledgeRows.length;
  const topicOptionsPromise = supabase
    .from("topics")
    .select("id, name, color")
    .eq("workspace_id", workspace.id)
    .order("name", { ascending: true })
    .limit(100);

  if (knowledgeRows.length === 0) {
    const { data: topics, error: topicsError } = await topicOptionsPromise;
    if (topicsError) throw topicsError;
    return {
      status: "ready",
      workspaceName: workspace.name,
      nodes: [],
      edges: [],
      topicOptions: (topics ?? []) as ConstellationTopicOption[],
      totalKnowledgeCount,
      truncated: totalKnowledgeCount > MAX_GRAPH_NODES,
    };
  }

  const knowledgeIds = knowledgeRows.map((row) => row.id);
  const [versionsResult, evidenceResult, reflectionsResult, projectsResult, experimentsResult, gapsResult, topicsResult, relationsResult, topicOptionsResult] = await Promise.all([
    supabase.from("knowledge_versions").select("knowledge_id, created_at").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("learning_evidence").select("knowledge_id").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("reflection_knowledge").select("knowledge_id, reflection_id").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("knowledge_projects").select("knowledge_id, project_id").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("experiment_knowledge").select("knowledge_id, experiment_id").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("knowledge_gaps").select("knowledge_id, status").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("knowledge_topics").select("knowledge_id, topic_id").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    supabase.from("knowledge_relations").select("knowledge_id, related_knowledge_id, relation_type, weight").eq("workspace_id", workspace.id).in("knowledge_id", knowledgeIds),
    topicOptionsPromise,
  ]);

  for (const result of [versionsResult, evidenceResult, reflectionsResult, projectsResult, experimentsResult, gapsResult, topicsResult, relationsResult, topicOptionsResult]) {
    if (result.error) throw result.error;
  }

  const knowledgeIdSet = new Set(knowledgeIds);
  const versionCounts = new Map<string, number>();
  const evidenceCounts = new Map<string, number>();
  const reflectionIds = new Map<string, Set<string>>();
  const projectIds = new Map<string, Set<string>>();
  const experimentIds = new Map<string, Set<string>>();
  const gapStatuses = new Map<string, Set<string>>();
  const topicIds = new Map<string, Set<string>>();
  const lastVersionDates = new Map<string, string>();
  const relatedIds = new Map<string, Set<string>>();

  for (const row of (versionsResult.data ?? []) as VersionRow[]) {
    increment(versionCounts, row.knowledge_id);
    const previous = lastVersionDates.get(row.knowledge_id);
    if (!previous || row.created_at > previous) lastVersionDates.set(row.knowledge_id, row.created_at);
  }
  for (const row of (evidenceResult.data ?? []) as EvidenceRow[]) increment(evidenceCounts, row.knowledge_id);
  for (const row of (reflectionsResult.data ?? []) as ReflectionLinkRow[]) addToSet(reflectionIds, row.knowledge_id, row.reflection_id);
  for (const row of (projectsResult.data ?? []) as ProjectLinkRow[]) addToSet(projectIds, row.knowledge_id, row.project_id);
  for (const row of (experimentsResult.data ?? []) as ExperimentLinkRow[]) addToSet(experimentIds, row.knowledge_id, row.experiment_id);
  for (const row of (gapsResult.data ?? []) as GapRow[]) addToSet(gapStatuses, row.knowledge_id, row.status);
  for (const row of (topicsResult.data ?? []) as TopicLinkRow[]) addToSet(topicIds, row.knowledge_id, row.topic_id);

  const edges: ConstellationEdge[] = [];
  for (const row of (relationsResult.data ?? []) as RelationRow[]) {
    // Both endpoints must be in the current Workspace graph before an edge is exposed.
    if (!knowledgeIdSet.has(row.knowledge_id) || !knowledgeIdSet.has(row.related_knowledge_id)) continue;
    addToSet(relatedIds, row.knowledge_id, row.related_knowledge_id);
    addToSet(relatedIds, row.related_knowledge_id, row.knowledge_id);
    edges.push({
      id: `${row.knowledge_id}:${row.related_knowledge_id}`,
      sourceKnowledgeId: row.knowledge_id,
      targetKnowledgeId: row.related_knowledge_id,
      relationType: row.relation_type,
      weight: Math.min(1, Math.max(0, toNumber(row.weight))),
    });
  }

  const nodes = knowledgeRows.map((row) => {
    const node = makeEmptyNode(row);
    const nodeReflectionIds = reflectionIds.get(row.id)?.size ?? 0;
    const nodeProjectIds = projectIds.get(row.id)?.size ?? 0;
    const nodeExperimentIds = experimentIds.get(row.id)?.size ?? 0;
    const nodeGapStatuses = Array.from(gapStatuses.get(row.id) ?? []);
    return {
      ...node,
      currentUnderstanding: row.body_markdown || row.summary || "尚未记录当前理解",
      versionCount: versionCounts.get(row.id) ?? 0,
      evidenceCount: evidenceCounts.get(row.id) ?? 0,
      reflectionCount: nodeReflectionIds,
      projectCount: nodeProjectIds,
      experimentCount: nodeExperimentIds,
      openGapCount: nodeGapStatuses.filter((status) => status === "open" || status === "in_progress").length,
      relatedKnowledgeCount: relatedIds.get(row.id)?.size ?? 0,
      lastChangedAt: maxDate(row.updated_at, lastVersionDates.get(row.id)),
      topicIds: Array.from(topicIds.get(row.id) ?? []),
      gapStatuses: nodeGapStatuses,
    } satisfies ConstellationNode;
  });

  return {
    status: "ready",
    workspaceName: workspace.name,
    nodes,
    edges,
    topicOptions: (topicOptionsResult.data ?? []) as ConstellationTopicOption[],
    totalKnowledgeCount,
    truncated: totalKnowledgeCount > MAX_GRAPH_NODES,
  } satisfies ConstellationSnapshot;
}

export async function getKnowledgeInspector(id: string): Promise<KnowledgeInspectorResult> {
  const detail = await getKnowledgeDetail(id);
  if (detail.status !== "ready") return detail;

  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status };

  const { supabase, workspace } = context;
  const [outgoingResult, incomingResult] = await Promise.all([
    supabase.from("knowledge_relations").select("related_knowledge_id").eq("workspace_id", workspace.id).eq("knowledge_id", id),
    supabase.from("knowledge_relations").select("knowledge_id").eq("workspace_id", workspace.id).eq("related_knowledge_id", id),
  ]);
  if (outgoingResult.error) throw outgoingResult.error;
  if (incomingResult.error) throw incomingResult.error;

  const relatedIds = Array.from(new Set([
    ...(outgoingResult.data ?? []).map((row: { related_knowledge_id: string }) => row.related_knowledge_id),
    ...(incomingResult.data ?? []).map((row: { knowledge_id: string }) => row.knowledge_id),
  ])).filter((relatedId) => relatedId !== id);

  const relatedResult = relatedIds.length
    ? await supabase.from("knowledge").select("id, title, summary, body_markdown, category, mastery_level, status, current_version_no, updated_at").eq("workspace_id", workspace.id).neq("status", "deleted").in("id", relatedIds)
    : { data: [], error: null };
  if (relatedResult.error) throw relatedResult.error;

  const latestChange = detail.versions.find((version) => version.version_no > 1) ?? null;
  const inspector: KnowledgeInspector = {
    knowledge: detail.knowledge,
    currentUnderstanding: detail.knowledge.body_markdown || detail.knowledge.summary || "尚未记录当前理解",
    recentChange: latestChange
      ? { versionNo: latestChange.version_no, reason: latestChange.change_reason, createdAt: latestChange.created_at }
      : null,
    versions: detail.versions,
    evidence: detail.evidence,
    projects: detail.projects,
    experiments: detail.experiments,
    reflections: detail.reflections,
    gaps: detail.gaps,
    relatedKnowledge: (relatedResult.data ?? []) as KnowledgeListItem[],
  };
  return inspector;
}
