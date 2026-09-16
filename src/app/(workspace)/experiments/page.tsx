import { FlaskConical } from "lucide-react";

import { ModuleEmptyPage } from "@/components/layout/module-empty-page";

export default function ExperimentsPage() {
  return <ModuleEmptyPage eyebrow="Test" title="Experiments" description="记录你如何验证一个假设，以及结果真正告诉了你什么。" emptyTitle="还没有实验记录" emptyDescription="每个实验会保留目标、环境、操作过程、结果、问题、解决方法和结论。" icon={FlaskConical} secondaryNote="实验记录会在项目与实践阶段接入。" />;
}
