import { Search as SearchIcon, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Find" title="Global Search" description="未来从一个入口查找笔记、知识、项目、任务和认知记录。" />
      <Card>
        <CardHeader><CardTitle>搜索你的学习空间</CardTitle></CardHeader>
        <CardContent>
          <div className="relative"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input placeholder="输入关键词……" aria-label="全局搜索关键词" className="pl-9" /></div>
          <div className="mt-6"><EmptyState icon={SearchIcon} title="搜索索引尚未启用" description="Phase 1 先建立界面入口；复杂全文搜索和向量检索会在后续阶段加入。" /></div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />搜索结果未来会先按 Workspace 隔离，再进行关键词和语义检索。</div>
    </div>
  );
}
