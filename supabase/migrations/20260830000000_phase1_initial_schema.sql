-- Personal Learning OS / Phase 1
-- PostgreSQL + Supabase. All personal records are scoped to a workspace.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  bio text not null default '',
  learning_context_markdown text not null default '',
  timezone text not null default 'Asia/Shanghai',
  locale text not null default 'zh-CN',
  preferences_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null,
  settings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, slug)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  note_type text not null default 'markdown' check (note_type in ('quick', 'journal', 'markdown', 'outline')),
  title text not null default '',
  content_markdown text not null default '',
  editor_jsonb jsonb,
  excerpt text not null default '',
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  captured_at timestamptz not null default timezone('utc', now()),
  last_opened_at timestamptz,
  current_version_no integer not null default 1 check (current_version_no > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  title text not null default '',
  content_markdown text not null default '',
  editor_jsonb jsonb,
  save_source text not null default 'user' check (save_source in ('user', 'ai_approved', 'import')),
  change_summary text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (note_id, version_no)
);

create table public.knowledge (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  summary text not null default '',
  body_markdown text not null default '',
  category text not null default '',
  mastery_level smallint not null default 0 check (mastery_level between 0 and 5),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived', 'deleted')),
  current_version_no integer not null default 1 check (current_version_no > 0),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  title text not null,
  summary text not null default '',
  body_markdown text not null default '',
  category text not null default '',
  mastery_level smallint not null default 0 check (mastery_level between 0 and 5),
  change_reason text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (knowledge_id, version_no)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null,
  goal text not null default '',
  description text not null default '',
  tech_stack_jsonb jsonb not null default '[]'::jsonb,
  status text not null default 'idea' check (status in ('idea', 'active', 'paused', 'completed', 'archived', 'deleted')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  target_date date,
  repo_url text,
  last_activity_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (workspace_id, slug)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null default '',
  task_kind text not null default 'todo' check (task_kind in ('todo', 'learning', 'project', 'problem', 'bug')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority smallint not null default 2 check (priority between 1 and 4),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  goal text not null default '',
  environment_markdown text not null default '',
  procedure_markdown text not null default '',
  result_markdown text not null default '',
  problem_markdown text not null default '',
  solution_markdown text not null default '',
  conclusion_markdown text not null default '',
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'failed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  reflection_type text not null default 'cognitive' check (reflection_type in ('cognitive', 'error_review', 'project_review', 'weekly')),
  current_version_no integer not null default 1 check (current_version_no > 0),
  current_summary text not null default '',
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  started_at timestamptz,
  last_reflected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.reflection_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  initial_understanding text not null default '',
  trigger_event text not null default '',
  discovered_problem text not null default '',
  error_point text not null default '',
  error_cause text not null default '',
  revised_understanding text not null default '',
  current_limitations text not null default '',
  next_action text not null default '',
  evidence_markdown text not null default '',
  change_summary text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (reflection_id, version_no)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null,
  description text not null default '',
  color text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, slug)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, slug)
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  actor_type text not null default 'user' check (actor_type in ('user', 'ai', 'system')),
  actor_id uuid references auth.users(id) on delete set null,
  title text not null,
  summary text not null default '',
  payload_jsonb jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_type text not null default 'user' check (actor_type in ('user', 'ai', 'system')),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  request_id text,
  before_jsonb jsonb,
  after_jsonb jsonb,
  reason text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.note_topics (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, note_id, topic_id)
);

create table public.knowledge_topics (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, knowledge_id, topic_id)
);

create table public.note_tags (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, note_id, tag_id)
);

create table public.knowledge_tags (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, knowledge_id, tag_id)
);

create table public.note_knowledge (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, note_id, knowledge_id)
);

create table public.note_projects (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, note_id, project_id)
);

create table public.note_tasks (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, note_id, task_id)
);

create table public.knowledge_projects (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, knowledge_id, project_id)
);

create table public.knowledge_tasks (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, knowledge_id, task_id)
);

create table public.knowledge_relations (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  related_knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  relation_type text not null check (relation_type in ('supports', 'contradicts', 'extends', 'example', 'prerequisite')),
  weight numeric(5, 4) not null default 1 check (weight between 0 and 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, knowledge_id, related_knowledge_id),
  check (knowledge_id <> related_knowledge_id)
);

