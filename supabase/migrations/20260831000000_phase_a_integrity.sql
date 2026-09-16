-- Phase A additive hardening.
-- The initial schema already isolates rows by workspace. These policies also
-- ensure user-created core records cannot impersonate another creator.

begin;

drop policy if exists notes_workspace_insert on public.notes;
create policy notes_workspace_insert on public.notes
for insert to authenticated
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

drop policy if exists note_versions_workspace_insert on public.note_versions;
create policy note_versions_workspace_insert on public.note_versions
for insert to authenticated
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

drop policy if exists knowledge_workspace_insert on public.knowledge;
create policy knowledge_workspace_insert on public.knowledge
for insert to authenticated
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

drop policy if exists knowledge_versions_workspace_insert on public.knowledge_versions;
create policy knowledge_versions_workspace_insert on public.knowledge_versions
for insert to authenticated
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

drop policy if exists tasks_workspace_insert on public.tasks;
create policy tasks_workspace_insert on public.tasks
for insert to authenticated
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

drop policy if exists timeline_events_workspace_insert on public.timeline_events;
create policy timeline_events_workspace_insert on public.timeline_events
for insert to authenticated
with check (
  public.can_edit_workspace(workspace_id)
  and (actor_type <> 'user' or actor_id = auth.uid())
);

commit;
