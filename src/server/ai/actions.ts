"use server";

import { revalidatePath } from "next/cache";

import { actionError, InputError, optionalText, requiredText, requiredUuid } from "@/server/action-errors";
import { requireWorkspaceContext } from "@/server/workspace/context";
import type { ActionResult } from "@/types/records";

function reviewConflict(): ActionResult {
  return { ok: false, message: "这条 Knowledge 已经发生变化，请重新生成一次 Review。" };
}

function parseVersionNumber(formData: FormData) {
  const value = Number(requiredText(formData, "base_version_no", 12));
  if (!Number.isInteger(value) || value < 1) throw new InputError("base_version_no is invalid");
  return value;
}

export async function approveUnderstandingReviewAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const knowledgeId = requiredUuid(formData, "knowledge_id");
    const versionId = requiredUuid(formData, "knowledge_version_id");
    const expectedVersionNo = parseVersionNumber(formData);
    const revisedBody = requiredText(formData, "revised_body_markdown", 200000);
    const changeReason = optionalText(formData, "change_reason", 1000);

    const { data: knowledge, error: knowledgeError } = await context.supabase
      .from("knowledge")
      .select("id, title, summary, category, mastery_level, current_version_no")
      .eq("id", knowledgeId)
      .eq("workspace_id", context.workspace.id)
      .neq("status", "deleted")
      .maybeSingle();
    if (knowledgeError) throw knowledgeError;
    if (!knowledge || knowledge.current_version_no !== expectedVersionNo) return reviewConflict();

    const { data: version, error: versionError } = await context.supabase
      .from("knowledge_versions")
      .select("id, version_no")
      .eq("id", versionId)
      .eq("knowledge_id", knowledgeId)
      .eq("workspace_id", context.workspace.id)
      .maybeSingle();
    if (versionError) throw versionError;
    if (!version || version.version_no !== expectedVersionNo) return reviewConflict();

    const { data: newVersionId, error } = await context.supabase.rpc("apply_approved_knowledge_review", {
      p_workspace_id: context.workspace.id,
      p_knowledge_id: knowledgeId,
      p_expected_version_id: versionId,
      p_expected_version_no: expectedVersionNo,
      p_revised_body_markdown: revisedBody,
      p_change_reason: changeReason,
    });
    if (error) {
      if (error.message.includes("knowledge_review_conflict")) return reviewConflict();
      throw error;
    }
    if (!newVersionId) throw new Error("KNOWLEDGE_REVIEW_APPROVAL_FAILED");

    revalidatePath(`/knowledge/${knowledgeId}`);
    revalidatePath("/knowledge");
    revalidatePath("/explore");
    revalidatePath("/timeline");
    return { ok: true, message: "已根据 Review 建议创建新的 Understanding Version。", id: String(newVersionId) };
  } catch (error) {
    return actionError(error);
  }
}
