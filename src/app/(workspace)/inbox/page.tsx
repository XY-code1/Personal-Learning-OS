import Link from "next/link";
import { ArrowRight, Inbox as InboxIcon, Plus, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { listNotes } from "@/server/notes/queries";

export default async function InboxPage() {
  const result = await listNotes({ quickOnly: true, limit: 20 });
  return <div className="space-y-7"><PageHeader eyebrow="Capture" title="Inbox" description="先把想法留下来，等它们准备好再被整理成笔记或知识。" action={<Button render={<Link href="/inbox/new" />}><Plus className="size-4" aria-hidden="true" />快速记录</Button>} />{result.status !== "ready" ? <WorkspaceState status={result.status} /> : <><Card><CardHeader><CardTitle>最近快速记录</CardTitle><CardDescription>这些内容已经真实保存到当前 Workspace 的 Notes。</CardDescription></CardHeader><CardContent>{result.notes.length === 0 ? <EmptyState icon={InboxIcon} title="Inbox 还很安静" description="写下一个问题、观察或灵感，它会成为你的第一份学习素材。" action={<Button variant="outline" render={<Link href="/inbox/new" />}>开始记录 <ArrowRight className="size-3.5" aria-hidden="true" /></Button>} /> : <div className="divide-y">{result.notes.map((note) => <div key={note.id} className="py-4 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold">{note.title || "未命名记录"}</p><span className="text-[0.68rem] text-muted-foreground">v{note.current_version_no}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.excerpt || note.content_markdown}</p></div>)}</div>}</CardContent></Card><div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><p>Phase A 已建立真实 Note 持久化；从 Inbox 进入 Notes 可以继续编辑或归档。</p></div></>}</div>;
}