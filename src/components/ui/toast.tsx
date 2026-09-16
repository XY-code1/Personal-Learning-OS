import { CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastProps = {
  title: string;
  description?: string;
  tone?: "info" | "success";
  className?: string;
};

export function Toast({ title, description, tone = "info", className }: ToastProps) {
  const Icon = tone === "success" ? CheckCircle2 : Info;
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-lg", className)} role="status">
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "success" ? "text-emerald-600" : "text-primary")} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}
