-- Personal Learning OS / Enforce append-only history and audit actor integrity
-- Version history, timeline and audit logs are insert-only for application
-- users. Existing rows, RPCs and import flows are unchanged.

begin;

-- Version history: append-only. Remove update/delete policies so no
-- workspace member (including owners) can rewrite or remove history via the app.
drop policy if exists note_versions_workspace_update on public.note_versions;
drop policy if exists note_versions_workspace_delete on public.note_versions;

drop policy if exists knowledge_versions_workspace_update on public.knowledge_versions;
drop policy if exists knowledge_versions_workspace_delete on public.knowledge_versions;

drop policy if exists reflection_versions_workspace_update on public.reflection_versions;
drop policy if exists reflection_versions_workspace_delete on public.reflection_versions;

-- Reflection versions are created through create_reflection_with_version, which
-- always writes created_by = auth.uid(). Keep the insert policy consistent with
-- note_versions and knowledge_versions.
drop policy if exists reflection_versions_workspace_insert on public.reflection_versions;
create policy reflection_versions_workspace_insert on public.reflection_versions
for insert to authenticated
with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());

-- Timeline: append-only projection.
drop policy if exists timeline_events_workspace_update on public.timeline_events;
drop policy if exists timeline_events_workspace_delete on public.timeline_events;

-- Audit log: append-only, and user-authored entries must use the current user.
drop policy if exists audit_logs_workspace_update on public.audit_logs;
drop policy if exists audit_logs_workspace_delete on public.audit_logs;

drop policy if exists audit_logs_workspace_insert on public.audit_logs;
create policy audit_logs_workspace_insert on public.audit_logs
for insert to authenticated
with check (
  public.can_edit_workspace(workspace_id)
  and (actor_type <> 'user' or actor_id = auth.uid())
);

comment on table public.note_versions is 'Append-only Note versions. Application users can insert and select only.';
comment on table public.knowledge_versions is 'Append-only Knowledge understanding versions. Application users can insert and select only.';
comment on table public.reflection_versions is 'Append-only Reflection cognitive versions. Application users can insert and select only.';
comment on table public.timeline_events is 'Append-only learning timeline projection. Application users can insert and select only.';
comment on table public.audit_logs is 'Append-only audit log. User-authored entries must use auth.uid() as actor_id.';

commit;
