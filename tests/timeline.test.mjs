import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);

test("Timeline is a real read model instead of a placeholder", () => {
  const page = readFileSync(new URL("src/app/(workspace)/timeline/page.tsx", root), "utf8");
  assert.doesNotMatch(page, /ModuleEmptyPage/);
  assert.match(page, /listTimelineEvents/);

  const query = readFileSync(new URL("src/server/timeline/queries.ts", root), "utf8");
  assert.match(query, /from\("timeline_events"\)/);
  assert.match(query, /workspace_id/);
  assert.match(query, /order\("occurred_at"/);

  const workspace = readFileSync(new URL("src/features/timeline/timeline-workspace.tsx", root), "utf8");
  assert.match(workspace, /useState/);
  assert.doesNotMatch(workspace, /mock|random/i);
});

test("Global Search no longer pretends to be interactive", () => {
  const page = readFileSync(new URL("src/app/(workspace)/search/page.tsx", root), "utf8");
  assert.match(page, /disabled/);
  assert.doesNotMatch(page, /<form/);
});

test("Dashboard and AI Assistant do not deep-link into placeholder modules", () => {
  const dashboard = readFileSync(new URL("src/features/dashboard/dashboard-page.tsx", root), "utf8");
  assert.doesNotMatch(dashboard, /href="\/projects"/);
  const assistant = readFileSync(new URL("src/features/ai/assistant-workspace.tsx", root), "utf8");
  assert.doesNotMatch(assistant, /"\/projects"/);
  assert.doesNotMatch(assistant, /"\/reflections"/);
});
