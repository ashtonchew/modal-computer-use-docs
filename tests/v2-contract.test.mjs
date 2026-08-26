import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

function collectPages(value, pages = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectPages(item, pages);
  } else if (typeof value === "string") {
    pages.push(value);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectPages(item, pages);
  }
  return pages;
}

test("publishes 2.x as latest and preserves every 1.x page", async () => {
  const config = JSON.parse(await source("docs.json"));
  const versions = config.navigation.versions;
  assert.deepEqual(
    versions.map(({ version, tag, default: isDefault }) => ({
      version,
      tag,
      default: isDefault ?? false,
    })),
    [
      { version: "2.x", tag: "Latest", default: true },
      { version: "1.x", tag: "Previous", default: false },
    ],
  );

  const legacyFiles = (await readdir(new URL("v1/", root), { recursive: true }))
    .filter((path) => path.endsWith(".mdx"))
    .map((path) => `v1/${path.slice(0, -4)}`)
    .sort();
  const legacyNavigation = collectPages(versions[1].tabs)
    .filter((path) => path.startsWith("v1/"))
    .sort();
  assert.deepEqual(legacyNavigation, legacyFiles);
});

test("documents the placed Step path and its measurement boundary", async () => {
  const quickstart = await source("start/quickstart.mdx");
  assert.match(quickstart, /AsyncComputerSandbox\.create/);
  assert.match(quickstart, /session_handle/);
  assert.match(quickstart, /borrow_async/);
  assert.match(quickstart, /computer\.step/);
  assert.match(quickstart, /min_containers=0/);

  const results = await source("benchmarks/current-results.mdx");
  assert.match(results, /44\.29 ms/);
  assert.match(results, /47\.14 ms/);
});

