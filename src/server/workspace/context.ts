import type { SupabaseClient, User } from "@supabase/supabase-js";

import { hasSupabasePublicEnv, isDevelopmentAuthBypassEnabled } from "@/lib/supabase/config";
import { ensurePersonalWorkspace } from "@/lib/supabase/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WorkspaceRecord = { id: string; name: string; slug: string };

type ReadyWorkspaceContext = { status: "ready"; supabase: SupabaseClient; user: User; workspace: WorkspaceRecord };
export type WorkspaceContext = ReadyWorkspaceContext | { status: "unconfigured" | "unauthenticated" };

export async function getWorkspaceContext({ ensure = false }: { ensure?: boolean } = {}): Promise<WorkspaceContext> {
  if (!hasSupabasePublicEnv()) return { status: "unconfigured" };

  // The development-only bypass is intentionally UI-only. Do not wait on a
  // stale or unavailable remote session while the developer is working on the
  // shell; turning the flag off restores the real Auth → Workspace path.
  if (isDevelopmentAuthBypassEnabled()) return { status: "unauthenticated" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (userError.name === "AuthSessionMissingError" || userError.message === "Auth session missing!") return { status: "unauthenticated" };
    throw userError;
  }
  if (!user) return { status: "unauthenticated" };

  let workspaceId: string | null = null;
  if (ensure) workspaceId = await ensurePersonalWorkspace(supabase);

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (workspaceError) throw workspaceError;

  if (!workspace && workspaceId) {
    const { data: ensuredWorkspace, error: ensuredWorkspaceError } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("id", workspaceId)
      .single();
    if (ensuredWorkspaceError) throw ensuredWorkspaceError;
    return { status: "ready", supabase, user, workspace: ensuredWorkspace };
  }

  if (!workspace) return { status: "unauthenticated" };
  return { status: "ready", supabase, user, workspace };
}

export async function requireWorkspaceContext(): Promise<ReadyWorkspaceContext> {
  const context = await getWorkspaceContext({ ensure: true });
  if (context.status !== "ready") throw new Error(context.status === "unconfigured" ? "SUPABASE_NOT_CONFIGURED" : "AUTH_REQUIRED");
  return context;
}
