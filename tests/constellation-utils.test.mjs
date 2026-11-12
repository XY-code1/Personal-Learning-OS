import assert from "node:assert/strict";
import test from "node:test";

import {
  getConstellationPosition,
  getKnowledgeNodeSize,
  getKnowledgeRichnessScore,
  matchesKnowledgeSearch,
} from "../src/features/constellation/constellation-utils.ts";

const baseNode = { versionCount: 1, evidenceCount: 0, reflectionCount: 0, projectCount: 0, experimentCount: 0 };

test("knowledge richness weights evidence and reflection double", () => {
  assert.equal(getKnowledgeRichnessScore(baseNode), 1);
  assert.equal(getKnowledgeRichnessScore({ ...baseNode, evidenceCount: 2 }), 5);
  assert.equal(getKnowledgeRichnessScore({ ...baseNode, reflectionCount: 2 }), 5);
  assert.equal(getKnowledgeRichnessScore({ ...baseNode, projectCount: 3, experimentCount: 1 }), 5);
});

test("knowledge node size stays within the legible range", () => {
  assert.equal(getKnowledgeNodeSize(baseNode), 124);
  assert.equal(getKnowledgeNodeSize({ ...baseNode, versionCount: 0 }), 116);
  assert.equal(getKnowledgeNodeSize({ ...baseNode, versionCount: 100 }), 196);
});

test("constellation positions form a grid with at least three columns", () => {
  assert.deepEqual(getConstellationPosition(0, 10), { x: 0, y: 0 });
  const fourth = getConstellationPosition(3, 10);
  assert.equal(fourth.y, 0, "first row should stay on the same line");
  assert.ok(fourth.x > 0, "first row should advance along x");
  const later = getConstellationPosition(10, 10);
  assert.ok(later.y > 0, "later nodes should wrap to a new row");
  assert.ok(later.x >= 0, "x should never be negative");
});

test("knowledge search is case-insensitive and ignores surrounding whitespace", () => {
  const node = { title: "Spaced Repetition", summary: "Make recall durable", currentUnderstanding: "Review at increasing intervals" };
  assert.equal(matchesKnowledgeSearch(node, "spaced"), true);
  assert.equal(matchesKnowledgeSearch(node, "  DURABLE  "), true);
  assert.equal(matchesKnowledgeSearch(node, "increasing"), true);
  assert.equal(matchesKnowledgeSearch(node, "   "), true);
  assert.equal(matchesKnowledgeSearch(node, "zzz"), false);
});
