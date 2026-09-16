"use client";

import { Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps, type NodeTypes, type ReactFlowInstance } from "@xyflow/react";
import { BookOpen, Compass, RotateCcw, Search, Target, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { getConstellationPosition, getKnowledgeNodeSize, matchesKnowledgeSearch } from "@/features/constellation/constellation-utils";
import { KnowledgeInspectorPanel } from "@/features/constellation/knowledge-inspector";
import type { ConstellationEdge, ConstellationNode, ConstellationSnapshot } from "@/types/constellation";

type KnowledgeNodeData = ConstellationNode & {
  matched: boolean;
  dimmed: boolean;
  onActivate: (id: string) => void;
};
type KnowledgeFlowNode = Node<KnowledgeNodeData, "knowledge">;

function KnowledgeNode({ data, selected }: NodeProps<KnowledgeFlowNode>) {
  const size = getKnowledgeNodeSize(data);
  return (
    <div
      className={cn("constellation-node relative flex items-center justify-center rounded-[28%] border px-4 text-center shadow-[0_18px_30px_-28px_rgba(39,48,45,.85)] transition-[opacity,transform,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--constellation-sage)]/35", selected ? "border-[var(--constellation-sage)] bg-[#e4eee7] shadow-[0_22px_34px_-25px_rgba(57,83,66,.7)]" : "border-[rgba(39,48,45,.18)] bg-[#fbfaf5] hover:-translate-y-0.5 hover:border-[var(--constellation-sage)]", data.dimmed ? "opacity-25" : "opacity-100", data.matched && !selected ? "ring-1 ring-[var(--constellation-accent)]/30" : "")}
      style={{ width: size, height: Math.round(size * 0.72) }}
      role="button"
      tabIndex={0}
      aria-label={`Knowledge：${data.title}。${data.openGapCount > 0 ? `有 ${data.openGapCount} 个未解决 Gap。` : "没有未解决 Gap。"}`}
      onClick={() => data.onActivate(data.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onActivate(data.id);
        }
      }}
    >
      <Handle type="target" position={Position.Top} className="!pointer-events-none !border-0 !bg-transparent !opacity-0" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-[0.78rem] font-semibold leading-5 tracking-[-.02em] text-[var(--constellation-ink)]">{data.title}</p>
        <p className="mt-1 text-[0.62rem] text-[var(--constellation-soft)]">v{data.versionCount} · {data.relatedKnowledgeCount} related</p>
      </div>
      {data.openGapCount > 0 ? <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[var(--constellation-accent)]" title={`${data.openGapCount} 个未解决 Gap`} aria-label={`${data.openGapCount} 个未解决 Gap`} /> : null}
      <Handle type="source" position={Position.Bottom} className="!pointer-events-none !border-0 !bg-transparent !opacity-0" />
    </div>
  );
}

const nodeTypes: NodeTypes = { knowledge: KnowledgeNode };

function edgeStyle(relationType: string, selected: boolean, weight: number) {
  return {
    stroke: selected ? "#6f8779" : "#9aa79e",
    strokeWidth: selected ? 1.8 : 1,
    strokeOpacity: selected ? 0.9 : Math.max(0.28, Math.min(0.6, 0.28 + weight * 0.3)),
    strokeDasharray: relationType === "contradicts" ? "6 5" : relationType === "example" ? "2 5" : undefined,
  };
}

function makeFlowEdges(edges: ConstellationEdge[], visibleIds: Set<string>, selectedId: string | null): Edge[] {
  return edges
    .filter((edge) => visibleIds.has(edge.sourceKnowledgeId) && visibleIds.has(edge.targetKnowledgeId))
    .map((edge) => ({
      id: edge.id,
      source: edge.sourceKnowledgeId,
      target: edge.targetKnowledgeId,
      type: "straight",
      data: { relationType: edge.relationType },
      style: edgeStyle(edge.relationType, Boolean(selectedId && (edge.sourceKnowledgeId === selectedId || edge.targetKnowledgeId === selectedId)), edge.weight),
      ariaLabel: `${edge.relationType} relation`,
    }));
}

export function KnowledgeConstellation({ snapshot }: { snapshot: ConstellationSnapshot }) {
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState("");
  const [gapStatus, setGapStatus] = useState<"all" | "open" | "none">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const flowRef = useRef<ReactFlowInstance<KnowledgeFlowNode> | null>(null);
  const activateNode = useCallback((id: string) => setSelectedId(id), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const filteredNodes = useMemo(() => snapshot.nodes.filter((node) => {
    const topicMatch = !topicId || node.topicIds.includes(topicId);
    const gapMatch = gapStatus === "all" || (gapStatus === "open" ? node.openGapCount > 0 : node.openGapCount === 0);
    return topicMatch && gapMatch;
  }), [gapStatus, snapshot.nodes, topicId]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes]);
  const matchingIds = useMemo(() => new Set(snapshot.nodes.filter((node) => matchesKnowledgeSearch(node, search)).map((node) => node.id)), [search, snapshot.nodes]);
  const flowNodes = useMemo<KnowledgeFlowNode[]>(() => filteredNodes.map((node, index) => {
    const position = getConstellationPosition(index, filteredNodes.length);
    return {
      id: node.id,
      type: "knowledge",
      position,
      data: { ...node, matched: matchingIds.has(node.id), dimmed: Boolean(search.trim()) && !matchingIds.has(node.id), onActivate: activateNode },
      focusable: true,
      ariaRole: "button",
    };
  }), [activateNode, filteredNodes, matchingIds, search]);
  const flowEdges = useMemo(() => makeFlowEdges(snapshot.edges, visibleIds, selectedId), [selectedId, snapshot.edges, visibleIds]);

  const resetView = useCallback(() => {
    setSearch("");
    setTopicId("");
    setGapStatus("all");
    setSelectedId(null);
    requestAnimationFrame(() => { void flowRef.current?.fitView({ padding: 0.2, duration: reducedMotion ? 0 : 260 }); });
  }, [reducedMotion]);

  if (snapshot.nodes.length === 0) {
    return <EmptyState icon={Compass} title="你的知识星图还没有开始生长" description="先记录一些真正属于你的理解，这里会逐渐形成你的知识结构。" action={<Button render={<Link href="/knowledge" />}><BookOpen className="size-4" />创建 Knowledge</Button>} className="min-h-[26rem] rounded-xl border-[var(--line-soft)] bg-[var(--paper)]" />;
  }

  return (
    <div className={cn("relative", selectedId && "xl:grid xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-start xl:gap-4")}>
      <div className="min-w-0 space-y-4">
        <section className="surface-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><Compass className="size-4 text-primary" aria-hidden="true" /><p className="eyebrow">Explore / Knowledge Constellation</p></div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">只显示真实 Knowledge 和真实 Relation。节点越大，表示它拥有更丰富的认知记录与实践证据，不代表掌握程度。</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground"><span>{snapshot.totalKnowledgeCount} 个 Knowledge</span><span>·</span><span>{snapshot.edges.length} 条 Relation</span></div>
        </section>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--line-soft)] bg-[var(--paper)] p-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><span className="sr-only">搜索 Knowledge</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Knowledge" className="h-10 w-full rounded-md border border-[var(--line-soft)] bg-background/65 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-primary/15" /></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><span className="sr-only">Topic Filter</span><select value={topicId} onChange={(event) => { setTopicId(event.target.value); setSelectedId(null); }} className="h-10 min-w-36 rounded-md border border-[var(--line-soft)] bg-background/65 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"><option value="">All Topics</option>{snapshot.topicOptions.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><span className="sr-only">Gap Filter</span><select value={gapStatus} onChange={(event) => { setGapStatus(event.target.value as "all" | "open" | "none"); setSelectedId(null); }} className="h-10 min-w-36 rounded-md border border-[var(--line-soft)] bg-background/65 px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"><option value="all">Gap · All</option><option value="open">Gap · Open</option><option value="none">Gap · No Open Gap</option></select></label>
          <Button type="button" variant="ghost" className="h-10" onClick={resetView}><RotateCcw className="size-3.5" />Reset View</Button>
        </div>

        {snapshot.truncated ? <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs leading-5 text-primary">当前 Workspace 有 {snapshot.totalKnowledgeCount} 个 Knowledge，图谱首屏显示最近的 500 个。请使用搜索或过滤聚焦更小的范围。</p> : null}
        {search.trim() && matchingIds.size === 0 ? <p className="rounded-lg border border-[var(--line-soft)] bg-background/45 px-3 py-2 text-xs text-muted-foreground">没有匹配的 Knowledge。当前过滤范围仍保留在画布中。</p> : null}
        {filteredNodes.length === 0 ? <EmptyState icon={Target} title="当前筛选没有结果" description="调整 Topic 或 Gap 状态，继续查看你的知识结构。" action={<Button type="button" variant="outline" onClick={resetView}><X className="size-4" />清除筛选</Button>} className="min-h-[26rem] rounded-xl border-[var(--line-soft)] bg-[var(--paper)]" /> : <section className="knowledge-constellation-flow overflow-hidden rounded-xl border border-[var(--line-soft)] bg-[var(--paper)]" aria-label="Knowledge Constellation 图谱">
          <div className="h-[34rem] min-h-[34rem] w-full sm:h-[42rem] sm:min-h-[42rem]">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onInit={(instance) => { flowRef.current = instance; }}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.35}
              maxZoom={1.6}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              nodesFocusable
              onlyRenderVisibleElements
              panOnDrag
              zoomOnScroll
              zoomOnPinch
              aria-label="Knowledge Constellation。可平移、缩放并选择 Knowledge 节点。"
            >
              <Controls showInteractive={false} position="bottom-right" />
            </ReactFlow>
          </div>
          {snapshot.edges.length === 0 ? <div className="border-t border-[var(--line-soft)] px-4 py-3 text-xs leading-5 text-muted-foreground">当前没有 Knowledge Relation，节点会保持独立。关系建立后才会在这里出现连线。</div> : null}
        </section>}

        <details className="rounded-xl border border-[var(--line-soft)] bg-[var(--paper)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20">Knowledge List <span className="ml-1 text-xs font-normal text-muted-foreground">({filteredNodes.length})</span></summary>
          <div className="grid gap-2 border-t border-[var(--line-soft)] p-3 sm:grid-cols-2">{filteredNodes.slice(0, 120).map((node) => <button key={node.id} type="button" className={cn("flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20", selectedId === node.id ? "border-primary/45 bg-primary/5" : "border-[var(--line-soft)] bg-background/35 hover:bg-background")} onClick={() => setSelectedId(node.id)}><span className="min-w-0 truncate">{node.title}</span><span className="shrink-0 text-[0.68rem] text-muted-foreground">v{node.versionCount}</span></button>)}</div>
          {filteredNodes.length > 120 ? <p className="border-t border-[var(--line-soft)] px-4 py-3 text-xs text-muted-foreground">列表仅展示前 120 个当前节点；使用搜索或过滤聚焦更多内容。</p> : null}
        </details>
      </div>
      {selectedId && visibleIds.has(selectedId) ? <KnowledgeInspectorPanel key={selectedId} knowledgeId={selectedId} onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
