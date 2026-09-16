"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, CircleDot, Clock3, FileText, FlaskConical, GitBranch, MessageSquareQuote, Target, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { KnowledgeInspector } from "@/types/constellation";

type InspectorState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: KnowledgeInspector };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Shanghai" });
}

function excerpt(value: string, length = 180) {
  const clean = value.trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

function Count({ label, value }: { label: string; value: number }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-background/60 px-2.5 py-1 text-[0.68rem] text-muted-foreground"><strong className="mr-1 text-foreground">{value}</strong>{label}</span>;
}

export function KnowledgeInspectorPanel({ knowledgeId, onClose }: { knowledgeId: string; onClose: () => void }) {
  const [state, setState] = useState<InspectorState>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/constellation/knowledge/${knowledgeId}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { error?: string } | KnowledgeInspector;
        if (!response.ok) throw new Error("Inspector 暂时无法加载");
        setState({ status: "ready", data: payload as KnowledgeInspector });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Inspector 暂时无法加载" });
      });
    return () => controller.abort();
  }, [knowledgeId, retryKey]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside className="constellation-inspector absolute inset-x-0 bottom-0 z-30 max-h-[78vh] overflow-y-auto border-t border-[var(--line-soft)] bg-[var(--paper)] shadow-[0_-20px_44px_-32px_rgba(39,48,45,.8)] sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(25rem,calc(100%-2rem))] sm:max-h-none sm:rounded-xl sm:border sm:shadow-[0_24px_52px_-34px_rgba(39,48,45,.8)] xl:static xl:max-h-none xl:w-auto xl:rounded-xl xl:border xl:shadow-none" aria-label="Knowledge Inspector" role="dialog">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line-soft)] bg-[var(--paper)]/95 px-5 py-4 backdrop-blur-sm">
        <div><p className="eyebrow">Knowledge Inspector</p><p className="mt-1 text-xs text-muted-foreground">查看这条知识的认知上下文</p></div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="关闭 Knowledge Inspector"><X className="size-4" /></Button>
      </div>
      {state.status === "loading" ? <InspectorLoading /> : null}
      {state.status === "error" ? <div className="p-5"><EmptyState icon={CircleDot} title="Inspector 暂时无法加载" description={state.message} action={<Button type="button" variant="outline" onClick={() => setRetryKey((value) => value + 1)}>重新加载</Button>} className="min-h-48" /></div> : null}
      {state.status === "ready" ? <InspectorContent data={state.data} /> : null}
    </aside>
  );
}

function InspectorLoading() {
  return <div className="animate-pulse space-y-5 p-5" aria-label="正在加载 Knowledge Inspector"><div className="h-7 w-4/5 rounded bg-muted" /><div className="h-24 rounded-lg bg-muted/70" /><div className="grid grid-cols-3 gap-2"><div className="h-9 rounded bg-muted/70" /><div className="h-9 rounded bg-muted/70" /><div className="h-9 rounded bg-muted/70" /></div><div className="h-28 rounded-lg bg-muted/70" /></div>;
}

