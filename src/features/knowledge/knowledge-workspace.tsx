"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Brain, Pencil, Plus, Save, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { archiveKnowledgeAction, createKnowledgeAction, updateKnowledgeAction } from "@/server/knowledge/actions";
import type { ActionResult, KnowledgeListItem } from "@/types/records";

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{result.message}</p>;
}

export function KnowledgeWorkspace({ knowledge }: { knowledge: KnowledgeListItem[] }) {
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-primary" />新建 Knowledge</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; runAction(createKnowledgeAction, form, () => form.reset()); }} className="grid gap-3">
            <Input name="title" required maxLength={200} placeholder="知识标题" aria-label="知识标题" />
            <Input name="summary" maxLength={1000} placeholder="一句话摘要" aria-label="知识摘要" />
            <Textarea name="body_markdown" maxLength={200000} placeholder="写下可以反复调用的理解（支持 Markdown）" aria-label="知识正文" />
            <div className="grid gap-3 sm:grid-cols-2"><Input name="category" maxLength={100} placeholder="分类（可选）" aria-label="知识分类" /><select name="mastery_level" defaultValue="0" aria-label="掌握等级" className="h-11 rounded-md border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"><option value="0">掌握等级 0</option><option value="1">掌握等级 1</option><option value="2">掌握等级 2</option><option value="3">掌握等级 3</option><option value="4">掌握等级 4</option><option value="5">掌握等级 5</option></select></div>
            <div className="flex items-center justify-between gap-4"><Feedback result={result} /><Button type="submit" disabled={isPending}>{isPending ? "保存中…" : "保存 Knowledge"}<Save className="size-4" /></Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Reusable understanding</p><h2 className="mt-2 text-xl font-semibold tracking-[-.035em]">知识卡片</h2></div><span className="text-xs text-muted-foreground">{knowledge.length} 条</span></div>
        {knowledge.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={Brain} title="还没有知识卡片" description="先把一段理解写下来，再逐步积累可复用的知识。" /></CardContent></Card> : <div className="space-y-3">{knowledge.map((item) => editingId === item.id ? <EditKnowledgeForm key={item.id} knowledge={item} pending={isPending} onCancel={() => setEditingId(null)} onSubmit={(form) => runAction(updateKnowledgeAction, form, () => setEditingId(null))} /> : <KnowledgeItem key={item.id} knowledge={item} pending={isPending} onEdit={() => setEditingId(item.id)} onArchive={() => { const form = new FormData(); form.set("id", item.id); setResult(null); startTransition(async () => { const nextResult = await archiveKnowledgeAction(form); setResult(nextResult); if (nextResult.ok) router.refresh(); }); }} />)}</div>}
      </div>
    </div>
  );
}

function KnowledgeItem({ knowledge, pending, onEdit, onArchive }: { knowledge: KnowledgeListItem; pending: boolean; onEdit: () => void; onArchive: () => void }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={"/knowledge/" + knowledge.id} className="text-sm font-semibold underline-offset-4 hover:text-primary hover:underline">{knowledge.title}</Link>{knowledge.category ? <span className="rounded-full bg-accent px-2 py-0.5 text-[0.68rem] text-primary">{knowledge.category}</span> : null}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{knowledge.summary || knowledge.body_markdown || "还没有摘要"}</p><div className="mt-3 flex flex-wrap gap-3 text-[0.68rem] text-muted-foreground"><span>掌握 {knowledge.mastery_level}/5</span><span>v{knowledge.current_version_no}</span><span>{new Date(knowledge.updated_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span></div><Link href={"/knowledge/" + knowledge.id} className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline">查看认知详情 →</Link></div><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} disabled={pending} aria-label="编辑知识"><Pencil className="size-3.5" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} disabled={pending} aria-label="归档知识"><Archive className="size-3.5" /></Button></div></div></CardContent></Card>;
}

function EditKnowledgeForm({ knowledge, pending, onCancel, onSubmit }: { knowledge: KnowledgeListItem; pending: boolean; onCancel: () => void; onSubmit: (form: HTMLFormElement) => void }) {
  return <Card><CardContent className="p-5"><form onSubmit={(event) => { event.preventDefault(); onSubmit(event.currentTarget); }} className="grid gap-3"><input type="hidden" name="id" value={knowledge.id} /><Input name="title" required defaultValue={knowledge.title} maxLength={200} aria-label="知识标题" /><Input name="summary" defaultValue={knowledge.summary} maxLength={1000} aria-label="知识摘要" /><Textarea name="body_markdown" defaultValue={knowledge.body_markdown} maxLength={200000} aria-label="知识正文" /><Input name="change_reason" maxLength={1000} placeholder="这次理解发生了什么变化？（可选）" aria-label="理解变化原因" /><div className="grid gap-3 sm:grid-cols-2"><Input name="category" defaultValue={knowledge.category} maxLength={100} aria-label="知识分类" /><select name="mastery_level" defaultValue={String(knowledge.mastery_level)} aria-label="掌握等级" className="h-11 rounded-md border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"><option value="0">掌握等级 0</option><option value="1">掌握等级 1</option><option value="2">掌握等级 2</option><option value="3">掌握等级 3</option><option value="4">掌握等级 4</option><option value="5">掌握等级 5</option></select></div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={pending}><X className="size-4" />取消</Button><Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存更新"}<Save className="size-4" /></Button></div></form></CardContent></Card>;
}
