"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, FileText, Pencil, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { archiveNoteAction, createNoteAction, updateNoteAction } from "@/server/notes/actions";
import type { ActionResult, NoteListItem } from "@/types/records";

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{result.message}</p>;
}

export function NotesWorkspace({ notes }: { notes: NoteListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  function runAction(action: (formData: FormData) => Promise<ActionResult>, form: HTMLFormElement, afterSuccess?: () => void) {
    setResult(null);
    startTransition(async () => {
      const nextResult = await action(new FormData(form));
      setResult(nextResult);
      if (nextResult.ok) {
        afterSuccess?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-primary" />新建 Note</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; runAction(createNoteAction, form, () => form.reset()); }} className="grid gap-3">
            <Input name="title" placeholder="标题（可选）" aria-label="笔记标题" maxLength={200} />
            <Textarea name="content_markdown" required maxLength={200000} placeholder="写下一个问题、观察或刚刚出现的想法……" aria-label="笔记内容" />
            <input type="hidden" name="note_type" value="markdown" />
            <div className="flex items-center justify-between gap-4"><Feedback result={result} /><Button type="submit" disabled={isPending}>{isPending ? "保存中…" : "保存 Note"}<Save className="size-4" /></Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Your notes</p><h2 className="mt-2 text-xl font-semibold tracking-[-.035em]">最近记录</h2></div><span className="text-xs text-muted-foreground">{notes.length} 条</span></div>
        {notes.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={FileText} title="还没有笔记" description="先记录一段真实思考，它会被保存到当前 Workspace。" /></CardContent></Card> : <div className="space-y-3">{notes.map((note) => editingId === note.id ? <EditNoteForm key={note.id} note={note} pending={isPending} onCancel={() => setEditingId(null)} onSubmit={(form) => runAction(updateNoteAction, form, () => setEditingId(null))} /> : <NoteItem key={note.id} note={note} pending={isPending} onEdit={() => setEditingId(note.id)} onArchive={() => { const form = new FormData(); form.set("id", note.id); setResult(null); startTransition(async () => { const nextResult = await archiveNoteAction(form); setResult(nextResult); if (nextResult.ok) router.refresh(); }); }} />)}</div>}
      </div>
    </div>
  );
}

function NoteItem({ note, pending, onEdit, onArchive }: { note: NoteListItem; pending: boolean; onEdit: () => void; onArchive: () => void }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold">{note.title || "未命名记录"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.excerpt || note.content_markdown}</p><p className="mt-3 text-[0.68rem] text-muted-foreground">v{note.current_version_no} · {new Date(note.updated_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p></div><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} disabled={pending} aria-label="编辑笔记"><Pencil className="size-3.5" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} disabled={pending} aria-label="归档笔记"><Archive className="size-3.5" /></Button></div></div></CardContent></Card>;
}

function EditNoteForm({ note, pending, onCancel, onSubmit }: { note: NoteListItem; pending: boolean; onCancel: () => void; onSubmit: (form: HTMLFormElement) => void }) {
  return <Card><CardContent className="p-5"><form onSubmit={(event) => { event.preventDefault(); onSubmit(event.currentTarget); }} className="grid gap-3"><input type="hidden" name="id" value={note.id} /><Input name="title" defaultValue={note.title} placeholder="标题（可选）" aria-label="笔记标题" maxLength={200} /><Textarea name="content_markdown" defaultValue={note.content_markdown} required maxLength={200000} aria-label="笔记内容" /><input type="hidden" name="note_type" value={note.note_type} /><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={pending}><X className="size-4" />取消</Button><Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存更新"}<Save className="size-4" /></Button></div></form></CardContent></Card>;
}
