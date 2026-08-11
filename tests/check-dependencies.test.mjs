import assert from "node:assert/strict";
import test from "node:test";

import { validateAuditReport } from "../scripts/check-dependencies.mjs";

test("accepts a dependency graph without advisories", () => {
  assert.deepEqual(validateAuditReport({ vulnerabilities: {} }), []);
});

test("rejects every reported advisory", () => {
  const value = {
    vulnerabilities: {
      "example-package": {
        severity: "moderate",
        via: [{ url: "https://github.com/advisories/GHSA-example" }],
        nodes: ["node_modules/example-package"],
      },
    },
  };
  assert.deepEqual(validateAuditReport(value), ["example-package: moderate advisory"]);
});

test("rejects an npm audit transport error", () => {
  const value = { message: "registry unavailable", error: { summary: "" } };
  assert.match(validateAuditReport(value).join("\n"), /npm audit failed/);
});
