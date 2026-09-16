-- Personal Learning OS / P1.5: AI Understanding Review
-- Additive only. Reviews are ephemeral proposals; only explicit user approval
-- reaches this transaction and creates a normal append-only Knowledge version.

begin;

create or replace function public.apply_approved_knowledge_review(
  p_workspace_id uuid,
  p_knowledge_id uuid,
  p_expected_version_id uuid,
  p_expected_version_no integer,
  p_revised_body_markdown text,
  p_change_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version_id uuid;
  v_current_version_no integer;
  v_title text;
  v_summary text;
  v_category text;
  v_mastery_level smallint;
  v_reason text := coalesce(nullif(trim(p_change_reason), ''), '用户确认了 AI Understanding Review 建议');
  v_new_version_id uuid;
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  if p_expected_version_id is null
    or p_expected_version_no is null
    or nullif(trim(coalesce(p_revised_body_markdown, '')), '') is null
    or char_length(p_revised_body_markdown) > 200000
    or char_length(coalesce(p_change_reason, '')) > 1000 then
    raise exception 'review_payload_invalid';
  end if;

  select k.current_version_no, k.title, k.summary, k.category, k.mastery_level,
         kv.id
  into v_current_version_no, v_title, v_summary, v_category, v_mastery_level,
       v_current_version_id
  from public.knowledge k
  join public.knowledge_versions kv
    on kv.knowledge_id = k.id
   and kv.workspace_id = k.workspace_id
   and kv.version_no = k.current_version_no
  where k.id = p_knowledge_id
    and k.workspace_id = p_workspace_id
    and k.status <> 'deleted'
  for update;

  if not found then raise exception 'knowledge_not_found'; end if;

  if v_current_version_no <> p_expected_version_no
    or v_current_version_id <> p_expected_version_id then
    raise exception 'knowledge_review_conflict';
  end if;

  insert into public.knowledge_versions (
    workspace_id, knowledge_id, version_no, title, summary, body_markdown,
    category, mastery_level, change_reason, created_by
  ) values (
    p_workspace_id, p_knowledge_id, v_current_version_no + 1, v_title,
    coalesce(v_summary, ''), trim(p_revised_body_markdown), coalesce(v_category, ''),
    v_mastery_level, v_reason, v_user_id
  ) returning id into v_new_version_id;

  update public.knowledge
  set body_markdown = trim(p_revised_body_markdown),
      current_version_no = v_current_version_no + 1
  where id = p_knowledge_id and workspace_id = p_workspace_id;

  insert into public.timeline_events (
    workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary
  ) values (
    p_workspace_id,
    'knowledge_review_approved',
    'knowledge',
    p_knowledge_id,
    'user',
    v_user_id,
    '你确认了 AI 对「' || coalesce(nullif(trim(v_title), ''), '这条知识') || '」的修订建议',
    v_reason
  );

  insert into public.audit_logs (
    workspace_id, actor_type, actor_id, action, entity_type, entity_id,
    before_jsonb, after_jsonb, reason
  ) values (
    p_workspace_id,
    'user',
    v_user_id,
    'ai_understanding_review_approved',
    'knowledge',
    p_knowledge_id,
    jsonb_build_object('knowledge_version_id', v_current_version_id, 'version_no', v_current_version_no),
    jsonb_build_object('knowledge_version_id', v_new_version_id, 'version_no', v_current_version_no + 1, 'source', 'ai_understanding_review'),
    v_reason
  );

  return v_new_version_id;
end;
$$;

revoke execute on function public.apply_approved_knowledge_review(uuid, uuid, uuid, integer, text, text) from public;
grant execute on function public.apply_approved_knowledge_review(uuid, uuid, uuid, integer, text, text) to authenticated;

comment on function public.apply_approved_knowledge_review(uuid, uuid, uuid, integer, text, text)
  is 'Apply an explicitly user-approved AI Understanding Review after rechecking the current Knowledge version in a transaction.';

commit;
