import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensurePersonalWorkspace(supabase: SupabaseClient) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("认证成功，但没有找到当前用户。");

  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Learner";
  const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
  if (profileError) throw profileError;

  const { data: workspace, error: workspaceLookupError } = await supabase.from("workspaces").select("id").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (workspaceLookupError) throw workspaceLookupError;
  let workspaceId = workspace?.id;
  if (!workspaceId) {
    const { data: createdWorkspace, error: workspaceError } = await supabase.from("workspaces").insert({ owner_id: user.id, name: "My Learning Space", slug: "my-learning-space" }).select("id").single();
    if (workspaceError) throw workspaceError;
    workspaceId = createdWorkspace.id;
  }

  const { error: memberError } = await supabase.from("workspace_members").upsert({ workspace_id: workspaceId, user_id: user.id, role: "owner" }, { onConflict: "workspace_id,user_id" });
  if (memberError) throw memberError;
  return workspaceId;
}