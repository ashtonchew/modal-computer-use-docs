import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const permittedChain = new Set([
  "@mintlify/cli",
  "@mintlify/common",
  "@mintlify/link-rot",
  "@mintlify/prebuild",
  "@mintlify/previewing",
  "@mintlify/scraping",
  "front-matter",
  "js-yaml",
  "mint",
]);
const permittedAdvisories = new Set([
  "https://github.com/advisories/GHSA-52cp-r559-cp3m",
  "https://github.com/advisories/GHSA-h67p-54hq-rp68",
]);
const permittedJsYamlNode = "node_modules/front-matter/node_modules/js-yaml";

export function validateAuditReport(report) {
  if (report.error || report.message) {
    return [`npm audit failed: ${report.message ?? report.error.summary ?? "unknown error"}`];
  }
  const vulnerabilities = report.vulnerabilities ?? {};
  const failures = [];
  const observedAdvisories = new Set();

  for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    if (!permittedChain.has(name)) {
      failures.push(`${name}: unreviewed ${vulnerability.severity} advisory`);
    }
    if (vulnerability.severity === "critical") {
      failures.push(`${name}: critical advisories are not allowed`);
    }
    for (const cause of vulnerability.via ?? []) {
      if (typeof cause === "object" && cause.url) observedAdvisories.add(cause.url);
    }
  }

  for (const advisory of observedAdvisories) {
    if (!permittedAdvisories.has(advisory)) failures.push(`unreviewed advisory: ${advisory}`);
  }
  for (const advisory of permittedAdvisories) {
    if (!observedAdvisories.has(advisory)) failures.push(`stale advisory exception: ${advisory}`);
  }

  const nodes = vulnerabilities["js-yaml"]?.nodes;
  if (!Array.isArray(nodes) || nodes.length !== 1 || nodes[0] !== permittedJsYamlNode) {
    failures.push("js-yaml advisory is not isolated to the Mintlify frontmatter parser");
  }
  return failures;
}

function readAuditReport() {
  const audit = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (!audit.stdout) throw new Error(audit.stderr || "npm audit returned no report");
  return JSON.parse(audit.stdout);
}

function main() {
  let report;
  try {
    report = readAuditReport();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  const failures = validateAuditReport(report);
  if (failures.length > 0) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(
    "Accepted the reviewed Mintlify frontmatter parser advisory behind the strict metadata source gate.",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
