"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { BookOpen, Brain, CheckSquare2, CircleHelp, FlaskConical, GitBranch, Lightbulb, Link2, MessageSquareQuote, ScrollText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UnderstandingReview } from "@/features/knowledge/understanding-review";
import { createKnowledgeGapAction, createLearningEvidenceAction, createReflectionAction, linkKnowledgeTaskAction } from "@/server/cognitive/actions";
import type { ActionResult, KnowledgeDetailSnapshot, KnowledgeReflectionItem, KnowledgeTaskItem, ReflectionVersionListItem } from "@/types/records";

const selectClass = "h-11 w-full rounded-md border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15";
const sectionClass = "space-y-4";
const eventLabels: Record<string, string> = { knowledge_created: "新增知识", knowledge_updated: "更新知识", knowledge_review_approved: "确认 AI Review 建议", reflection_created: "新增 Reflection", evidence_added: "添加 Evidence", knowledge_gap_created: "发现 Knowledge Gap", knowledge_task_linked: "关联 Next Action" };
const gapLabels: Record<string, string> = { concept: "概念", application: "应用", evidence: "证据", prerequisite: "前置知识", confidence: "信心" };
const severityLabels: Record<string, string> = { low: "低", medium: "中", high: "高" };
const statusLabels: Record<string, string> = { open: "开放", in_progress: "进行中", resolved: "已解决", dismissed: "已忽略" };

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{result.message}</p>;
}

function SectionHeading({ eyebrow, title, icon: Icon, count }: { eyebrow: string; title: string; icon: typeof Brain; count?: number }) {
  return <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-[-.035em]"><Icon className="size-4 text-primary" />{title}</h2></div>{typeof count === "number" ? <span className="text-xs text-muted-foreground">{count} 条</span> : null}</div>;
}

function DetailSection({ eyebrow, title, icon, count, children }: { eyebrow: string; title: string; icon: typeof Brain; count?: number; children: ReactNode }) {
  return <section className={sectionClass}><SectionHeading eyebrow={eyebrow} title={title} icon={icon} count={count} />{children}</section>;
}

function RecordLink({ href, title, meta, description }: { href: string; title: string; meta?: string; description?: string }) {
  return <Link href={href} className="block rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-accent/35"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{title}</p>{meta ? <span className="shrink-0 text-[0.68rem] text-muted-foreground">{meta}</span> : null}</div>{description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}</Link>;
}