test("publishes the complete action-to-frame evidence without turning it into a ranking", async () => {
  const overview = await source("benchmarks/overview.mdx");
  assert.match(overview, /Current results/);
  assert.match(overview, /Latency evidence/);
  assert.match(overview, /Run benchmarks/);
  assert.doesNotMatch(overview, /\| Question \| Current result \|/);

  const results = await source("benchmarks/current-results.mdx");
  assert.match(results, /## Complete action-to-frame benchmarks, 11 August 2026/);
  assert.match(results, /one left click at `\(512, 384\)`/);
  assert.match(results, /used two warmups and collected 100 measured samples from each path/i);
  assert.match(results, /timer started immediately before ordered action dispatch/i);
  assert.match(results, /ended after the next full screenshot was decoded and validated/i);
  assert.match(results, /\| Path \| p50 \(ms\) \| p95 \(ms\) \|/);
  assert.match(results, /\| Modal Computer Use \/ `computer\.step\(\)` \| 43\.13 \| 46\.35 \|/);
  assert.match(results, /\| Daytona \| 1039\.59 \| 1143\.06 \|/);
  assert.match(results, /\| E2B \| 15659\.63 \| 15744\.76 \|/);
  assert.match(results, /\| Tzafon \| 264\.37 \| 346\.10 \|/);
  assert.match(results, /<div className="action-frame-results">/);

  const styles = await source("style.css");
  assert.match(styles, /\.action-frame-results th/);
  assert.match(styles, /\.action-frame-results td/);
  assert.match(results, /zero failures and zero cleanup survivors/i);
  assert.match(results, /zero retries and used zero replacement samples/i);
  assert.match(results, /A direct matched-configuration comparison requires the same caller placement/i);
  assert.match(results, /<Accordion title="Configuration and measurement details">/);
  assert.match(results, /application-owned Modal Function/);
  assert.match(results, /Both resources requested and observed `us-west-2`/i);
  assert.match(results, /Daytona 0\.175\.0/);
  assert.match(results, /E2B Desktop 2\.4\.2/);
  assert.match(results, /Tzafon 2\.44\.1/);
  assert.match(results, /1024 x 768 PNG/);
  assert.match(results, /1280 x 720 JPEG/);
  assert.match(
    results,
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/blob\/46065138902e17d2525b8a76573c4d3811064462\/docs\/benchmark-results-2026-08-11-provider-action-frame\.md/,
  );
  assert.match(
    results,
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/blob\/46065138902e17d2525b8a76573c4d3811064462\/benchmark-data\/external-provider-action-frame-2026-08-11\.json/,
  );

  const actionFrameStart = results.indexOf("## Complete action-to-frame benchmarks, 11 August 2026");
  const actionFrameSection = results.slice(actionFrameStart);
  assert.doesNotMatch(actionFrameSection, /\*\*(?:43\.13|46\.35|1039\.59|1143\.06|15659\.63|15744\.76|264\.37|346\.10)\*\*/);
  assert.doesNotMatch(actionFrameSection, /winner|fastest|outperform/i);

  const evidence = await source("benchmarks/latency-evidence.mdx");
  assert.match(evidence, /\| Claim \| Status \| Measurement boundary \| Proof \|/);
  assert.match(evidence, /Complete action-to-frame benchmark/);
  assert.match(evidence, /Eligible/);
  assert.match(evidence, /one click at `\(512, 384\)`/i);
  assert.match(evidence, /100 measured samples per path/);
  assert.match(evidence, /46065138902e17d2525b8a76573c4d3811064462/);
  assert.match(evidence, /Matched-configuration provider comparison \| Unverified/);
  assert.match(evidence, /modal-computer-use\/issues\/251/);
  assert.match(evidence, /Fresh create to first validated screenshot \| Unverified/);
  assert.match(evidence, /modal-computer-use\/issues\/252/);
});

test("publishes dated warm-operation benchmarks with complete provider details", async () => {
  const results = await source("benchmarks/current-results.mdx");
  const warmStart = results.indexOf("## Warm-operation benchmarks, 30 July 2026");
  const modalStart = results.indexOf("## Modal product benchmarks, 8 August 2026");
  const actionFrameStart = results.indexOf("## Complete action-to-frame benchmarks, 11 August 2026");
  assert.ok(warmStart >= 0);
  assert.ok(modalStart > warmStart);
  assert.ok(actionFrameStart > modalStart);

  const warm = results.slice(warmStart, modalStart);
  assert.match(warm, /six warm operations after the desktop and client connection were ready/i);
  assert.match(warm, /Each table reports 30 successful samples for each path/);
  assert.match(warm, /included transport, authentication, request handling, execution, and response collection/i);
  assert.match(warm, /excluded desktop creation and cleanup/i);
  assert.match(warm, /screenshots and clicks as separate operations/i);
  assert.match(warm, /complete action-to-frame section reports a later fused Modal Step measurement/i);
  assert.equal(
    [...warm.matchAll(/\| Path \| p50 \(ms\) \| p95 \(ms\) \| p50 ratio to Modal optimized \|/g)].length,
    6,
  );

  const expectedRows = [
    "| Modal optimized | 37.25 | 48.76 | 1.00x |",
    "| Daytona default | 563.57 | 603.79 | 15.13x |",
    "| E2B default | 198.78 | 223.20 | 5.34x |",
    "| Modal simple | 115.80 | 132.91 | 3.11x |",
    "| Tzafon default | 154.25 | 192.53 | 4.14x |",
    "| Modal optimized | 9.85 | 16.85 | 1.00x |",
    "| Daytona default | 386.40 | 394.19 | 39.22x |",
    "| E2B default | 209.86 | 213.42 | 21.30x |",
    "| Modal simple | 214.09 | 218.19 | 21.73x |",
    "| Tzafon default | 130.27 | 170.55 | 13.22x |",
    "| Modal optimized | 12.52 | 22.07 | 1.00x |",
    "| Daytona default | 1,546.74 | 1,577.44 | 123.50x |",
    "| E2B default | 860.68 | 897.95 | 68.72x |",
    "| Modal simple | 230.10 | 235.09 | 18.37x |",
    "| Tzafon default | 458.03 | 499.49 | 36.57x |",
    "| Modal optimized | 15.76 | 28.15 | 1.00x |",
    "| Daytona default | 805.55 | 812.84 | 51.11x |",
    "| E2B default | 4,083.30 | 4,156.65 | 259.08x |",
    "| Modal simple | 259.67 | 270.18 | 16.48x |",
    "| Tzafon default | 85.16 | 101.65 | 5.40x |",
    "| Modal optimized | 53.35 | 79.69 | 1.00x |",
    "| Daytona default | 5,528.38 | 5,554.88 | 103.63x |",
    "| E2B default | 40,914.66 | 41,374.28 | 766.95x |",
    "| Modal simple | 263.95 | 269.71 | 4.95x |",
    "| Tzafon default | 185.03 | 188.37 | 3.47x |",
    "| Modal optimized | 11.69 | 14.12 | 1.00x |",
    "| Daytona default | 285.33 | 294.57 | 24.40x |",
    "| E2B default | 55.90 | 69.27 | 4.78x |",
    "| Modal simple | 72.64 | 158.22 | 6.21x |",
    "| Tzafon default | 31.73 | 33.35 | 2.71x |",
  ];
  for (const row of expectedRows) {
    assert.ok(warm.includes(row), `missing warm-operation result row: ${row}`);
  }

  assert.match(warm, /Daytona 0\.175\.0/);
  assert.match(warm, /E2B Desktop 2\.3\.1/);
  assert.match(warm, /Tzafon 2\.44\.1/);
  assert.match(warm, /Tzafon returned 1280 x 720 JPEG screenshots/);
  assert.match(warm, /E2B sent four SDK requests through eight transport calls/i);
  assert.match(warm, /<Accordion title="Warm-operation path configuration and measurement details">/);
  assert.match(
    warm,
    /\[provider-default computer-use path\]\(https:\/\/www\.daytona\.io\/docs\/en\/computer-use\)/,
  );
  assert.match(
    warm,
    /\[provider-default computer-use path\]\(https:\/\/e2b\.dev\/docs\/sdk-reference\/desktop-python-sdk\/v1\.0\.1\/sandbox\)/,
  );
  assert.match(
    warm,
    /\[provider-default computer-use path\]\(https:\/\/docs\.lightcone\.ai\/guides\/operate-a-computer\)/,
  );
  assert.match(
    warm,
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/blob\/4425402dbc681133252dbc54d971ea4c95bc0ffc\/docs\/benchmark-results-2026-07-30-warm-paths\.md/,
  );
  assert.match(
    warm,
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/blob\/4425402dbc681133252dbc54d971ea4c95bc0ffc\/benchmark-data\/modal-optimized-provider-2026-07-30\.json/,
  );
  assert.match(
    warm,
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/blob\/4425402dbc681133252dbc54d971ea4c95bc0ffc\/benchmark-data\/provider-compare-coordinate-command-2026-07-30\.json/,
  );
  assert.doesNotMatch(warm, /winner|fastest|outperform/i);
  assert.doesNotMatch(results, /47\.10/);
  assert.doesNotMatch(results, /\barticle\b|\bcampaign\b|promotion run/i);

  const evidence = await source("benchmarks/latency-evidence.mdx");
  assert.match(evidence, /Warm screenshots, clicks, typing, and commands \| Historical/);
  assert.match(evidence, /modal-optimized-provider-2026-07-30\.json/);
  assert.match(evidence, /provider-compare-coordinate-command-2026-07-30\.json/);
});

test("defines the benchmark result vocabulary", async () => {
  const context = await source("CONTEXT.md");
  assert.match(context, /\*\*Warm-operation benchmark\*\*/);
  assert.match(context, /\*\*Modal product benchmark\*\*/);
  assert.match(context, /\*\*Complete action-to-frame benchmark\*\*/);
  assert.match(context, /Desktop creation and cleanup are outside its timer/);
  assert.match(context, /ordered action dispatch through the next decoded and validated screenshot/);
});

test("keeps active benchmark prose direct", async () => {
  for (const path of [
    "benchmarks/overview.mdx",
    "benchmarks/current-results.mdx",
    "benchmarks/latency-evidence.mdx",
  ]) {
    const page = await source(path);
    assert.doesNotMatch(page, /\bnot (?:just|only|merely)\b/i);
    assert.doesNotMatch(page, /\bit'?s not\b[^.]*\bit'?s\b/i);
    assert.doesNotMatch(page, /\barticle\b|\bcampaign\b/i);
  }
});

test("keeps responsive benchmark tables usable by keyboard", async () => {
  const script = await source("table-keyboard-scroll.js");
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /role=\"region\"/);
  assert.match(script, /querySelector\("table"\)/);
  assert.match(script, /scrollWidth <= region\.clientWidth/);
  assert.match(script, /event\.preventDefault\(\)/);
});

test("keeps current guides product-led and historical arithmetic scoped", async () => {
  const home = await source("index.mdx");
  assert.match(home, /title: "Build computer-use agents on Modal"/);
  assert.match(home, /computer\.step/);
  assert.doesNotMatch(home, /47\.10|37\.25|9\.85|44\.29/);
  assert.doesNotMatch(home, /The 2\.x path/);

  const installation = await source("start/installation.mdx");
  assert.match(installation, /title: "Install Modal Computer Use"/);
  assert.doesNotMatch(installation, /Install Modal Computer Use 2\.x/);
  assert.doesNotMatch(installation, /description: ".*2\.x/);

  const activeFiles = (await readdir(root, { recursive: true }))
    .filter((path) => path.endsWith(".mdx"))
    .filter((path) => !path.startsWith("v1/"));
  const derivedArithmeticPages = [];
  const historicalMeasurementPages = [];
  for (const path of activeFiles) {
    const page = await source(path);
    if (/47\.10/.test(page)) {
      derivedArithmeticPages.push(path);
    }
    if (/37\.25|9\.85/.test(page)) {
      historicalMeasurementPages.push(path);
    }
  }
  assert.deepEqual(derivedArithmeticPages, []);
  assert.deepEqual(historicalMeasurementPages, ["benchmarks/current-results.mdx"]);
});

test("documents current defaults and opt-in runtime features", async () => {
  const configuration = await source("reference/configuration.mdx");
  assert.match(configuration, /100.*weighted tokens per second/);
  assert.match(configuration, /400.*weighted tokens/);
  assert.match(configuration, /Screenshot source \| `mss`/);
  assert.match(configuration, /`x11-shm`.*fails readiness/s);

  const image = await source("build/browser-automation.mdx");
  assert.match(image, /ImageReleaseSpec/);
  assert.match(image, /publish_image_release/);
  assert.match(image, /resolve_release_image/);
  assert.match(image, /4cb098207053931c2e6e693ce87f7f6e16ab215a/);

  const gateway = await source("build/run-gateway.mdx");
  assert.match(gateway, /stable run ID/i);
  assert.match(gateway, /idempotency/i);
  assert.match(gateway, /cleanup/i);
});
