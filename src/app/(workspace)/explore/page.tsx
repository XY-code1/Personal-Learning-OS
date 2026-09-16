import { Compass } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { KnowledgeConstellation } from "@/features/constellation/knowledge-constellation";
import { getConstellationSnapshot } from "@/server/constellation/queries";

export default async function ExplorePage() {
  const result = await getConstellationSnapshot();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Explore"
        title="Knowledge Constellation"
        description="从真实的知识、实践证据和认知变化中，看见你的知识结构。"
        action={<Compass className="size-5 text-primary" aria-hidden="true" />}
      />
      {result.status === "ready" ? <KnowledgeConstellation snapshot={result} /> : <WorkspaceState status={result.status} />}
    </div>
  );
}
