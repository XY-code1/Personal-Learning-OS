"use server";

import { revalidatePath } from "next/cache";

import { actionError, optionalText, parseInteger, requiredText, requiredUuid } from "@/server/action-errors";
import { recordTimelineEvent } from "@/server/timeline/record";
import { requireWorkspaceContext } from "@/server/workspace/context";
import type { ActionResult } from "@/types/records";

function refreshKnowledge(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/workspace/dashboard");
  revalidatePath("/knowledge");
  if (id) revalidatePath("/knowledge/" + id);
}

export async function createKnowledgeAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const title = requiredText(formData, "title", 200);
    const summary = optionalText(formData, "summary", 1000);
    const body = optionalText(formData, "body_markdown", 200000);
    const category = optionalText(formData, "category", 100);
    const masteryLevel = parseInteger(formData, "mastery_level", 0, 5, 0);
    const { data: knowledgeId, error } = await context.supabase.rpc("create_knowledge_with_version", { p_workspace_id: context.workspace.id, p_title: title, p_summary: summary, p_body_markdown: body, p_category: category, p_mastery_level: masteryLevel });
    if (error) throw error;
    if (!knowledgeId) throw new Error("KNOWLEDGE_CREATE_FAILED");
    refreshKnowledge();
    return { ok: true, message: "知识卡片已保存。", id: String(knowledgeId) };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateKnowledgeAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const id = requiredUuid(formData, "id");
    const title = requiredText(formData, "title", 200);
    const summary = optionalText(formData, "summary", 1000);
    const body = optionalText(formData, "body_markdown", 200000);
    const category = optionalText(formData, "category", 100);
    const masteryLevel = parseInteger(formData, "mastery_level", 0, 5, 0);
    const changeReason = optionalText(formData, "change_reason", 1000);
    const { data: knowledgeId, error } = await context.supabase.rpc("update_knowledge_with_version_reason", { p_workspace_id: context.workspace.id, p_knowledge_id: id, p_title: title, p_summary: summary, p_body_markdown: body, p_category: category, p_mastery_level: masteryLevel, p_change_reason: changeReason });
    if (error) throw error;
    if (!knowledgeId) throw new Error("KNOWLEDGE_UPDATE_FAILED");
    refreshKnowledge(id);
    return { ok: true, message: "知识卡片已更新。", id };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveKnowledgeAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const id = requiredUuid(formData, "id");
    const { error } = await context.supabase.from("knowledge").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", context.workspace.id).neq("status", "deleted");
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "knowledge_archived", entityType: "knowledge", entityId: id, title: "归档一条知识" });
    refreshKnowledge(id);
    return { ok: true, message: "知识卡片已归档。", id };
  } catch (error) {
    return actionError(error);
  }
}