function InspectorContent({ data }: { data: KnowledgeInspector }) {
  const openGaps = data.gaps.filter((gap) => gap.status === "open" || gap.status === "in_progress");
  return (
    <div className="space-y-6 p-5">
      <section>
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xl font-semibold tracking-[-.04em] text-foreground">{data.knowledge.title}</p><p className="mt-1 text-xs text-muted-foreground">v{data.knowledge.current_version_no} · 最近更新 {formatDate(data.knowledge.updated_at)}</p></div><BookOpen className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" /></div>
      </section>

      <section className="border-l-2 border-primary/35 pl-4">
        <p className="eyebrow">Current Understanding</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/85">{excerpt(data.currentUnderstanding) || "尚未记录当前理解"}</p>
      </section>

      <InspectorList eyebrow="Understanding Versions" icon={GitBranch} empty="还没有保存过理解版本。" items={data.versions.map((version) => ({ id: version.id, title: `Understanding V${version.version_no}`, detail: `${excerpt(version.body_markdown || version.summary || version.title, 140)}${version.change_reason ? ` · ${version.change_reason}` : ""}` }))} />

      <section>
        <p className="eyebrow">Cognitive State</p>
        <div className="mt-3 flex flex-wrap gap-2"><Count label="Versions" value={data.versions.length} /><Count label="Evidence" value={data.evidence.length} /><Count label="Projects" value={data.projects.length} /><Count label="Experiments" value={data.experiments.length} /><Count label="Reflections" value={data.reflections.length} /><Count label="Open Gaps" value={openGaps.length} /></div>
      </section>

      <section className="rounded-lg border border-[var(--line-soft)] bg-background/45 p-4">
        <div className="flex items-center gap-2"><Clock3 className="size-3.5 text-primary" aria-hidden="true" /><p className="eyebrow">Recent Change</p></div>
        {data.recentChange ? <><p className="mt-3 text-sm font-semibold">Understanding V{data.recentChange.versionNo}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{data.recentChange.reason || "这次理解发生了变化"}</p><p className="mt-2 text-[0.68rem] text-muted-foreground">{formatDate(data.recentChange.createdAt)}</p></> : <p className="mt-3 text-sm leading-6 text-muted-foreground">还没有第二个理解版本。继续实践后，可以记录下一次变化。</p>}
      </section>

      <InspectorList eyebrow="Open Gaps" icon={Target} empty="当前没有未解决的 Knowledge Gap。" items={openGaps.map((gap) => ({ id: gap.id, title: gap.title, detail: gap.description || `${gap.gap_type} · ${gap.severity}` }))} gap />
      <InspectorList eyebrow="Evidence" icon={FileText} empty="还没有关联 Evidence。" items={data.evidence.slice(0, 4).map((item) => ({ id: item.id, title: item.title, detail: item.description || item.source }))} />
      <InspectorList eyebrow="Reflections" icon={MessageSquareQuote} empty="还没有关联 Reflection。" items={data.reflections.slice(0, 4).map((item) => ({ id: item.id, title: item.title, detail: item.current_summary }))} />
      <InspectorList eyebrow="Projects" icon={FlaskConical} empty="还没有关联 Project。" items={data.projects.slice(0, 4).map((item) => ({ id: item.id, title: item.name, detail: `${item.status} · ${item.progress_percent}%` }))} />
      <InspectorList eyebrow="Experiments" icon={FlaskConical} empty="还没有关联 Experiment。" items={data.experiments.slice(0, 4).map((item) => ({ id: item.id, title: item.title, detail: item.status }))} />

      <section>
        <div className="flex items-center gap-2"><GitBranch className="size-3.5 text-primary" aria-hidden="true" /><p className="eyebrow">Related Knowledge</p></div>
        {data.relatedKnowledge.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted-foreground">还没有真实的 Knowledge Relation。</p> : <div className="mt-3 space-y-2">{data.relatedKnowledge.map((item) => <Link key={item.id} href={`/knowledge/${item.id}`} className="flex items-center justify-between gap-3 rounded-md border border-[var(--line-soft)] bg-background/35 px-3 py-2.5 text-sm transition-colors hover:border-primary/35 hover:bg-background"><span className="truncate">{item.title}</span><ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>)}</div>}
      </section>

      <Button className="w-full" render={<Link href={`/knowledge/${data.knowledge.id}`} />}><BookOpen className="size-4" />查看完整 Knowledge<ArrowUpRight className="size-3.5" /></Button>
    </div>
  );
}

function InspectorList({ eyebrow, icon: Icon, empty, items, gap = false }: { eyebrow: string; icon: LucideIcon; empty: string; items: Array<{ id: string; title: string; detail: string }>; gap?: boolean }) {
  return <section><div className="flex items-center gap-2"><Icon className={gap ? "size-3.5 text-primary" : "size-3.5 text-primary"} aria-hidden="true" /><p className="eyebrow">{eyebrow}</p></div>{items.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{empty}</p> : <div className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="rounded-md border border-[var(--line-soft)] bg-background/35 px-3 py-2.5"><p className="text-sm font-medium">{item.title}</p>{item.detail ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.detail}</p> : null}</div>)}</div>}</section>;
}
