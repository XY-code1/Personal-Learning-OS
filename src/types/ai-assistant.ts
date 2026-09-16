export type AssistantSourceType = "note" | "knowledge" | "project" | "reflection" | "timeline";

export type AssistantSource = {
  id: string;
  type: AssistantSourceType;
  title: string;
  excerpt: string;
  updatedAt: string;
};

export type AssistantAnswer = {
  answer: string;
  sources: AssistantSource[];
};
