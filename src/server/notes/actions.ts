"use server";

import { revalidatePath } from "next/cache";

import { actionError, optionalText, parseEnum, requiredText, requiredUuid } from "@/server/action-errors";
import { recordTimelineEvent } from "@/server/timeline/record";
import { requireWorkspaceContext } from "@/server/workspace/context";
import type { ActionResult } from "@/types/records";

const noteTypes = ["quick", "journal", "markdown", "outline"] as const;

function refreshNotes() {
  revalidatePath("/dashboard");
  revalidatePath("/workspace/dashboard");
  revalidatePath("/inbox");
  revalidatePath("/notes");
}

export async function createNoteAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const title = optionalText(formData, "title", 200);
    const content = requiredText(formData, "content_markdown", 200000);
    const noteType = parseEnum(formData, "note_type", noteTypes, "markdown");
    const { data: noteId, error } = await context.supabase.rpc("create_note_with_version", { p_workspace_id: context.workspace.id, p_note_type: noteType, p_title: title, p_content_markdown: content });
    if (error) throw error;
    if (!noteId) throw new Error("NOTE_CREATE_FAILED");
    refreshNotes();
    return { ok: true, message: "笔记已保存。", id: String(noteId) };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateNoteAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const id = requiredUuid(formData, "id");
    const title = optionalText(formData, "title", 200);
    const content = requiredText(formData, "content_markdown", 200000);
    const noteType = parseEnum(formData, "note_type", noteTypes, "markdown");
    const { data: noteId, error } = await context.supabase.rpc("update_note_with_version", { p_workspace_id: context.workspace.id, p_note_id: id, p_note_type: noteType, p_title: title, p_content_markdown: content });
    if (error) throw error;
    if (!noteId) throw new Error("NOTE_UPDATE_FAILED");
    refreshNotes();
    return { ok: true, message: "笔记已更新。", id };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveNoteAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await requireWorkspaceContext();
    const id = requiredUuid(formData, "id");
    const { error } = await context.supabase.from("notes").update({ status: "deleted", deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", context.workspace.id).neq("status", "deleted");
    if (error) throw error;
    await recordTimelineEvent(context.supabase, { workspaceId: context.workspace.id, actorId: context.user.id, eventType: "note_archived", entityType: "note", entityId: id, title: "归档一条笔记" });
    refreshNotes();
    return { ok: true, message: "笔记已归档。", id };
  } catch (error) {
    return actionError(error);
  }
}