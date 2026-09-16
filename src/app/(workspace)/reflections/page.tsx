import { Lightbulb } from "lucide-react";

import { ModuleEmptyPage } from "@/components/layout/module-empty-page";

export default function ReflectionsPage() {
  return <ModuleEmptyPage eyebrow="Evolve" title="Reflections" description="追踪你如何从最初的理解，走到现在的认知。" emptyTitle="还没有认知变化" emptyDescription="Reflection 会保留 v1、v2、v3 等不可覆盖的认知版本，并记录错误原因、当前不足和下一步行动。" icon={Lightbulb} secondaryNote="Reflection 数据库已为版本历史预留，完整编辑界面将在后续阶段启用。" />;
}
