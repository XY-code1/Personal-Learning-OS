-- Personal Learning OS / Cognitive Layer MVP
-- Additive migration: reuses knowledge_versions, reflection_versions,
-- knowledge_tasks and timeline_events. No duplicate version or timeline tables.

begin;

create table public.learning_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  reflection_id uuid references public.reflections(id) on delete set null,
  reflection_version_id uuid references public.reflection_versions(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  experiment_id uuid references public.experiments(id) on delete set null,
  note_id uuid references public.notes(id) on delete set null,
  evidence_type text not null default 'observation' check (evidence_type in ('observation', 'note', 'experiment', 'project', 'reflection', 'external')),
  title text not null,
  description text not null default '',
  source text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null default '',
  gap_type text not null default 'concept' check (gap_type in ('concept', 'application', 'evidence', 'prerequisite', 'confidence')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'dismissed')),
  confidence numeric(4, 3) not null default 0.5 check (confidence between 0 and 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create index learning_evidence_knowledge_created_idx on public.learning_evidence (knowledge_id, created_at desc);
create index knowledge_gaps_knowledge_status_idx on public.knowledge_gaps (knowledge_id, status, created_at desc);

alter table public.learning_evidence enable row level security;
create policy learning_evidence_workspace_select on public.learning_evidence
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy learning_evidence_workspace_insert on public.learning_evidence
  for insert to authenticated
  with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());
create policy learning_evidence_workspace_update on public.learning_evidence
  for update to authenticated using (public.can_edit_workspace(workspace_id))
  with check (public.can_edit_workspace(workspace_id));
create policy learning_evidence_workspace_delete on public.learning_evidence
  for delete to authenticated using (public.is_workspace_owner(workspace_id));

alter table public.knowledge_gaps enable row level security;
create policy knowledge_gaps_workspace_select on public.knowledge_gaps
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy knowledge_gaps_workspace_insert on public.knowledge_gaps
  for insert to authenticated
  with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());
create policy knowledge_gaps_workspace_update on public.knowledge_gaps
  for update to authenticated using (public.can_edit_workspace(workspace_id))
  with check (public.can_edit_workspace(workspace_id));
create policy knowledge_gaps_workspace_delete on public.knowledge_gaps
  for delete to authenticated using (public.is_workspace_owner(workspace_id));

create or replace function public.create_reflection_with_version(
  p_workspace_id uuid,
  p_knowledge_id uuid,
  p_title text,
  p_reflection_type text,
  p_initial_understanding text,
  p_trigger_event text,
  p_discovered_problem text,
  p_error_point text,
  p_error_cause text,
  p_revised_understanding text,
  p_current_limitations text,
  p_next_action text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reflection_id uuid;
  v_summary text := coalesce(nullif(trim(p_revised_understanding), ''), nullif(trim(p_initial_understanding), ''), '');
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  if not exists (
    select 1 from public.knowledge
    where id = p_knowledge_id and workspace_id = p_workspace_id and status <> 'deleted'
  ) then
    raise exception 'knowledge_not_found';
  end if;

  insert into public.reflections (workspace_id, created_by, title, reflection_type, current_version_no, current_summary, status)
  values (p_workspace_id, v_user_id, p_title, p_reflection_type, 1, v_summary, 'active')
  returning id into v_reflection_id;

  insert into public.reflection_versions (
    workspace_id, reflection_id, version_no, initial_understanding, trigger_event,
    discovered_problem, error_point, error_cause, revised_understanding,
    current_limitations, next_action, created_by
  ) values (
    p_workspace_id, v_reflection_id, 1, coalesce(p_initial_understanding, ''),
    coalesce(p_trigger_event, ''), coalesce(p_discovered_problem, ''),
    coalesce(p_error_point, ''), coalesce(p_error_cause, ''),
    coalesce(p_revised_understanding, ''), coalesce(p_current_limitations, ''),
    coalesce(p_next_action, ''), v_user_id
  );

  insert into public.reflection_knowledge (workspace_id, reflection_id, knowledge_id, created_by)
  values (p_workspace_id, v_reflection_id, p_knowledge_id, v_user_id);

  insert into public.timeline_events (workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary)
  values (p_workspace_id, 'reflection_created', 'reflection', v_reflection_id, 'user', v_user_id, p_title, v_summary);

  return v_reflection_id;
end;
$$;

revoke execute on function public.create_reflection_with_version(uuid, uuid, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_reflection_with_version(uuid, uuid, text, text, text, text, text, text, text, text, text, text) to authenticated;

comment on table public.learning_evidence is 'Manual evidence connecting Knowledge to Notes, Projects, Experiments and Reflections.';
comment on table public.knowledge_gaps is 'Manual knowledge gaps that can become linked Task next actions.';

commit;
