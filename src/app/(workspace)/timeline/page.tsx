import { Clock3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { TimelineWorkspace } from "@/features/timeline/timeline-workspace";
import { listTimelineEvents } from "@/server/timeline/queries";

export default async function TimelinePage() {
  const result = await listTimelineEvents();
  return <div className="space-y-8"><PageHeader eyebrow="Trace" title="Timeline" description="回看学习记录、知识变化、项目进度、认知变化和任务完成。" action={<Clock3 className="size-5 text-primary" />} />{result.status === "ready" ? <TimelineWorkspace events={result.events} /> : <WorkspaceState status={result.status} />}</div>;
}
