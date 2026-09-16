import { Tags } from "lucide-react";

import { ModuleEmptyPage } from "@/components/layout/module-empty-page";

export default function TopicsPage() {
  return <ModuleEmptyPage eyebrow="Organize" title="Topics / Tags" description="用自己的语言建立学习主题，让笔记和知识拥有可穿行的路径。" emptyTitle="还没有主题" emptyDescription="主题可以由你创建，并让一条 Note 或 Knowledge 同时属于多个主题。" icon={Tags} secondaryNote="主题、标签和跨内容筛选将在内容模型启用后接入。" />;
}
