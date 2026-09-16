import { createAIProvider, AIProviderError } from "@/server/ai/provider";
import { getWorkspaceContext } from "@/server/workspace/context";
import type { AssistantAnswer, AssistantSource, AssistantSourceType } from "@/types/ai-assistant";

type ContextRow = Record<string, unknown>;

export class AssistantInputError extends Error {}

type AssistantResult =
  | { status: "ready"; answer: AssistantAnswer }
  | { status: "empty" | "unconfigured" | "unauthenticated" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(row: ContextRow, key: string) {
  return typeof row[key] === "string" ? row[key] as string : "";
}

function excerpt(value: string, maxLength = 900) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.slice(0, maxLength) + "…" : clean;
}

function matches(row: ContextRow, query: string) {
  const haystack = Object.values(row).filter((value): value is string => typeof value === "string").join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function source(type: AssistantSourceType, row: ContextRow, titleKey: string, bodyKeys: string[]): AssistantSource {
  const body = bodyKeys.map((key) => stringValue(row, key)).find(Boolean) ?? "";
  const updatedAt = stringValue(row, "updated_at") || stringValue(row, "occurred_at") || new Date(0).toISOString();
  return { id: stringValue(row, "id"), type, title: stringValue(row, titleKey) || "未命名记录", excerpt: excerpt(body), updatedAt };
}

function normalizeAnswer(raw: unknown, availableSources: AssistantSource[]): AssistantAnswer {
  if (!isRecord(raw) || typeof raw.answer !== "string" || !raw.answer.trim()) {
    throw new AIProviderError("AI response did not contain an answer");
  }
  const requestedIds = Array.isArray(raw.source_ids) ? raw.source_ids.filter((id): id is string => typeof id === "string") : [];
  const sourceMap = new Map(availableSources.map((item) => [item.id, item]));
  const sources = requestedIds.map((id) => sourceMap.get(id)).filter((item): item is AssistantSource => Boolean(item));
  return { answer: raw.answer.trim().slice(0, 12000), sources };
}

export async function askPersonalKnowledge(question: string): Promise<AssistantResult> {
  const query = question.trim();
  if (!query || query.length > 500) throw new AssistantInputError("问题不能为空，且不能超过 500 个字符。");

  const context = await getWorkspaceContext();
  if (context.status !== "ready") return { status: context.status };

  const { supabase, workspace } = context;
  const [notesResult, knowledgeResult, projectsResult, reflectionsResult, timelineResult] = await Promise.all([
    supabase.from("notes").select("id, title, excerpt, content_markdown, updated_at").eq("workspace_id", workspace.id).neq("status", "deleted").order("updated_at", { ascending: false }).limit(60),
    supabase.from("knowledge").select("id, title, summary, body_markdown, updated_at").eq("workspace_id", workspace.id).neq("status", "deleted").order("updated_at", { ascending: false }).limit(60),
    supabase.from("projects").select("id, name, goal, description, updated_at").eq("workspace_id", workspace.id).neq("status", "deleted").order("updated_at", { ascending: false }).limit(40),
    supabase.from("reflections").select("id, title, current_summary, updated_at").eq("workspace_id", workspace.id).neq("status", "deleted").order("updated_at", { ascending: false }).limit(40),
    supabase.from("timeline_events").select("id, title, summary, event_type, occurred_at").eq("workspace_id", workspace.id).order("occurred_at", { ascending: false }).limit(60),
  ]);
  for (const result of [notesResult, knowledgeResult, projectsResult, reflectionsResult, timelineResult]) {
    if (result.error) throw result.error;
  }

  const candidates: AssistantSource[] = [
    ...((notesResult.data ?? []) as ContextRow[]).filter((row) => matches(row, query)).map((row) => source("note", row, "title", ["excerpt", "content_markdown"])),
    ...((knowledgeResult.data ?? []) as ContextRow[]).filter((row) => matches(row, query)).map((row) => source("knowledge", row, "title", ["summary", "body_markdown"])),
    ...((projectsResult.data ?? []) as ContextRow[]).filter((row) => matches(row, query)).map((row) => source("project", row, "name", ["goal", "description"])),
    ...((reflectionsResult.data ?? []) as ContextRow[]).filter((row) => matches(row, query)).map((row) => source("reflection", row, "title", ["current_summary"])),
    ...((timelineResult.data ?? []) as ContextRow[]).filter((row) => matches(row, query)).map((row) => source("timeline", row, "title", ["summary"])),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 20);
  if (candidates.length === 0) return { status: "empty" };

  const provider = createAIProvider();
  if (!provider) return { status: "unconfigured" };

  const contextText = candidates.map((item, index) => [
    "SOURCE_ID: " + item.id,
    "TYPE: " + item.type,
    "TITLE: " + item.title,
    "CONTENT: " + item.excerpt,
    "INDEX: " + (index + 1),
  ].join("\n")).join("\n\n");
  const raw = await provider.completeJson([
    {
      role: "system",
      content: [
        "你是 Personal Learning OS 的只读知识助手。",
        "只能根据提供的个人 Workspace 来源回答，不要补写不存在的事实。",
        "回答必须是一个 JSON 对象，字段为 answer 和 source_ids。",
        "source_ids 必须只使用上下文中出现的 SOURCE_ID；如果来源不足，明确说明不确定。",
        "不要修改、删除或建议直接写入任何数据库记录。",
      ].join("\n"),
    },
    {
      role: "user",
      content: "请回答这个问题：\n\n" + query + "\n\n个人 Workspace 上下文：\n\n" + contextText,
    },
  ]);
  return { status: "ready", answer: normalizeAnswer(raw, candidates) };
}
