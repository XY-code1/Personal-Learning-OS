-- Personal Learning OS / Phase 2: Cognitive Evolution
-- Additive only: preserve existing versions, evidence, RPCs and old clients.

begin;

alter table public.learning_evidence
  add column if not exists knowledge_version_id uuid
  references public.knowledge_versions(id) on delete set null;

create index if not exists learning_evidence_knowledge_version_idx
  on public.learning_evidence (knowledge_version_id, created_at desc);

create or replace function public.update_knowledge_with_version_reason(
  p_workspace_id uuid,
  p_knowledge_id uuid,
  p_title text,
  p_summary text,
  p_body_markdown text,
  p_category text,
  p_mastery_level smallint,
  p_change_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version integer;
  v_reason text := coalesce(nullif(trim(p_change_reason), ''), '用户更新知识卡片');
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  select current_version_no into v_current_version
  from public.knowledge
  where id = p_knowledge_id and workspace_id = p_workspace_id and status <> 'deleted'
  for update;
  if not found then raise exception 'knowledge_not_found'; end if;

  insert into public.knowledge_versions (
    workspace_id, knowledge_id, version_no, title, summary, body_markdown,
    category, mastery_level, change_reason, created_by
  ) values (
    p_workspace_id, p_knowledge_id, v_current_version + 1, p_title,
    coalesce(p_summary, ''), coalesce(p_body_markdown, ''), coalesce(p_category, ''),
    p_mastery_level, v_reason, v_user_id
  );

  update public.knowledge
  set title = p_title,
      summary = coalesce(p_summary, ''),
      body_markdown = coalesce(p_body_markdown, ''),
      category = coalesce(p_category, ''),
      mastery_level = p_mastery_level,
      current_version_no = v_current_version + 1
  where id = p_knowledge_id and workspace_id = p_workspace_id;

  insert into public.timeline_events (
    workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary
  ) values (
    p_workspace_id,
    'knowledge_updated',
    'knowledge',
    p_knowledge_id,
    'user',
    v_user_id,
    '你更新了对「' || coalesce(nullif(trim(p_title), ''), '这条知识') || '」的理解',
    v_reason
  );

  return p_knowledge_id;
end;
$$;

revoke execute on function public.update_knowledge_with_version_reason(uuid, uuid, text, text, text, text, smallint, text) from public;
grant execute on function public.update_knowledge_with_version_reason(uuid, uuid, text, text, text, text, smallint, text) to authenticated;

comment on column public.learning_evidence.knowledge_version_id is 'Optional exact Knowledge understanding version supported by Phase 2.';

commit;