create table public.experiment_notes (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, experiment_id, note_id)
);

create table public.experiment_knowledge (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, experiment_id, knowledge_id)
);

create table public.reflection_topics (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, reflection_id, topic_id)
);

create table public.reflection_notes (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, reflection_id, note_id)
);

create table public.reflection_knowledge (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  knowledge_id uuid not null references public.knowledge(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, reflection_id, knowledge_id)
);

create table public.reflection_projects (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, reflection_id, project_id)
);

create table public.reflection_tasks (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, reflection_id, task_id)
);

create index notes_workspace_updated_idx on public.notes (workspace_id, updated_at desc);
create index knowledge_workspace_updated_idx on public.knowledge (workspace_id, updated_at desc);
create index projects_workspace_updated_idx on public.projects (workspace_id, updated_at desc);
create index tasks_workspace_status_idx on public.tasks (workspace_id, status, due_at);
create index experiments_workspace_updated_idx on public.experiments (workspace_id, updated_at desc);
create index reflections_workspace_updated_idx on public.reflections (workspace_id, updated_at desc);
create index reflection_versions_timeline_idx on public.reflection_versions (reflection_id, version_no desc);
create index timeline_events_workspace_occurred_idx on public.timeline_events (workspace_id, occurred_at desc);
create index audit_logs_workspace_created_idx on public.audit_logs (workspace_id, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute procedure public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes for each row execute procedure public.set_updated_at();
create trigger knowledge_set_updated_at before update on public.knowledge for each row execute procedure public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();
create trigger experiments_set_updated_at before update on public.experiments for each row execute procedure public.set_updated_at();
create trigger reflections_set_updated_at before update on public.reflections for each row execute procedure public.set_updated_at();
create trigger topics_set_updated_at before update on public.topics for each row execute procedure public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags for each row execute procedure public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_workspace(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.can_edit_workspace(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

alter table public.profiles enable row level security;
create policy profiles_self_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.workspaces enable row level security;
create policy workspaces_member_select on public.workspaces for select to authenticated using (owner_id = auth.uid() or public.is_workspace_member(id));
create policy workspaces_owner_insert on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy workspaces_owner_update on public.workspaces for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy workspaces_owner_delete on public.workspaces for delete to authenticated using (owner_id = auth.uid());

alter table public.workspace_members enable row level security;
create policy workspace_members_select on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy workspace_members_owner_insert on public.workspace_members for insert to authenticated with check (
  public.is_workspace_owner(workspace_id)
  or (
    user_id = auth.uid()
    and exists (
      select 1
      from public.workspaces
      where id = workspace_id
        and owner_id = auth.uid()
    )
  )
);
create policy workspace_members_owner_update on public.workspace_members for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy workspace_members_owner_delete on public.workspace_members for delete to authenticated using (public.is_workspace_owner(workspace_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'notes', 'note_versions', 'knowledge', 'knowledge_versions', 'projects', 'tasks',
    'experiments', 'reflections', 'reflection_versions', 'topics', 'tags',
    'note_topics', 'knowledge_topics', 'note_tags', 'knowledge_tags', 'note_knowledge',
    'note_projects', 'note_tasks', 'knowledge_projects', 'knowledge_tasks',
    'knowledge_relations', 'experiment_notes', 'experiment_knowledge', 'reflection_topics',
    'reflection_notes', 'reflection_knowledge', 'reflection_projects', 'reflection_tasks',
    'timeline_events', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', table_name || '_workspace_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_edit_workspace(workspace_id))', table_name || '_workspace_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_edit_workspace(workspace_id)) with check (public.can_edit_workspace(workspace_id))', table_name || '_workspace_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_workspace_owner(workspace_id))', table_name || '_workspace_delete', table_name);
  end loop;
end;
$$;

comment on table public.reflections is 'A continuous reflection thread; history lives in reflection_versions.';
comment on table public.reflection_versions is 'Append-only cognitive versions such as v1, v2, and v3.';
comment on table public.timeline_events is 'A display projection of important learning and business events.';
comment on table public.audit_logs is 'Append-only record of meaningful user, AI, and system changes.';
