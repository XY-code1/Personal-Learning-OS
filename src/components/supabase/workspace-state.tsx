import { Database, LogIn } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { isDevelopmentAuthBypassEnabled } from "@/lib/supabase/config";

export function WorkspaceState({ status }: { status: "unconfigured" | "unauthenticated" }) {
  if (status === "unconfigured") return <EmptyState icon={Database} title="需要连接 Supabase" description="请在 .env.local 填写 Supabase URL 和 anon key，并执行项目 migration 后再开始保存数据。" action={<Button variant="outline" render={<Link href="/" />}>查看产品首页</Button>} className="min-h-[18rem]" />;
  if (isDevelopmentAuthBypassEnabled()) return <EmptyState icon={Database} title="开发模式 · 尚未连接用户数据" description="当前仅展示工作区界面，未伪造 Supabase Session，也未关闭 RLS。关闭 development bypass 后即可连接真实用户数据。" action={<Button variant="outline" render={<Link href="/login" />}>连接真实用户</Button>} className="min-h-[18rem]" />;
  return <EmptyState icon={LogIn} title="请先登录" description="登录后才能查看和管理属于你的 Workspace 的数据。" action={<Button render={<Link href="/login" />}>前往登录</Button>} className="min-h-[18rem]" />;
}
