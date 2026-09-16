import { Brain } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { KnowledgeWorkspace } from "@/features/knowledge/knowledge-workspace";
import { listKnowledge } from "@/server/knowledge/queries";

export default async function KnowledgePage() {
  const result = await listKnowledge();
  return <div className="space-y-8"><PageHeader eyebrow="Curate" title="Knowledge" description="把实践和阅读沉淀成可以反复调用的理解。" action={<Brain className="size-5 text-primary" />} />{result.status === "ready" ? <KnowledgeWorkspace knowledge={result.knowledge} /> : <WorkspaceState status={result.status} />}</div>;
}