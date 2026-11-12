-- Personal Learning OS / Core insert creator integrity
-- Application users must insert core records and relations with their own
-- user id as created_by. Import flows and RPCs already write created_by =
-- auth.uid(); this closes the remaining insert policies.

begin;

do $$
declare
  t text;
begin
  foreach t in array array[
    'projects', 'experiments', 'reflections', 'topics', 'tags',
    'note_topics', 'knowledge_topics', 'note_tags', 'knowledge_tags',
    'note_knowledge', 'note_projects', 'note_tasks',
    'knowledge_projects', 'knowledge_tasks', 'knowledge_relations',
    'experiment_notes', 'experiment_knowledge',
    'reflection_topics', 'reflection_notes', 'reflection_knowledge',
    'reflection_projects', 'reflection_tasks'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_workspace_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid())',
      t || '_workspace_insert',
      t
    );
  end loop;
end;
$$;

commit;
