import { spawnSync } from "node:child_process";

const audit = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
if (!audit.stdout) {
  console.error(audit.stderr || "npm audit returned no report");
  process.exit(1);
}

const report = JSON.parse(audit.stdout);
const vulnerabilities = report.vulnerabilities ?? {};
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

const jsYaml = vulnerabilities["js-yaml"];
if (
  !jsYaml ||
  jsYaml.nodes?.some(
    (node) => node !== "node_modules/front-matter/node_modules/js-yaml",
  )
) {
  failures.push("js-yaml advisory is not isolated to the Mintlify frontmatter parser");
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(
  "Accepted the reviewed Mintlify frontmatter parser advisory behind the strict metadata source gate.",
);
