import type { SupabaseClient, User } from "@supabase/supabase-js";

import { hasSupabasePublicEnv, isDevelopmentAuthBypassEnabled } from "@/lib/supabase/config";
import { ensureUserWorkspace } from "@/lib/supabase/bootstrap";
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

  // Personal workspace first (backward compatible).
  const { data: ownedWorkspace, error: ownedWorkspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownedWorkspaceError) throw ownedWorkspaceError;

  let workspace = ownedWorkspace ?? null;

  // Fall back to the earliest shared workspace membership.
  if (!workspace) {
    const { data: memberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1);
    if (membershipError) throw membershipError;

    if (memberships && memberships.length > 0) {
      const { data: memberWorkspace, error: memberWorkspaceError } = await supabase
        .from("workspaces")
        .select("id, name, slug")
        .eq("id", memberships[0].workspace_id)
        .maybeSingle();
      if (memberWorkspaceError) throw memberWorkspaceError;
      workspace = memberWorkspace ?? null;
    }
  }

  // Bootstrap a personal workspace when a write is requested and none exists.
  if (!workspace && ensure) {
    const workspaceId = await ensureUserWorkspace(supabase);
    const { data: ensuredWorkspace, error: ensuredWorkspaceError } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("id", workspaceId)
      .maybeSingle();
    if (ensuredWorkspaceError) throw ensuredWorkspaceError;
    workspace = ensuredWorkspace ?? null;
  }

  if (!workspace) return { status: "unauthenticated" };
  return { status: "ready", supabase, user, workspace };
}

export async function requireWorkspaceContext(): Promise<ReadyWorkspaceContext> {
  const context = await getWorkspaceContext({ ensure: true });
  if (context.status !== "ready") throw new Error(context.status === "unconfigured" ? "SUPABASE_NOT_CONFIGURED" : "AUTH_REQUIRED");
  return context;
}
