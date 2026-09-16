import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type ModuleEmptyPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
  primaryAction?: { href: string; label: string };
  secondaryNote: string;
};

export function ModuleEmptyPage({ eyebrow, title, description, emptyTitle, emptyDescription, icon, primaryAction, secondaryNote }: ModuleEmptyPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} action={primaryAction ? <Button render={<Link href={primaryAction.href} />}>{primaryAction.label}</Button> : undefined} />
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} className="min-h-[22rem]" />
        </CardContent>
      </Card>
      <p className="border-t border-[var(--line-soft)] pt-5 text-center text-xs text-muted-foreground">{secondaryNote}</p>
    </div>
  );
}