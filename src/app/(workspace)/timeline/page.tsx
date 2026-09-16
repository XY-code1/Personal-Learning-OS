import { Clock3 } from "lucide-react";

import { ModuleEmptyPage } from "@/components/layout/module-empty-page";

export default function TimelinePage() {
  return <ModuleEmptyPage eyebrow="Trace" title="Timeline" description="回看学习记录、知识变化、项目进度、认知变化和任务完成。" emptyTitle="时间线还没有事件" emptyDescription="当你开始记录和实践，重要的创建、完成、复盘和版本变化会汇聚到这里。" icon={Clock3} secondaryNote="Timeline 会从业务事件生成，不会成为业务数据的唯一来源。" />;
}
