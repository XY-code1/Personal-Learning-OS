import { AppShell } from "@/components/layout/app-shell";
import { getWorkspaceContext } from "@/server/workspace/context";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const context = await getWorkspaceContext();
  const workspaceName = context.status === "ready" ? context.workspace.name : "My Learning Space";
  const displayName = context.status === "ready" && typeof context.user.user_metadata?.display_name === "string" ? context.user.user_metadata.display_name : null;
  const userName = context.status === "ready" ? displayName || context.user.email?.split("@")[0] || "Learner" : "Learner";
  return <AppShell workspaceName={workspaceName} userName={userName}>{children}</AppShell>;
}
