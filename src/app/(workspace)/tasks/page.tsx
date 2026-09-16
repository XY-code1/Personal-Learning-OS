import { CheckSquare2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { TasksWorkspace } from "@/features/tasks/tasks-workspace";
import { listTasks } from "@/server/tasks/queries";

export default async function TasksPage() {
  const result = await listTasks();
  return <div className="space-y-8"><PageHeader eyebrow="Act" title="Tasks" description="把学习、项目和待解决问题变成下一步可以完成的动作。" action={<CheckSquare2 className="size-5 text-primary" />} />{result.status === "ready" ? <TasksWorkspace tasks={result.tasks} /> : <WorkspaceState status={result.status} />}</div>;
}