"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  Brain,
  CheckSquare2,
  Compass,
  ChevronDown,
  Clock3,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Tags,
  X,
} from "lucide-react";

import { navigationItems, type NavigationItem } from "@/features/navigation/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const iconMap: Record<NavigationItem["icon"], typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  inbox: Inbox,
  notes: FileText,
  knowledge: Brain,
  explore: Compass,
  topics: Tags,
  projects: FolderKanban,
  tasks: CheckSquare2,
  experiments: FlaskConical,
  reflections: Lightbulb,
  timeline: Clock3,
  search: Search,
  ai: Sparkles,
  transfer: ArrowLeftRight,
};

function NavigationPendingIndicator() {
  const { pending } = useLinkStatus();

  return <span className={cn("nav-link-pending", pending && "is-pending")} aria-hidden="true" />;
}

function NavigationLink({ item, active, onNavigate }: { item: NavigationItem; active: boolean; onNavigate: () => void }) {
  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      title={item.description}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex min-h-9 items-center gap-3 rounded-md px-3 text-[0.82rem] transition-colors focus-visible:ring-3 focus-visible:ring-primary/20 focus-visible:outline-none",
        active ? "bg-[var(--sidebar-accent)] font-semibold text-foreground" : "text-muted-foreground hover:bg-background/75 hover:text-foreground",
      )}
    >
      {active ? <span className="absolute left-0 h-4 w-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground")} aria-hidden="true" />
      <span className="whitespace-nowrap">{item.label}</span>
      <NavigationPendingIndicator />
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <div className="relative flex size-9 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
          <span className="absolute inset-1 rounded-[5px] border border-background/35" />
          P
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.86rem] font-semibold tracking-[-0.025em]">Personal Learning OS</p>
          <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">个人学习工作台</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-y border-[var(--line-soft)] px-2 py-3">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <p className="mt-1 truncate text-sm font-medium">My Learning Space</p>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </div>

      <Link href="/inbox/new" onClick={onNavigate} className="mt-5 flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary/88 active:translate-y-px focus-visible:ring-3 focus-visible:ring-primary/25 focus-visible:outline-none">
        <Plus className="size-4" aria-hidden="true" />
        快速记录
      </Link>

      <nav className="mt-6 flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="主导航">
        {navigationItems.map((item) => <NavigationLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} onNavigate={onNavigate} />)}
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileNav() {
    setMobileOpen(false);
  }

  async function signOut() {
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } catch {
      // Supabase is optional during the visual foundation phase.
    }
    router.push("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      {mobileOpen ? <button type="button" className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" aria-label="关闭导航" onClick={closeMobileNav} /> : null}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[18rem] -translate-x-full flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] px-5 py-6 transition-transform duration-200 lg:translate-x-0", mobileOpen && "translate-x-0")}>
        <div className="mb-5 flex justify-end lg:hidden"><button type="button" className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-background" aria-label="关闭导航" onClick={closeMobileNav}><X className="size-4" /></button></div>
        <SidebarContent pathname={pathname} onNavigate={closeMobileNav} />
        <div className="mt-auto border-t border-[var(--line-soft)] pt-4">
          <Link href="/settings" onClick={closeMobileNav} className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:bg-background/75 hover:text-foreground">
            <Settings2 className="size-4" aria-hidden="true" />
            <span>设置与偏好</span>
          </Link>
          <div className="mt-3 flex items-center gap-3 rounded-md bg-background/55 p-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">L</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Learner</p><p className="truncate text-[0.68rem] text-muted-foreground">个人空间</p></div>
            <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground" aria-label="退出登录" onClick={signOut}><LogOut className="size-3.5" /></button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[18rem]">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--line-soft)] bg-background/92 px-4 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="flex size-9 items-center justify-center rounded-md border bg-card text-muted-foreground hover:bg-muted lg:hidden" aria-label="打开导航" onClick={() => setMobileOpen(true)}><Menu className="size-4" /></button>
            <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-[-0.02em]">专注于下一步理解</p><p className="hidden truncate text-xs text-muted-foreground sm:block">把记录变成知识，把实践变成认知。</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/search" className="hidden h-9 items-center gap-2 rounded-md border bg-card px-3 text-xs text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground md:flex" aria-label="打开全局搜索">
              <Search className="size-3.5" aria-hidden="true" /><span>搜索知识、笔记或项目</span><kbd className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
            </Link>
            <span className="hidden border-l border-[var(--line-soft)] pl-3 text-[0.68rem] font-medium text-muted-foreground sm:inline">Phase 1 Preview</span>
            <div className="flex size-9 items-center justify-center rounded-full border bg-card text-xs font-semibold text-primary" aria-label="当前用户">L</div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11">{children}</main>
      </div>
    </div>
  );
}
