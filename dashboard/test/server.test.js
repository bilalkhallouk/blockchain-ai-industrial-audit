const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { resolvePublicPath } = require("../server");

test("resolves root to dashboard index", () => {
  const resolved = resolvePublicPath("/");
  assert.equal(path.basename(resolved), "index.html");
});

test("rejects path traversal", () => {
  const resolved = resolvePublicPath("/../README.md");
  assert.equal(resolved, null);
});
