import type {
  KnowledgeListItem,
  KnowledgeRelatedExperiment,
  KnowledgeRelatedProject,
  LearningEvidenceItem,
  KnowledgeReflectionItem,
  KnowledgeGapItem,
  KnowledgeVersionListItem,
} from "@/types/records";

export type ConstellationNode = {
  id: string;
  title: string;
  summary: string;
  currentUnderstanding: string;
  versionCount: number;
  evidenceCount: number;
  reflectionCount: number;
  projectCount: number;
  experimentCount: number;
  openGapCount: number;
  relatedKnowledgeCount: number;
  lastChangedAt: string | null;
  topicIds: string[];
  gapStatuses: string[];
};

export type ConstellationEdge = {
  id: string;
  sourceKnowledgeId: string;
  targetKnowledgeId: string;
  relationType: string;
  weight: number;
};

export type ConstellationTopicOption = {
  id: string;
  name: string;
  color: string | null;
};

export type ConstellationSnapshot = {
  status: "ready";
  workspaceName: string;
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  topicOptions: ConstellationTopicOption[];
  totalKnowledgeCount: number;
  truncated: boolean;
};

export type ConstellationResult = ConstellationSnapshot | { status: "unconfigured" | "unauthenticated" };

export type KnowledgeRecentChange = {
  versionNo: number;
  reason: string;
  createdAt: string;
};

export type KnowledgeInspector = {
  knowledge: KnowledgeListItem;
  currentUnderstanding: string;
  recentChange: KnowledgeRecentChange | null;
  versions: KnowledgeVersionListItem[];
  evidence: LearningEvidenceItem[];
  projects: KnowledgeRelatedProject[];
  experiments: KnowledgeRelatedExperiment[];
  reflections: KnowledgeReflectionItem[];
  gaps: KnowledgeGapItem[];
  relatedKnowledge: KnowledgeListItem[];
};

export type KnowledgeInspectorResult = KnowledgeInspector | { status: "unconfigured" | "unauthenticated" | "not_found" };
