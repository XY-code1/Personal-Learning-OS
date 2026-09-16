import { FileText } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceState } from "@/components/supabase/workspace-state";
import { NotesWorkspace } from "@/features/notes/notes-workspace";
import { listNotes } from "@/server/notes/queries";

export default async function NotesPage() {
  const result = await listNotes();
  return <div className="space-y-8"><PageHeader eyebrow="Capture" title="Notes" description="保存原始笔记、随笔、灵感和思考素材。" action={<FileText className="size-5 text-primary" />} />{result.status === "ready" ? <NotesWorkspace notes={result.notes} /> : <WorkspaceState status={result.status} />}</div>;
}