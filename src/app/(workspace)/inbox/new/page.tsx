import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { QuickCapture } from "@/features/dashboard/quick-capture";

export default function NewInboxPage() {
  return <div className="mx-auto max-w-3xl space-y-7"><Link href="/inbox" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" />返回 Inbox</Link><PageHeader eyebrow="Capture" title="记录此刻的想法" description="不用先分类，也不用写完整。先让它存在。" /><QuickCapture /><div className="flex items-center gap-2 text-xs text-muted-foreground"><Inbox className="size-3.5 text-primary" aria-hidden="true" />保存后会写入 Notes，并保留初始版本。</div></div>;
}