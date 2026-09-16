import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Brain } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { Button } from "@/components/ui/button";
import { KnowledgeDetailWorkspace } from "@/features/knowledge/knowledge-detail";
import { getKnowledgeDetail } from "@/server/cognitive/queries";

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getKnowledgeDetail(id);

  if (result.status === "not_found") notFound();
  if (result.status !== "ready") {
    return <div className="space-y-8"><PageHeader eyebrow="Knowledge detail" title="Knowledge" description="查看这条知识如何被理解、实践和修正。" action={<Brain className="size-5 text-primary" />} /><WorkspaceState status={result.status} /></div>;
  }

  return <div className="space-y-8"><PageHeader eyebrow="Knowledge detail" title={result.knowledge.title} description={result.knowledge.summary || "从当前理解开始，继续补充证据与认知变化。"} action={<Button variant="outline" render={<Link href="/knowledge" />}><ArrowLeft className="size-4" />返回 Knowledge</Button>} /><KnowledgeDetailWorkspace snapshot={result} /></div>;
}
