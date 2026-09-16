import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const navigation = readFileSync(new URL("src/features/navigation/navigation.ts", root), "utf8");

const routes = ["dashboard", "inbox", "notes", "knowledge", "explore", "topics", "projects", "tasks", "experiments", "reflections", "timeline", "search", "ai", "import-export"];

test("every primary navigation item has a route", () => {
  for (const route of routes) {
    assert.ok(navigation.includes(`href: \"/${route}\"`), `navigation entry missing: /${route}`);
    assert.ok(existsSync(new URL(`src/app/(workspace)/${route}/page.tsx`, root)), `route file missing: /${route}`);
  }
});

test("public and auth entry points exist", () => {
  for (const route of ["src/app/page.tsx", "src/app/login/page.tsx", "src/app/register/page.tsx", "src/app/forgot-password/page.tsx", "src/app/workspace/dashboard/page.tsx"]) {
    assert.ok(existsSync(new URL(route, root)), `entry point missing: ${route}`);
  }
  assert.match(readFileSync(new URL("src/app/page.tsx", root), "utf8"), /LandingPage/);
  assert.match(readFileSync(new URL("src/proxy.ts", root), "utf8"), /workspace\/dashboard/);
});

test("the workspace migration includes the core isolation tables", () => {
  const migration = readFileSync(new URL("supabase/migrations/20260830000000_phase1_initial_schema.sql", root), "utf8");
  for (const table of ["profiles", "workspaces", "workspace_members", "notes", "knowledge", "reflections", "projects", "experiments", "tasks", "topics", "tags", "timeline_events"]) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`));
  }
});

test("the Cognitive Layer MVP reuses history, task and timeline models", () => {
  const migration = readFileSync(new URL("supabase/migrations/20260901000000_cognitive_layer_mvp.sql", root), "utf8");
  for (const table of ["learning_evidence", "knowledge_gaps"]) {
    assert.match(migration, new RegExp("create table public\\." + table + "\\s*\\("));
  }
  assert.match(migration, /reflection_versions/);
  assert.match(migration, /timeline_events/);
  assert.match(migration, /create or replace function public\.create_reflection_with_version/);
  assert.doesNotMatch(migration, /create table public\.(understanding_versions|cognitive_timeline|next_actions)\s*\(/);
});

test("Knowledge Detail exposes the Cognitive Layer MVP surface", () => {
  assert.ok(existsSync(new URL("src/app/(workspace)/knowledge/[id]/page.tsx", root)), "Knowledge Detail route missing");
  const detail = readFileSync(new URL("src/features/knowledge/knowledge-detail.tsx", root), "utf8");
  for (const label of ["Current Understanding", "Understanding history", "Evidence", "Knowledge Gaps", "Next Actions", "Cognitive timeline"]) {
    assert.match(detail, new RegExp(label));
  }
  const actions = readFileSync(new URL("src/server/cognitive/actions.ts", root), "utf8");
  for (const action of ["createLearningEvidenceAction", "createReflectionAction", "createKnowledgeGapAction", "linkKnowledgeTaskAction"]) {
    assert.match(actions, new RegExp("export async function " + action));
  }
});

test("Phase 2 keeps version sources traceable and compares real versions", () => {
  const migration = readFileSync(new URL("supabase/migrations/20260901010000_phase2_cognitive_evolution.sql", root), "utf8");
  assert.match(migration, /add column if not exists knowledge_version_id/);
  assert.match(migration, /update_knowledge_with_version_reason/);
  assert.match(migration, /你更新了对/);
  const detail = readFileSync(new URL("src/features/knowledge/knowledge-detail.tsx", root), "utf8");
  for (const label of ["Understanding V", "Source Evidence", "Reflection", "Project \\/ Experiment", "Compare Versions", "Added", "Removed", "Changed", "Reason"]) {
    assert.match(detail, new RegExp(label));
  }
  const knowledgeActions = readFileSync(new URL("src/server/knowledge/actions.ts", root), "utf8");
  assert.match(knowledgeActions, /update_knowledge_with_version_reason/);
  assert.match(readFileSync(new URL("src/features/knowledge/knowledge-workspace.tsx", root), "utf8"), /change_reason/);
});

test("auth UI includes real password and email OTP flows", () => {
  const authForm = readFileSync(new URL("src/features/auth/auth-form.tsx", root), "utf8");
  assert.match(authForm, /signInWithPassword/);
  assert.match(authForm, /signInWithOtp/);
  assert.match(authForm, /verifyOtp/);
  assert.match(authForm, /autoComplete=\"one-time-code\"/);
  assert.ok(existsSync(new URL("src/lib/supabase/bootstrap.ts", root)), "workspace bootstrap module missing");
});

test("Explore exposes the real Knowledge Constellation architecture", () => {
  assert.ok(existsSync(new URL("src/app/(workspace)/explore/page.tsx", root)), "Explore route missing");
  assert.ok(existsSync(new URL("src/server/constellation/queries.ts", root)), "Constellation query service missing");
  assert.ok(existsSync(new URL("src/features/constellation/knowledge-constellation.tsx", root)), "Constellation UI missing");
  const queries = readFileSync(new URL("src/server/constellation/queries.ts", root), "utf8");
  for (const source of ["knowledge_versions", "learning_evidence", "reflection_knowledge", "knowledge_projects", "experiment_knowledge", "knowledge_gaps", "knowledge_relations"]) {
    assert.match(queries, new RegExp(source), `Constellation source missing: ${source}`);
  }
  assert.match(queries, /getConstellationSnapshot/);
  assert.match(queries, /getKnowledgeInspector/);
  assert.match(readFileSync(new URL("src/features/constellation/constellation-utils.ts", root), "utf8"), /getKnowledgeRichnessScore/);
  assert.doesNotMatch(queries, /understanding_versions|cognitive_timeline|next_actions/);
  const inspector = readFileSync(new URL("src/features/constellation/knowledge-inspector.tsx", root), "utf8");
  for (const label of ["Current Understanding", "Understanding Versions", "Evidence", "Projects", "Experiments", "Reflections", "Open Gaps", "Related Knowledge"]) {
    assert.match(inspector, new RegExp(label), `Inspector section missing: ${label}`);
  }
  const constellation = readFileSync(new URL("src/features/constellation/knowledge-constellation.tsx", root), "utf8");
  for (const interaction of ["Search Knowledge", "Topic Filter", "Gap Filter", "fitView", "panOnDrag", "prefers-reduced-motion"]) {
    assert.match(constellation, new RegExp(interaction), `Constellation interaction missing: ${interaction}`);
  }
  assert.match(queries, /MAX_GRAPH_NODES = 500/);
  assert.doesNotMatch(constellation, /mock|random/i);
});

test("P1.5 AI Understanding Review stays proposal-first and version-safe", () => {
  const review = readFileSync(new URL("src/features/knowledge/understanding-review.tsx", root), "utf8");
  const service = readFileSync(new URL("src/server/ai/understanding-review.ts", root), "utf8");
  const provider = readFileSync(new URL("src/server/ai/provider.ts", root), "utf8");
  const action = readFileSync(new URL("src/server/ai/actions.ts", root), "utf8");
  const migration = readFileSync(new URL("supabase/migrations/20260901020000_ai_understanding_review.sql", root), "utf8");
  const route = readFileSync(new URL("src/app/api/knowledge/[id]/review/route.ts", root), "utf8");

  for (const field of ["verdict", "confidence", "correctPoints", "issues", "missingPoints", "suggestedRevision"]) {
    assert.match(review + service, new RegExp(field), `Review field missing: ${field}`);
  }
  assert.match(review, /approveUnderstandingReviewAction/);
  assert.match(review, /createKnowledgeGapAction/);
  assert.match(service, /knowledge_versions/);
  assert.match(service, /learning_evidence/);
  assert.match(provider, /AI_API_KEY|AI_PROVIDER_KEY/);
  assert.match(provider, /AI_BASE_URL/);
  assert.match(provider, /AI_MODEL_KEY/);
  assert.match(route, /reviewUnderstandingVersion/);
  assert.match(action, /current_version_no/);
  assert.match(action, /apply_approved_knowledge_review/);
  assert.match(migration, /create or replace function public\.apply_approved_knowledge_review/);
  assert.match(migration, /knowledge_review_conflict/);
  assert.match(migration, /audit_logs/);
  assert.match(migration, /timeline_events/);
  assert.doesNotMatch(review, /update_knowledge_with_version_reason|supabase\.from\("knowledge"\)\.update/);
});

test("Import and export use the existing Workspace data model", () => {
  const importRoute = readFileSync(new URL("src/app/api/portability/import/route.ts", root), "utf8");
  const exportRoute = readFileSync(new URL("src/app/api/portability/export/route.ts", root), "utf8");
  const importer = readFileSync(new URL("src/server/portability/import.ts", root), "utf8");
  const exporter = readFileSync(new URL("src/server/portability/export.ts", root), "utf8");
  assert.ok(existsSync(new URL("src/features/portability/import-export-workspace.tsx", root)));
  assert.match(importRoute, /request\.formData/);
  assert.match(exportRoute, /content-disposition/);
  assert.match(importer, /create_note_with_version/);
  assert.match(importer, /insert\(prepared\)/);
  assert.match(exporter, /portableTables/);
  assert.doesNotMatch(importer + exporter, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("AI Assistant is read-only and returns source-backed answers", () => {
  const service = readFileSync(new URL("src/server/ai/assistant.ts", root), "utf8");
  const workspace = readFileSync(new URL("src/features/ai/assistant-workspace.tsx", root), "utf8");
  assert.ok(existsSync(new URL("src/app/api/ai/ask/route.ts", root)));
  for (const table of ["notes", "knowledge", "projects", "reflections", "timeline_events"]) {
    assert.match(service, new RegExp(table));
  }
  assert.match(service, /source_ids/);
  assert.match(workspace, /Sources/);
  assert.doesNotMatch(service + workspace, /supabase\.from\(["'](?:notes|knowledge|projects|reflections|timeline_events)["']\)\.update|\.delete\(/);
});
