-- Phase A transaction boundaries.
-- These functions keep an entity and its append-only first/current version
-- together. They run as the authenticated caller and remain protected by RLS.

begin;

create or replace function public.create_note_with_version(
  p_workspace_id uuid,
  p_note_type text,
  p_title text,
  p_content_markdown text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_note_id uuid;
  v_excerpt text := left(regexp_replace(trim(p_content_markdown), '\s+', ' ', 'g'), 240);
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  insert into public.notes (workspace_id, created_by, note_type, title, content_markdown, excerpt)
  values (p_workspace_id, v_user_id, p_note_type, coalesce(p_title, ''), p_content_markdown, v_excerpt)
  returning id into v_note_id;

  insert into public.note_versions (workspace_id, note_id, version_no, title, content_markdown, save_source, created_by)
  values (p_workspace_id, v_note_id, 1, coalesce(p_title, ''), p_content_markdown, 'user', v_user_id);

  insert into public.timeline_events (workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary)
  values (p_workspace_id, 'note_created', 'note', v_note_id, 'user', v_user_id, coalesce(nullif(p_title, ''), '新增一条笔记'), v_excerpt);

  return v_note_id;
end;
$$;

create or replace function public.update_note_with_version(
  p_workspace_id uuid,
  p_note_id uuid,
  p_note_type text,
  p_title text,
  p_content_markdown text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version integer;
  v_excerpt text := left(regexp_replace(trim(p_content_markdown), '\s+', ' ', 'g'), 240);
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  select current_version_no into v_current_version
  from public.notes
  where id = p_note_id and workspace_id = p_workspace_id and status <> 'deleted'
  for update;
  if not found then raise exception 'note_not_found'; end if;

  insert into public.note_versions (workspace_id, note_id, version_no, title, content_markdown, save_source, change_summary, created_by)
  values (p_workspace_id, p_note_id, v_current_version + 1, coalesce(p_title, ''), p_content_markdown, 'user', '用户更新笔记', v_user_id);

  update public.notes
  set title = coalesce(p_title, ''), content_markdown = p_content_markdown, excerpt = v_excerpt,
      note_type = p_note_type, current_version_no = v_current_version + 1
  where id = p_note_id and workspace_id = p_workspace_id;

  insert into public.timeline_events (workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary)
  values (p_workspace_id, 'note_updated', 'note', p_note_id, 'user', v_user_id, coalesce(nullif(p_title, ''), '更新了一条笔记'), v_excerpt);
  return p_note_id;
end;
$$;

create or replace function public.create_knowledge_with_version(
  p_workspace_id uuid,
  p_title text,
  p_summary text,
  p_body_markdown text,
  p_category text,
  p_mastery_level smallint
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_knowledge_id uuid;
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  insert into public.knowledge (workspace_id, created_by, title, summary, body_markdown, category, mastery_level, current_version_no)
  values (p_workspace_id, v_user_id, p_title, coalesce(p_summary, ''), coalesce(p_body_markdown, ''), coalesce(p_category, ''), p_mastery_level, 1)
  returning id into v_knowledge_id;

  insert into public.knowledge_versions (workspace_id, knowledge_id, version_no, title, summary, body_markdown, category, mastery_level, change_reason, created_by)
  values (p_workspace_id, v_knowledge_id, 1, p_title, coalesce(p_summary, ''), coalesce(p_body_markdown, ''), coalesce(p_category, ''), p_mastery_level, '首次建立知识卡片', v_user_id);

  insert into public.timeline_events (workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary)
  values (p_workspace_id, 'knowledge_created', 'knowledge', v_knowledge_id, 'user', v_user_id, p_title, coalesce(p_summary, ''));
  return v_knowledge_id;
end;
$$;

create or replace function public.update_knowledge_with_version(
  p_workspace_id uuid,
  p_knowledge_id uuid,
  p_title text,
  p_summary text,
  p_body_markdown text,
  p_category text,
  p_mastery_level smallint
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version integer;
begin
  if v_user_id is null or not public.can_edit_workspace(p_workspace_id) then
    raise exception 'workspace_write_not_allowed';
  end if;

  select current_version_no into v_current_version
  from public.knowledge
  where id = p_knowledge_id and workspace_id = p_workspace_id and status <> 'deleted'
  for update;
  if not found then raise exception 'knowledge_not_found'; end if;

  insert into public.knowledge_versions (workspace_id, knowledge_id, version_no, title, summary, body_markdown, category, mastery_level, change_reason, created_by)
  values (p_workspace_id, p_knowledge_id, v_current_version + 1, p_title, coalesce(p_summary, ''), coalesce(p_body_markdown, ''), coalesce(p_category, ''), p_mastery_level, '用户更新知识卡片', v_user_id);

  update public.knowledge
  set title = p_title, summary = coalesce(p_summary, ''), body_markdown = coalesce(p_body_markdown, ''),
      category = coalesce(p_category, ''), mastery_level = p_mastery_level, current_version_no = v_current_version + 1
  where id = p_knowledge_id and workspace_id = p_workspace_id;

  insert into public.timeline_events (workspace_id, event_type, entity_type, entity_id, actor_type, actor_id, title, summary)
  values (p_workspace_id, 'knowledge_updated', 'knowledge', p_knowledge_id, 'user', v_user_id, p_title, coalesce(p_summary, ''));
  return p_knowledge_id;
end;
$$;

revoke execute on function public.create_note_with_version(uuid, text, text, text) from public;
revoke execute on function public.update_note_with_version(uuid, uuid, text, text, text) from public;
revoke execute on function public.create_knowledge_with_version(uuid, text, text, text, text, smallint) from public;
revoke execute on function public.update_knowledge_with_version(uuid, uuid, text, text, text, text, smallint) from public;
grant execute on function public.create_note_with_version(uuid, text, text, text) to authenticated;
grant execute on function public.update_note_with_version(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.create_knowledge_with_version(uuid, text, text, text, text, smallint) to authenticated;
grant execute on function public.update_knowledge_with_version(uuid, uuid, text, text, text, text, smallint) to authenticated;

commit;
