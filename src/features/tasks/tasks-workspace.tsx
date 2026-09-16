"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, CheckSquare2, Pencil, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { archiveTaskAction, createTaskAction, updateTaskAction } from "@/server/tasks/actions";
import type { ActionResult, TaskListItem } from "@/types/records";

const statusLabels: Record<string, string> = { todo: "待处理", in_progress: "进行中", blocked: "已阻塞", done: "已完成", cancelled: "已取消" };
const kindLabels: Record<string, string> = { todo: "Todo", learning: "学习", project: "项目", problem: "问题", bug: "Bug" };

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{result.message}</p>;
}

export function TasksWorkspace({ tasks }: { tasks: TaskListItem[] }) {
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
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-primary" />新建 Task</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; runAction(createTaskAction, form, () => form.reset()); }} className="grid gap-3">
            <Input name="title" required maxLength={200} placeholder="下一步要完成什么？" aria-label="任务标题" />
            <Textarea name="description" maxLength={5000} placeholder="补充说明（可选）" aria-label="任务说明" className="min-h-20" />
            <TaskOptions />
            <div className="flex items-center justify-between gap-4"><Feedback result={result} /><Button type="submit" disabled={isPending}>{isPending ? "保存中…" : "保存 Task"}<Save className="size-4" /></Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Next actions</p><h2 className="mt-2 text-xl font-semibold tracking-[-.035em]">开放任务</h2></div><span className="text-xs text-muted-foreground">{tasks.length} 项</span></div>
        {tasks.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={CheckSquare2} title="还没有任务" description="把想推进的学习动作写下来，它会归属于当前 Workspace。" /></CardContent></Card> : <div className="space-y-3">{tasks.map((task) => editingId === task.id ? <EditTaskForm key={task.id} task={task} pending={isPending} onCancel={() => setEditingId(null)} onSubmit={(form) => runAction(updateTaskAction, form, () => setEditingId(null))} /> : <TaskItem key={task.id} task={task} pending={isPending} onEdit={() => setEditingId(task.id)} onArchive={() => { const form = new FormData(); form.set("id", task.id); setResult(null); startTransition(async () => { const nextResult = await archiveTaskAction(form); setResult(nextResult); if (nextResult.ok) router.refresh(); }); }} />)}</div>}
      </div>
    </div>
  );
}

function TaskOptions({ task }: { task?: TaskListItem }) {
  return <div className="grid gap-3 sm:grid-cols-3"><select name="task_kind" defaultValue={task?.task_kind ?? "todo"} aria-label="任务类型" className="h-11 rounded-md border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"><option value="todo">Todo</option><option value="learning">学习任务</option><option value="project">项目任务</option><option value="problem">待解决问题</option><option value="bug">Bug</option></select><select name="priority" defaultValue={String(task?.priority ?? 2)} aria-label="任务优先级" className="h-11 rounded-md border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"><option value="1">优先级 1</option><option value="2">优先级 2</option><option value="3">优先级 3</option><option value="4">优先级 4</option></select><Input name="due_at" type="date" defaultValue={task?.due_at ? task.due_at.slice(0, 10) : ""} aria-label="截止日期" /></div>;
}

function TaskItem({ task, pending, onEdit, onArchive }: { task: TaskListItem; pending: boolean; onEdit: () => void; onArchive: () => void }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className={`text-sm font-semibold ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>{task.title}</p><span className="rounded-full bg-accent px-2 py-0.5 text-[0.68rem] text-primary">{kindLabels[task.task_kind] ?? task.task_kind}</span><span className="text-[0.68rem] text-muted-foreground">{statusLabels[task.status] ?? task.status}</span></div>{task.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description}</p> : null}<div className="mt-3 flex flex-wrap gap-3 text-[0.68rem] text-muted-foreground"><span>优先级 {task.priority}</span>{task.due_at ? <span>截止 {task.due_at.slice(0, 10)}</span> : null}</div></div><div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} disabled={pending} aria-label="编辑任务"><Pencil className="size-3.5" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} disabled={pending} aria-label="归档任务"><Archive className="size-3.5" /></Button></div></div></CardContent></Card>;
}

function EditTaskForm({ task, pending, onCancel, onSubmit }: { task: TaskListItem; pending: boolean; onCancel: () => void; onSubmit: (form: HTMLFormElement) => void }) {
  return <Card><CardContent className="p-5"><form onSubmit={(event) => { event.preventDefault(); onSubmit(event.currentTarget); }} className="grid gap-3"><input type="hidden" name="id" value={task.id} /><Input name="title" required defaultValue={task.title} maxLength={200} aria-label="任务标题" /><Textarea name="description" defaultValue={task.description} maxLength={5000} aria-label="任务说明" className="min-h-20" /><TaskOptions task={task} /><select name="status" defaultValue={task.status} aria-label="任务状态" className="h-11 rounded-md border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"><option value="todo">待处理</option><option value="in_progress">进行中</option><option value="blocked">已阻塞</option><option value="done">已完成</option><option value="cancelled">已取消</option></select><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={pending}><X className="size-4" />取消</Button><Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存更新"}<Save className="size-4" /></Button></div></form></CardContent></Card>;
}