function VersionBlock({ version }: { version: ReflectionVersionListItem }) {
  const fields = [["最初观点", version.initial_understanding], ["触发事件", version.trigger_event], ["发现问题", version.discovered_problem], ["错误原因", version.error_cause], ["修正观点", version.revised_understanding], ["当前不足", version.current_limitations], ["下一步行动", version.next_action]];
  return <div className="space-y-3 rounded-lg bg-muted/45 p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-primary">Reflection v{version.version_no}</span><span className="text-[0.68rem] text-muted-foreground">{formatDate(version.created_at)}</span></div>{fields.filter(([, value]) => value).map(([label, value]) => <div key={label}><p className="text-[0.68rem] font-semibold uppercase tracking-[.12em] text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{value}</p></div>)}</div>;
}

type KnowledgeVersion = KnowledgeDetailSnapshot["versions"][number];
type DiffLine = { kind: "same" | "added" | "removed" | "changed"; before?: string; after?: string };

function VersionHistory({ snapshot }: { snapshot: KnowledgeDetailSnapshot }) {
  if (snapshot.versions.length === 0) {
    return <Card><CardContent className="p-3"><EmptyState icon={GitBranch} title="还没有历史版本" description="更新 Knowledge 后，新的理解会以追加版本保留下来。" /></CardContent></Card>;
  }
  return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2">{snapshot.versions.map((version) => <KnowledgeVersionCard key={version.id} version={version} snapshot={snapshot} />)}</div><CompareVersions snapshot={snapshot} /></div>;
}

function KnowledgeVersionCard({ version, snapshot }: { version: KnowledgeVersion; snapshot: KnowledgeDetailSnapshot }) {
  const evidence = snapshot.evidence.filter((item) => item.knowledge_version_id === version.id);
  const reflectionIds = new Set(evidence.map((item) => item.reflection_id ?? snapshot.reflections.find((reflection) => reflection.latest_version?.id === item.reflection_version_id)?.id).filter((id): id is string => Boolean(id)));
  const projectIds = new Set(evidence.map((item) => item.project_id).filter((id): id is string => Boolean(id)));
  const experimentIds = new Set(evidence.map((item) => item.experiment_id).filter((id): id is string => Boolean(id)));
  const reflections = snapshot.reflections.filter((item) => reflectionIds.has(item.id));
  const projects = snapshot.projects.filter((item) => projectIds.has(item.id));
  const experiments = snapshot.experiments.filter((item) => experimentIds.has(item.id));
  return <Card><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-primary">Understanding V{version.version_no}</span><span className="text-[0.68rem] text-muted-foreground">{formatDate(version.created_at)}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7">{version.body_markdown || version.summary || version.title}</p>{version.change_reason ? <p className="mt-4 border-l-2 border-primary/35 pl-3 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Reason</span> · {version.change_reason}</p> : null}<div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-3"><VersionReference label="Source Evidence" values={evidence.map((item) => item.title)} /><VersionReference label="Reflection" values={reflections.map((item) => item.title)} /><VersionReference label="Project / Experiment" values={[...projects.map((item) => item.name), ...experiments.map((item) => item.title)]} /></div></CardContent></Card>;
}

function VersionReference({ label, values }: { label: string; values: string[] }) {
  return <div><p className="text-[0.68rem] font-semibold uppercase tracking-[.12em] text-muted-foreground">{label}</p>{values.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">尚未关联</p> : <ul className="mt-2 space-y-1">{values.map((value) => <li key={value} className="text-xs leading-5">{value}</li>)}</ul>}</div>;
}

function CompareVersions({ snapshot }: { snapshot: KnowledgeDetailSnapshot }) {
  const defaultOlder = snapshot.versions[1]?.id ?? snapshot.versions[0]?.id ?? "";
  const defaultNewer = snapshot.versions[0]?.id ?? "";
  const [olderId, setOlderId] = useState(defaultOlder);
  const [newerId, setNewerId] = useState(defaultNewer);
  if (snapshot.versions.length < 2) return <Card><CardContent className="p-3"><EmptyState icon={GitBranch} title="Compare Versions" description="再保存一次 Knowledge 后，就可以比较两个 Understanding 版本。" /></CardContent></Card>;

  const older = snapshot.versions.find((version) => version.id === olderId) ?? snapshot.versions[1];
  const newer = snapshot.versions.find((version) => version.id === newerId) ?? snapshot.versions[0];
  const diff = buildTextDiff(older.body_markdown || older.summary || older.title, newer.body_markdown || newer.summary || newer.title);
  const counts = diff.reduce((result, line) => {
    if (line.kind === "added") result.added += 1;
    if (line.kind === "removed") result.removed += 1;
    if (line.kind === "changed") result.changed += 1;
    return result;
  }, { added: 0, removed: 0, changed: 0 });

  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="size-4 text-primary" />Compare Versions</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold">From<select value={older.id} onChange={(event) => setOlderId(event.target.value)} className={selectClass} aria-label="选择旧版本">{snapshot.versions.map((version) => <option key={version.id} value={version.id}>Understanding V{version.version_no}</option>)}</select></label><label className="grid gap-1.5 text-xs font-semibold">To<select value={newer.id} onChange={(event) => setNewerId(event.target.value)} className={selectClass} aria-label="选择新版本">{snapshot.versions.map((version) => <option key={version.id} value={version.id}>Understanding V{version.version_no}</option>)}</select></label></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Added {counts.added}</span><span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">Removed {counts.removed}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Changed {counts.changed}</span></div><DiffOutput diff={diff} /><div className="border-t pt-4 text-sm leading-6"><span className="font-semibold">Reason</span><p className="mt-1 text-muted-foreground">{newer.change_reason || "没有记录变化原因。"}</p></div></CardContent></Card>;
}

function buildTextDiff(before: string, after: string): DiffLine[] {
  // ponytail: line-index comparison is intentionally simple for the MVP; use a real diff only when edit volume needs it.
  const beforeLines = before.trim() ? before.trim().split(/\r?\n/) : [];
  const afterLines = after.trim() ? after.trim().split(/\r?\n/) : [];
  const lines: DiffLine[] = [];
  for (let index = 0; index < Math.max(beforeLines.length, afterLines.length); index += 1) {
    const previous = beforeLines[index];
    const current = afterLines[index];
    if (previous === current) lines.push({ kind: "same", before: previous, after: current });
    else if (previous === undefined) lines.push({ kind: "added", after: current });
    else if (current === undefined) lines.push({ kind: "removed", before: previous });
    else lines.push({ kind: "changed", before: previous, after: current });
  }
  return lines;
}

function DiffOutput({ diff }: { diff: DiffLine[] }) {
  return <div className="space-y-2 rounded-lg bg-muted/40 p-4">{diff.length === 0 ? <p className="text-sm text-muted-foreground">两个版本内容为空。</p> : diff.map((line, index) => <div key={index} className="grid gap-1 text-sm leading-6">{line.kind === "same" ? <p className="text-muted-foreground">{line.before}</p> : null}{line.kind === "removed" ? <p className="rounded bg-red-50 px-2 text-red-800"><span className="mr-2 font-semibold">Removed</span>{line.before}</p> : null}{line.kind === "added" ? <p className="rounded bg-emerald-50 px-2 text-emerald-800"><span className="mr-2 font-semibold">Added</span>{line.after}</p> : null}{line.kind === "changed" ? <><p className="rounded bg-red-50 px-2 text-red-800"><span className="mr-2 font-semibold">Removed</span>{line.before}</p><p className="rounded bg-amber-50 px-2 text-amber-900"><span className="mr-2 font-semibold">Changed</span>{line.after}</p></> : null}</div>)}</div>;
}

export function KnowledgeDetailWorkspace({ snapshot }: { snapshot: KnowledgeDetailSnapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  return <div className="space-y-10">
    <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="size-4 text-primary" />Current Understanding</CardTitle></CardHeader><CardContent><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">v{snapshot.knowledge.current_version_no}</span><span className="text-xs text-muted-foreground">最近更新 {formatDate(snapshot.knowledge.updated_at)}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7">{snapshot.knowledge.body_markdown || snapshot.knowledge.summary || "还没有写下当前理解。"}</p><div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>掌握 {snapshot.knowledge.mastery_level}/5</span>{snapshot.knowledge.category ? <span>{snapshot.knowledge.category}</span> : null}</div></CardContent></Card>
      <Card className="bg-[var(--surface-soft)]"><CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="size-4 text-primary" />Cognitive Loop</CardTitle></CardHeader><CardContent><p className="text-sm leading-7 text-muted-foreground">从当前理解出发，用版本、证据、反思和下一步行动，让这条知识持续变得更可靠。</p><div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary"><span>Knowledge</span><span>→</span><span>Evidence</span><span>→</span><span>Reflection</span><span>→</span><span>Action</span></div></CardContent></Card>
    </div>

    <UnderstandingReview snapshot={snapshot} />

    <DetailSection eyebrow="Understanding history" title="理解版本" icon={GitBranch} count={snapshot.versions.length}><VersionHistory snapshot={snapshot} /></DetailSection>

    <div className="grid gap-10 xl:grid-cols-2">
      <DetailSection eyebrow="Related notes" title="关联 Notes" icon={BookOpen} count={snapshot.notes.length}>{snapshot.notes.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={BookOpen} title="还没有关联笔记" description="把原始记录连接到这条 Knowledge，保留理解的来源。" action={<Button variant="outline" render={<Link href="/notes" />}>前往 Notes</Button>} /></CardContent></Card> : <Card><CardContent className="divide-y divide-border/60 p-2">{snapshot.notes.map((note) => <RecordLink key={note.id} href="/notes" title={note.title} meta={formatDate(note.updated_at)} description={note.excerpt} />)}</CardContent></Card>}</DetailSection>
      <DetailSection eyebrow="Related projects" title="关联 Projects" icon={GitBranch} count={snapshot.projects.length}>{snapshot.projects.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={GitBranch} title="还没有关联项目" description="项目和实验会成为验证这条知识的实践上下文。" action={<Button variant="outline" render={<Link href="/projects" />}>前往 Projects</Button>} /></CardContent></Card> : <Card><CardContent className="divide-y divide-border/60 p-2">{snapshot.projects.map((project) => <RecordLink key={project.id} href="/projects" title={project.name} meta={project.progress_percent + "% · " + project.status} />)}</CardContent></Card>}</DetailSection>
      <DetailSection eyebrow="Experiments" title="Experiments" icon={FlaskConical} count={snapshot.experiments.length}>{snapshot.experiments.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={FlaskConical} title="还没有实验记录" description="实验记录将在这里成为可回看的学习证据。" action={<Button variant="outline" render={<Link href="/experiments" />}>前往 Experiments</Button>} /></CardContent></Card> : <Card><CardContent className="divide-y divide-border/60 p-2">{snapshot.experiments.map((experiment) => <RecordLink key={experiment.id} href="/experiments" title={experiment.title} meta={experiment.status} description={experiment.result_markdown} />)}</CardContent></Card>}</DetailSection>
      <DetailSection eyebrow="Reflections" title="Reflections" icon={MessageSquareQuote} count={snapshot.reflections.length}>{snapshot.reflections.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={MessageSquareQuote} title="还没有 Reflection" description="记录一次理解变化，Knowledge 才会留下自己的认知轨迹。" action={<Button variant="outline" render={<Link href="/reflections" />}>前往 Reflections</Button>} /></CardContent></Card> : <div className="space-y-3">{snapshot.reflections.map((reflection) => <ReflectionCard key={reflection.id} reflection={reflection} />)}</div>}</DetailSection>
    </div>

    <div className="grid gap-10 xl:grid-cols-2">
      <DetailSection eyebrow="Learning evidence" title="Evidence" icon={ScrollText} count={snapshot.evidence.length}>{snapshot.evidence.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={ScrollText} title="还没有 Evidence" description="添加一条来自 Note、Project、Experiment 或实践观察的证据。" /></CardContent></Card> : <Card><CardContent className="space-y-3 p-5">{snapshot.evidence.map((evidence) => <div key={evidence.id} className="border-l-2 border-primary/35 pl-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{evidence.title}</p><span className="text-[0.68rem] text-muted-foreground">{evidence.evidence_type} · {formatDate(evidence.created_at)}</span></div>{evidence.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{evidence.description}</p> : null}{evidence.source ? <p className="mt-2 text-xs text-primary">来源：{evidence.source}</p> : null}</div>)}</CardContent></Card>}</DetailSection>
      <DetailSection eyebrow="Knowledge gaps" title="Knowledge Gaps" icon={CircleHelp} count={snapshot.gaps.length}>{snapshot.gaps.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={CircleHelp} title="还没有 Knowledge Gap" description="把当前不足明确记录下来，下一步行动才有方向。" /></CardContent></Card> : <Card><CardContent className="space-y-3 p-5">{snapshot.gaps.map((gap) => <div key={gap.id} className="rounded-lg bg-muted/45 p-4"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{gap.title}</p><span className="rounded-full bg-background px-2 py-0.5 text-[0.68rem] text-primary">{gapLabels[gap.gap_type] ?? gap.gap_type}</span><span className="text-[0.68rem] text-muted-foreground">{severityLabels[gap.severity] ?? gap.severity} · {statusLabels[gap.status] ?? gap.status}</span></div>{gap.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{gap.description}</p> : null}<p className="mt-2 text-xs text-muted-foreground">信心 {Math.round(gap.confidence * 100)}% · {formatDate(gap.created_at)}</p></div>)}</CardContent></Card>}</DetailSection>
    </div>

    <DetailSection eyebrow="Next actions" title="Next Actions" icon={CheckSquare2} count={snapshot.tasks.length}><div className="grid gap-4 lg:grid-cols-[1fr_.9fr]">{snapshot.tasks.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={CheckSquare2} title="还没有关联 Task" description="从一个具体行动开始推进这条知识。" /></CardContent></Card> : <Card><CardContent className="divide-y divide-border/60 p-2">{snapshot.tasks.map((task) => <TaskRow key={task.id} task={task} />)}</CardContent></Card>}<Card><CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="size-4 text-primary" />关联现有 Task</CardTitle></CardHeader><CardContent>{snapshot.availableTasks.length === 0 ? <div className="space-y-3"><p className="text-sm leading-6 text-muted-foreground">当前没有可关联的开放任务。</p><Button variant="outline" render={<Link href="/tasks" />}>先创建 Task</Button></div> : <form onSubmit={(event) => { event.preventDefault(); runAction(linkKnowledgeTaskAction, event.currentTarget); }} className="grid gap-3"><input type="hidden" name="knowledge_id" value={snapshot.knowledge.id} /><label className="grid gap-1.5 text-xs font-semibold">选择 Task<select name="task_id" required defaultValue="" className={selectClass} aria-label="选择要关联的任务"><option value="" disabled>选择一个任务</option>{snapshot.availableTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><div className="flex items-center justify-between gap-3"><Feedback result={result} /><Button type="submit" disabled={isPending}>{isPending ? "关联中…" : "关联为 Next Action"}<Link2 className="size-4" /></Button></div></form>}</CardContent></Card></div></DetailSection>

    <DetailSection eyebrow="Cognitive timeline" title="Timeline" icon={Sparkles} count={snapshot.timeline.length}>{snapshot.timeline.length === 0 ? <Card><CardContent className="p-3"><EmptyState icon={Sparkles} title="还没有时间线事件" description="创建版本、Evidence、Reflection、Gap 或关联 Task 后，事件会自动出现在这里。" /></CardContent></Card> : <Card><CardContent className="space-y-0 p-5">{snapshot.timeline.map((event, index) => <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0"><div className="flex flex-col items-center"><span className="mt-1 size-2.5 rounded-full bg-primary" />{index < snapshot.timeline.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{event.title}</p><span className="text-[0.68rem] text-muted-foreground">{eventLabels[event.event_type] ?? event.event_type}</span></div>{event.summary ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.summary}</p> : null}<p className="mt-1 text-[0.68rem] text-muted-foreground">{formatDate(event.occurred_at)}</p></div></div>)}</CardContent></Card>}</DetailSection>

    <div className="grid gap-10 xl:grid-cols-3">
      <EvidenceForm knowledgeId={snapshot.knowledge.id} versions={snapshot.versions} notes={snapshot.notes} projects={snapshot.projects} experiments={snapshot.experiments} reflections={snapshot.reflections} pending={isPending} result={result} onSubmit={(form) => runAction(createLearningEvidenceAction, form, () => form.reset())} />
      <ReflectionForm knowledgeId={snapshot.knowledge.id} pending={isPending} result={result} onSubmit={(form) => runAction(createReflectionAction, form, () => form.reset())} />
      <GapForm knowledgeId={snapshot.knowledge.id} projects={snapshot.projects} pending={isPending} result={result} onSubmit={(form) => runAction(createKnowledgeGapAction, form, () => form.reset())} />
    </div>
  </div>;
}

function ReflectionCard({ reflection }: { reflection: KnowledgeReflectionItem }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{reflection.title}</p><p className="mt-1 text-xs text-muted-foreground">{reflection.reflection_type} · 当前 v{reflection.current_version_no}</p></div><MessageSquareQuote className="size-4 text-primary" /></div>{reflection.current_summary ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{reflection.current_summary}</p> : null}{reflection.latest_version ? <div className="mt-4"><VersionBlock version={reflection.latest_version} /></div> : null}</CardContent></Card>;
}

function TaskRow({ task }: { task: KnowledgeTaskItem }) {
  return <div className="flex items-start justify-between gap-3 px-3 py-3"><div><p className={"text-sm font-semibold " + (task.status === "done" ? "text-muted-foreground line-through" : "")}>{task.title}</p>{task.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{task.description}</p> : null}</div><span className="shrink-0 text-[0.68rem] text-muted-foreground">{task.status}</span></div>;
}

function FormCard({ title, icon: Icon, children }: { title: string; icon: typeof Brain; children: ReactNode }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-4 text-primary" />{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}

function EvidenceForm({ knowledgeId, versions, notes, projects, experiments, reflections, pending, result, onSubmit }: { knowledgeId: string; versions: KnowledgeDetailSnapshot["versions"]; notes: KnowledgeDetailSnapshot["notes"]; projects: KnowledgeDetailSnapshot["projects"]; experiments: KnowledgeDetailSnapshot["experiments"]; reflections: KnowledgeDetailSnapshot["reflections"]; pending: boolean; result: ActionResult | null; onSubmit: (form: HTMLFormElement) => void }) {
  const reflectionVersions = reflections.flatMap((reflection) => reflection.latest_version ? [[reflection.latest_version.id, reflection.title + " · v" + reflection.latest_version.version_no]] : []);
  return <FormCard title="添加 Evidence" icon={ScrollText}><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(event.currentTarget); }} className="grid gap-3"><input type="hidden" name="knowledge_id" value={knowledgeId} /><RelatedSelect name="knowledge_version_id" label="对应 Understanding Version（可选）" defaultValue={versions[0]?.id ?? ""} options={versions.map((version) => [version.id, "Understanding V" + version.version_no])} /><Input name="title" required maxLength={200} placeholder="证据标题" aria-label="证据标题" /><select name="evidence_type" defaultValue="observation" className={selectClass} aria-label="证据类型"><option value="observation">观察</option><option value="note">Note</option><option value="experiment">Experiment</option><option value="project">Project</option><option value="reflection">Reflection</option><option value="external">外部来源</option></select><Textarea name="description" maxLength={5000} className="min-h-24" placeholder="发生了什么，说明了什么？" aria-label="证据说明" /><Input name="source" maxLength={1000} placeholder="来源或引用（可选）" aria-label="证据来源" /><RelatedSelect name="note_id" label="关联 Note（可选）" options={notes.map((note) => [note.id, note.title])} /><RelatedSelect name="project_id" label="关联 Project（可选）" options={projects.map((project) => [project.id, project.name])} /><RelatedSelect name="experiment_id" label="关联 Experiment（可选）" options={experiments.map((experiment) => [experiment.id, experiment.title])} /><RelatedSelect name="reflection_id" label="关联 Reflection（可选）" options={reflections.map((reflection) => [reflection.id, reflection.title])} /><RelatedSelect name="reflection_version_id" label="对应 Reflection Version（可选）" options={reflectionVersions} /><div className="flex items-center justify-between gap-3"><Feedback result={result} /><Button type="submit" disabled={pending}>{pending ? "添加中…" : "添加 Evidence"}<ScrollText className="size-4" /></Button></div></form></FormCard>;
}

function ReflectionForm({ knowledgeId, pending, result, onSubmit }: { knowledgeId: string; pending: boolean; result: ActionResult | null; onSubmit: (form: HTMLFormElement) => void }) {
  const fields = [["initial_understanding", "最初观点", "我当时如何理解？"], ["trigger_event", "触发事件", "什么实践、阅读或对话触发了变化？"], ["discovered_problem", "发现问题", "后来发现了什么问题？"], ["error_point", "错误点", "我的判断具体错在哪里？"], ["error_cause", "错误原因", "为什么会犯这个错误？"], ["revised_understanding", "修正观点", "现在如何理解？"], ["current_limitations", "当前不足", "现在还不确定什么？"], ["next_action", "下一步行动", "接下来准备验证什么？"]] as const;
  return <FormCard title="添加 Reflection" icon={MessageSquareQuote}><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(event.currentTarget); }} className="grid gap-3"><input type="hidden" name="knowledge_id" value={knowledgeId} /><Input name="title" required maxLength={200} placeholder="这次认知变化的标题" aria-label="Reflection 标题" /><select name="reflection_type" defaultValue="cognitive" className={selectClass} aria-label="Reflection 类型"><option value="cognitive">认知变化</option><option value="error_review">错误复盘</option><option value="project_review">项目复盘</option><option value="weekly">周复盘</option></select>{fields.map(([name, label, placeholder]) => <label key={name} className="grid gap-1.5 text-xs font-semibold">{label}<Textarea name={name} maxLength={20000} className="min-h-20" placeholder={placeholder} aria-label={label} /></label>)}<div className="flex items-center justify-between gap-3"><Feedback result={result} /><Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存 Reflection v1"}<MessageSquareQuote className="size-4" /></Button></div></form></FormCard>;
}

function GapForm({ knowledgeId, projects, pending, result, onSubmit }: { knowledgeId: string; projects: KnowledgeDetailSnapshot["projects"]; pending: boolean; result: ActionResult | null; onSubmit: (form: HTMLFormElement) => void }) {
  return <FormCard title="记录 Knowledge Gap" icon={CircleHelp}><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(event.currentTarget); }} className="grid gap-3"><input type="hidden" name="knowledge_id" value={knowledgeId} /><Input name="title" required maxLength={200} placeholder="还缺少什么理解？" aria-label="Knowledge Gap 标题" /><Textarea name="description" maxLength={5000} className="min-h-24" placeholder="描述当前不足和需要验证的地方" aria-label="Knowledge Gap 描述" /><div className="grid gap-3 sm:grid-cols-2"><select name="gap_type" defaultValue="concept" className={selectClass} aria-label="Gap 类型"><option value="concept">概念</option><option value="application">应用</option><option value="evidence">证据</option><option value="prerequisite">前置知识</option><option value="confidence">信心</option></select><select name="severity" defaultValue="medium" className={selectClass} aria-label="Gap 严重程度"><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></div><select name="status" defaultValue="open" className={selectClass} aria-label="Gap 状态"><option value="open">开放</option><option value="in_progress">进行中</option><option value="resolved">已解决</option><option value="dismissed">已忽略</option></select><label className="grid gap-1.5 text-xs font-semibold">信心（0 到 1）<Input name="confidence" type="number" min="0" max="1" step="0.001" defaultValue="0.5" aria-label="Gap 信心" /></label><RelatedSelect name="project_id" label="关联 Project（可选）" options={projects.map((project) => [project.id, project.name])} /><div className="flex items-center justify-between gap-3"><Feedback result={result} /><Button type="submit" disabled={pending}>{pending ? "保存中…" : "保存 Knowledge Gap"}<CircleHelp className="size-4" /></Button></div></form></FormCard>;
}

function RelatedSelect({ name, label, options, defaultValue = "" }: { name: string; label: string; options: string[][]; defaultValue?: string }) {
  return <label className="grid gap-1.5 text-xs font-semibold">{label}<select name={name} defaultValue={defaultValue} className={selectClass} aria-label={label}><option value="">不关联</option>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>;
}
