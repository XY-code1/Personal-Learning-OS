import { FolderKanban } from "lucide-react";

import { ModuleEmptyPage } from "@/components/layout/module-empty-page";

export default function ProjectsPage() {
  return <ModuleEmptyPage eyebrow="Practice" title="Projects" description="用项目把知识放回真实的实践上下文。" emptyTitle="还没有项目" emptyDescription="创建项目后，可以在同一处追踪目标、进度、任务、实验、Bug 和关联知识。" icon={FolderKanban} secondaryNote="项目详情、进度、任务和实验将在实践阶段启用。" />;
}
