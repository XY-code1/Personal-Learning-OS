"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowUpRight, CheckCircle2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { createNoteAction } from "@/server/notes/actions";
import type { ActionResult } from "@/types/records";

export function QuickCapture() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitCapture(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim() || isPending) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("content_markdown", value.trim());
    setResult(null);
    startTransition(async () => {
      const nextResult = await createNoteAction(formData);
      setResult(nextResult);
      if (nextResult.ok) {
        setValue("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submitCapture} className="rounded-2xl border bg-card p-4 shadow-[0_14px_38px_-30px_rgba(31,41,55,0.75)] sm:p-5">
        <Textarea value={value} onChange={(event) => { setValue(event.target.value); setResult(null); }} placeholder="记录一个刚刚出现的想法、问题或观察……" aria-label="快速记录内容" className="min-h-24 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0" />
        <input type="hidden" name="note_type" value="quick" />
        <div className="mt-3 flex items-center justify-between border-t pt-3"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Paperclip className="size-3.5" aria-hidden="true" />写入当前 Workspace 的 Notes</span><Button type="submit" size="sm" disabled={!value.trim() || isPending}>{isPending ? "保存中…" : "保存记录"}<ArrowUpRight className="size-3.5" aria-hidden="true" /></Button></div>
      </form>
      {result?.ok ? <Toast tone="success" title="笔记已保存" description="这条快速记录已经写入 Notes，并创建了 v1 版本。" /> : null}
      {result && !result.ok ? <div role="alert" className="flex items-center gap-2 text-xs text-destructive"><CheckCircle2 className="size-3.5" aria-hidden="true" />{result.message}</div> : null}
    </div>
  );
}