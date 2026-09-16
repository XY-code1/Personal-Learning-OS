"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RouteError({ reset }: { reset: () => void }) {
  return <div className="flex min-h-[18rem] flex-col items-center justify-center border border-dashed bg-card/50 px-6 py-10 text-center"><AlertCircle className="size-5 text-destructive" aria-hidden="true" /><h2 className="mt-4 text-sm font-semibold">数据暂时无法加载</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">请检查 Supabase 连接和 migration 状态，然后重试。</p><Button className="mt-5" variant="outline" onClick={reset}>重新加载</Button></div>;
}
