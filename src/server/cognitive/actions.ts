"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { actionError, optionalText, optionalUuid, parseEnum, requiredText, requiredUuid, InputError } from "@/server/action-errors";
import { recordTimelineEvent } from "@/server/timeline/record";
import { requireWorkspaceContext } from "@/server/workspace/context";
import type { ActionResult } from "@/types/records";

const evidenceTypes = ["observation", "note", "experiment", "project", "reflection", "external"] as const;
const gapTypes = ["concept", "application", "evidence", "prerequisite", "confidence"] as const;
const gapSeverities = ["low", "medium", "high"] as const;
const gapStatuses = ["open", "in_progress", "resolved", "dismissed"] as const;
const reflectionTypes = ["cognitive", "error_review", "project_review", "weekly"] as const;

function refreshKnowledgeDetail(knowledgeId: string) {
  revalidatePath(`/knowledge/${knowledgeId}`);
  revalidatePath("/knowledge");
  revalidatePath("/dashboard");
  revalidatePath("/workspace/dashboard");
  revalidatePath("/timeline");
}

async function assertWorkspaceRecord(supabase: SupabaseClient, workspaceId: string, table: string, id: string, label: string) {
  const { data, error } = await supabase.from(table).select("id").eq("id", id).eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw error;
  if (!data) throw new InputError(`${label} is invalid`);
}

async function assertKnowledge(supabase: SupabaseClient, workspaceId: string, knowledgeId: string) {
  const { data, error } = await supabase.from("knowledge").select("id").eq("id", knowledgeId).eq("workspace_id", workspaceId).neq("status", "deleted").maybeSingle();
  if (error) throw error;
  if (!data) throw new InputError("knowledge is invalid");
}

async function assertKnowledgeVersion(supabase: SupabaseClient, workspaceId: string, knowledgeId: string, versionId: string) {
  const { data, error } = await supabase.from("knowledge_versions").select("id, knowledge_id").eq("id", versionId).eq("knowledge_id", knowledgeId).eq("workspace_id", workspaceId).maybeSingle();
  if (error) throw error;
  if (!data) throw new InputError("knowledge version is invalid");
}

function parseConfidence(formData: FormData) {
  const raw = String(formData.get("confidence") ?? "0.5").trim();
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new InputError("confidence is invalid");
  return Math.round(value * 1000) / 1000;
}

export async function createLearningEvidenceAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const knowledgeId = requiredUuid(formData, "knowledge_id");
    await assertKnowledge(context.supabase, context.workspace.id, knowledgeId);
    const knowledgeVersionId = optionalUuid(formData, "knowledge_version_id");
    const reflectionId = optionalUuid(formData, "reflection_id");
    const reflectionVersionId = optionalUuid(formData, "reflection_version_id");
    const projectId = optionalUuid(formData, "project_id");
    const experimentId = optionalUuid(formData, "experiment_id");
    const noteId = optionalUuid(formData, "note_id");
    if (knowledgeVersionId) await assertKnowledgeVersion(context.supabase, context.workspace.id, knowledgeId, knowledgeVersionId);
    if (reflectionId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "reflections", reflectionId, "reflection");
    if (reflectionVersionId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "reflection_versions", reflectionVersionId, "reflection version");
    if (projectId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "projects", projectId, "project");
    if (experimentId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "experiments", experimentId, "experiment");
    if (noteId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "notes", noteId, "note");

    const title = requiredText(formData, "title", 200);
    const description = optionalText(formData, "description", 5000);
    const source = optionalText(formData, "source", 1000);
    const evidenceType = parseEnum(formData, "evidence_type", evidenceTypes, "observation");
    const { data: evidence, error } = await context.supabase.from("learning_evidence").insert({
      workspace_id: context.workspace.id,
      knowledge_id: knowledgeId,
      knowledge_version_id: knowledgeVersionId,
      reflection_id: reflectionId,
      reflection_version_id: reflectionVersionId,
      project_id: projectId,
      experiment_id: experimentId,
      note_id: noteId,
      evidence_type: evidenceType,
      title,
      description,
      source,
      created_by: context.user.id,
    }).select("id").single();
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "evidence_added", entityType: "learning_evidence", entityId: evidence.id, title, summary: description });
    refreshKnowledgeDetail(knowledgeId);
    return { ok: true, message: "学习证据已添加。", id: evidence.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function createReflectionAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const knowledgeId = requiredUuid(formData, "knowledge_id");
    await assertKnowledge(context.supabase, context.workspace.id, knowledgeId);
    const title = requiredText(formData, "title", 200);
    const reflectionType = parseEnum(formData, "reflection_type", reflectionTypes, "cognitive");
    const values = {
      p_workspace_id: context.workspace.id,
      p_knowledge_id: knowledgeId,
      p_title: title,
      p_reflection_type: reflectionType,
      p_initial_understanding: optionalText(formData, "initial_understanding", 20000),
      p_trigger_event: optionalText(formData, "trigger_event", 20000),
      p_discovered_problem: optionalText(formData, "discovered_problem", 20000),
      p_error_point: optionalText(formData, "error_point", 20000),
      p_error_cause: optionalText(formData, "error_cause", 20000),
      p_revised_understanding: optionalText(formData, "revised_understanding", 20000),
      p_current_limitations: optionalText(formData, "current_limitations", 20000),
      p_next_action: optionalText(formData, "next_action", 20000),
    };
    const { data: reflectionId, error } = await context.supabase.rpc("create_reflection_with_version", values);
    if (error) throw error;
    if (!reflectionId) throw new Error("REFLECTION_CREATE_FAILED");
    refreshKnowledgeDetail(knowledgeId);
    return { ok: true, message: "Reflection v1 已保存。", id: String(reflectionId) };
  } catch (error) {
    return actionError(error);
  }
}

