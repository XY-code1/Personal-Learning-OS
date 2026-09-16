"use server";

import { revalidatePath } from "next/cache";

import { actionError, optionalText, parseEnum, parseInteger, requiredText, requiredUuid } from "@/server/action-errors";
import { recordTimelineEvent } from "@/server/timeline/record";
import { requireWorkspaceContext } from "@/server/workspace/context";
import type { ActionResult } from "@/types/records";

const taskKinds = ["todo", "learning", "project", "problem", "bug"] as const;
const taskStatuses = ["todo", "in_progress", "blocked", "done", "cancelled"] as const;

function parseDueAt(formData: FormData) {
  const raw = optionalText(formData, "due_at", 20);
  if (!raw) return null;
  const date = new Date(`${raw}T23:59:59.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DUE_DATE");
  return date.toISOString();
}

function refreshTasks() {
  revalidatePath("/dashboard");
  revalidatePath("/workspace/dashboard");
  revalidatePath("/tasks");
}

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const title = requiredText(formData, "title", 200);
    const description = optionalText(formData, "description", 5000);
    const taskKind = parseEnum(formData, "task_kind", taskKinds, "todo");
    const priority = parseInteger(formData, "priority", 1, 4, 2);
    const dueAt = parseDueAt(formData);
    const { data: task, error } = await context.supabase.from("tasks").insert({ workspace_id: context.workspace.id, created_by: context.user.id, title, description, task_kind: taskKind, priority, due_at: dueAt }).select("id").single();
    if (error) throw error;
    if (!task) throw new Error("TASK_CREATE_FAILED");
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "task_created", entityType: "task", entityId: task.id, title, summary: description });
    refreshTasks();
    return { ok: true, message: "任务已保存。", id: task.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const id = requiredUuid(formData, "id");
    const title = requiredText(formData, "title", 200);
    const description = optionalText(formData, "description", 5000);
    const taskKind = parseEnum(formData, "task_kind", taskKinds, "todo");
    const status = parseEnum(formData, "status", taskStatuses, "todo");
    const priority = parseInteger(formData, "priority", 1, 4, 2);
    const dueAt = parseDueAt(formData);
    const completedAt = status === "done" ? new Date().toISOString() : null;
    const { error } = await context.supabase.from("tasks").update({ title, description, task_kind: taskKind, status, priority, due_at: dueAt, completed_at: completedAt }).eq("id", id).eq("workspace_id", context.workspace.id).is("deleted_at", null);
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: status === "done" ? "task_completed" : "task_updated", entityType: "task", entityId: id, title, summary: description });
    refreshTasks();
    return { ok: true, message: status === "done" ? "任务已完成。" : "任务已更新。", id };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveTaskAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const id = requiredUuid(formData, "id");
    const { error } = await context.supabase.from("tasks").update({ status: "cancelled", deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", context.workspace.id).is("deleted_at", null);
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "task_archived", entityType: "task", entityId: id, title: "归档一项任务" });
    refreshTasks();
    return { ok: true, message: "任务已归档。", id };
  } catch (error) {
    return actionError(error);
  }
}
