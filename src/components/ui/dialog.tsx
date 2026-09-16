import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Dialog({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border bg-card p-6 shadow-xl", className)} role="dialog" {...props} />;
}
