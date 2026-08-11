import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function validateAuditReport(report) {
  if (report.error || report.message) {
    return [`npm audit failed: ${report.message ?? report.error.summary ?? "unknown error"}`];
  }

  return Object.entries(report.vulnerabilities ?? {}).map(
    ([name, vulnerability]) => `${name}: ${vulnerability.severity} advisory`,
  );
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
  console.log("npm audit found no vulnerabilities.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
