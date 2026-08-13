import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

test("shows native page navigation on documentation pages", async () => {
  const files = await walk(repositoryRoot);
  const mdxFiles = files.filter((file) => extname(file) === ".mdx");

  for (const file of mdxFiles) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /^hideFooterPagination:/m, file);
  }
});

test("uses the supported Tabler play icon on benchmark run cards", async () => {
  const currentOverview = await readFile(
    new URL("../benchmarks/overview.mdx", import.meta.url),
    "utf8",
  );
  const previousOverview = await readFile(
    new URL("../v1/benchmarks/overview.mdx", import.meta.url),
    "utf8",
  );

  assert.match(currentOverview, /icon="player-play"/);
  assert.match(previousOverview, /icon="player-play"/);
  assert.doesNotMatch(currentOverview, /icon="play"/);
  assert.doesNotMatch(previousOverview, /icon="play"/);
});

test("styles each page destination as a separate navigation card", async () => {
  const source = await readFile(new URL("../style.css", import.meta.url), "utf8");

  assert.match(source, /#pagination\s+a\s*\{/);
  assert.match(source, /border:\s*1px\s+solid/);
  assert.match(source, /border-radius:\s*0\.75rem/);
  assert.match(
    source,
    /#pagination\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
  );
  assert.match(
    source,
    /#pagination\s+a\[rel="next"\]\s*\{[^}]*grid-column:\s*2/s,
  );
  assert.match(
    source,
    /@media\s*\(max-width:\s*63\.999rem\)[\s\S]*#pagination\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]*#pagination\s+a\[rel="next"\]\s*\{[^}]*grid-column:\s*1/s,
  );
  assert.doesNotMatch(
    source,
    /#pagination\s*\{[^}]*(?:border|background|padding)\s*:/s,
  );
  assert.doesNotMatch(source, /(?:display:\s*none|visibility:\s*hidden)/);
  assert.doesNotMatch(source, /(?:^|\n)\s*(?:#footer|footer)\b/);
});

test("uses a wide wordmark with the product title", async () => {
  const config = JSON.parse(
    await readFile(new URL("../docs.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(config.logo, {
    light: "/logo/modal-computer-use-wordmark-light.png",
    dark: "/logo/modal-computer-use-wordmark-dark.png",
  });

  for (const path of Object.values(config.logo)) {
    const image = await readFile(new URL(`..${path}`, import.meta.url));
    assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    assert.ok(width >= height * 4, `${path} must include the icon and product title`);
  }
});
