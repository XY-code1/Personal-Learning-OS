import type { ConstellationNode } from "@/types/constellation";

/**
 * Richness describes how much cognitive context a Knowledge has, not how well
 * it is mastered. Evidence and Reflection carry extra weight because they
 * connect understanding to practice and change.
 */
export function getKnowledgeRichnessScore(node: Pick<ConstellationNode, "versionCount" | "evidenceCount" | "reflectionCount" | "projectCount" | "experimentCount">) {
  return node.versionCount + node.evidenceCount * 2 + node.reflectionCount * 2 + node.projectCount + node.experimentCount;
}

/** Keep graph nodes legible and prevent a large record from taking over the canvas. */
export function getKnowledgeNodeSize(node: Pick<ConstellationNode, "versionCount" | "evidenceCount" | "reflectionCount" | "projectCount" | "experimentCount">) {
  const score = getKnowledgeRichnessScore(node);
  return Math.min(196, Math.max(116, 116 + score * 8));
}

export function getConstellationPosition(index: number, count: number) {
  const columns = Math.max(3, Math.ceil(Math.sqrt(count * 1.35)));
  return { x: (index % columns) * 230, y: Math.floor(index / columns) * 190 };
}

export function matchesKnowledgeSearch(node: ConstellationNode, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [node.title, node.summary, node.currentUnderstanding].some((value) => value.toLocaleLowerCase().includes(normalized));
}
