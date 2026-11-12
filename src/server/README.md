# Server boundaries

Server code is intentionally separated from UI code. The server tree is organised by domain rather than by technical layer:

- `ai/` owns the provider adapter boundary, the read-only assistant, and the Understanding Review flow.
- `cognitive/` owns evidence, reflection, and knowledge-gap rules.
- `constellation/` owns the Knowledge Constellation read model.
- `dashboard/` owns dashboard aggregations.
- `knowledge/`, `notes/`, `tasks/`, and `timeline/` own their domain rules and queries.
- `portability/` owns import/export validation and writes.
- `workspace/` owns session to workspace resolution.

Shared infrastructure lives outside this tree: Supabase clients in `src/lib/supabase/`, domain types in `src/types/`, and cross-cutting conventions in `AGENTS.md`.

Route handlers in `src/app/api/` stay thin: they parse and validate input, then call a server module. Keep transactions, RLS-aware queries, and business rules inside the domain modules.
