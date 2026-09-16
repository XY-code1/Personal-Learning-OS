import { PageHeader } from "@/components/layout/page-header";
import { ImportExportWorkspace } from "@/features/portability/import-export-workspace";

export default function ImportExportPage() {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Portability" title="Import / Export" description="你的学习数据应该属于你。Markdown 和 JSON 会作为长期迁移格式。" />
      <ImportExportWorkspace />
      <p className="text-center text-xs text-muted-foreground">导入采用新增策略；遇到重复稳定 ID 时会停止并提示，不会静默覆盖已有内容。</p>
    </div>
  );
}
