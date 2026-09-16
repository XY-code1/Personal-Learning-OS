import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("flex min-h-28 w-full resize-y rounded-md border bg-background px-3.5 py-3 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/75 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60", className)} {...props} />;
}