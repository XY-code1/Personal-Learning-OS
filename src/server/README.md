# Server boundaries

Server code is intentionally separated from UI code.

- `modules/` owns domain rules and transactions.
- `db/` owns SQL access and generated database types.
- `auth/` owns session and workspace context.
- `storage/` owns private file metadata and signed URLs.
- `ai/` is reserved for provider adapters and RAG orchestration.
- `jobs/` is reserved for retryable asynchronous work.

Phase 1 does not add a worker or live API mutations. The directories become active as each later Phase is approved.
