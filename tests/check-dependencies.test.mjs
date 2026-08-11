import assert from "node:assert/strict";
import test from "node:test";

import { validateAuditReport } from "../scripts/check-dependencies.mjs";

const advisories = [
  "https://github.com/advisories/GHSA-52cp-r559-cp3m",
  "https://github.com/advisories/GHSA-h67p-54hq-rp68",
];

function report(overrides = {}) {
  return {
    vulnerabilities: {
      "js-yaml": {
        severity: "high",
        via: advisories.map((url) => ({ url })),
        nodes: ["node_modules/front-matter/node_modules/js-yaml"],
      },
      ...overrides,
    },
  };
}

test("accepts only the reviewed advisory at the reviewed dependency path", () => {
  assert.deepEqual(validateAuditReport(report()), []);
});

test("rejects a new advisory", () => {
  const value = report({
    unexpected: {
      severity: "high",
      via: [{ url: "https://github.com/advisories/GHSA-new" }],
      nodes: ["node_modules/unexpected"],
    },
  });
  assert.match(validateAuditReport(value).join("\n"), /unreviewed/);
});

test("rejects a critical advisory", () => {
  const value = report({
    mint: { severity: "critical", via: [], nodes: ["node_modules/mint"] },
  });
  assert.match(validateAuditReport(value).join("\n"), /critical advisories are not allowed/);
});

test("rejects a changed js-yaml dependency path", () => {
  const value = report();
  value.vulnerabilities["js-yaml"].nodes = ["node_modules/js-yaml"];
  assert.match(validateAuditReport(value).join("\n"), /not isolated/);
});

test("rejects a stale advisory exception", () => {
  const value = report();
  value.vulnerabilities["js-yaml"].via.pop();
  assert.match(validateAuditReport(value).join("\n"), /stale advisory exception/);
});

test("rejects an npm audit transport error", () => {
  const value = { message: "registry unavailable", error: { summary: "" } };
  assert.match(validateAuditReport(value).join("\n"), /npm audit failed/);
});
