import { PageHeader } from "@/components/layout/page-header";
import { AssistantWorkspace } from "@/features/ai/assistant-workspace";

export default function AiPage() {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Personal context" title="AI Assistant" description="让自己的知识回答你。AI 只读当前 Workspace，并为回答保留来源。" />
      <AssistantWorkspace />
    </div>
  );
}
