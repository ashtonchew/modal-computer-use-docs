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

test("keeps current guides product-led and historical arithmetic out of current pages", async () => {
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
  const historicalArithmeticPages = [];
  for (const path of activeFiles) {
    if (/47\.10|37\.25|9\.85/.test(await source(path))) {
      historicalArithmeticPages.push(path);
    }
  }
  assert.deepEqual(historicalArithmeticPages, []);
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