export async function createKnowledgeGapAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const knowledgeId = requiredUuid(formData, "knowledge_id");
    await assertKnowledge(context.supabase, context.workspace.id, knowledgeId);
    const topicId = optionalUuid(formData, "topic_id");
    const projectId = optionalUuid(formData, "project_id");
    if (topicId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "topics", topicId, "topic");
    if (projectId) await assertWorkspaceRecord(context.supabase, context.workspace.id, "projects", projectId, "project");
    const title = requiredText(formData, "title", 200);
    const description = optionalText(formData, "description", 5000);
    const gapType = parseEnum(formData, "gap_type", gapTypes, "concept");
    const severity = parseEnum(formData, "severity", gapSeverities, "medium");
    const status = parseEnum(formData, "status", gapStatuses, "open");
    const confidence = parseConfidence(formData);
    const { data: gap, error } = await context.supabase.from("knowledge_gaps").insert({
      workspace_id: context.workspace.id,
      knowledge_id: knowledgeId,
      topic_id: topicId,
      project_id: projectId,
      title,
      description,
      gap_type: gapType,
      severity,
      status,
      confidence,
      created_by: context.user.id,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    }).select("id").single();
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "knowledge_gap_created", entityType: "knowledge_gap", entityId: gap.id, title, summary: description });
    refreshKnowledgeDetail(knowledgeId);
    return { ok: true, message: "Knowledge Gap 已保存。", id: gap.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function linkKnowledgeTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const knowledgeId = requiredUuid(formData, "knowledge_id");
    const taskId = requiredUuid(formData, "task_id");
    await assertKnowledge(context.supabase, context.workspace.id, knowledgeId);
    await assertWorkspaceRecord(context.supabase, context.workspace.id, "tasks", taskId, "task");
    const { data: existing, error: existingError } = await context.supabase.from("knowledge_tasks").select("knowledge_id").eq("workspace_id", context.workspace.id).eq("knowledge_id", knowledgeId).eq("task_id", taskId).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return { ok: true, message: "Task 已经关联。", id: taskId };
    const { error } = await context.supabase.from("knowledge_tasks").insert({ workspace_id: context.workspace.id, knowledge_id: knowledgeId, task_id: taskId, created_by: context.user.id });
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "knowledge_task_linked", entityType: "task", entityId: taskId, title: "关联一个 Next Action" });
    refreshKnowledgeDetail(knowledgeId);
    return { ok: true, message: "Next Action 已关联。", id: taskId };
  } catch (error) {
    return actionError(error);
  }
}
