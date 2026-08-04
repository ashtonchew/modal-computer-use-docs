import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { validateDocs } from "../scripts/check-docs.mjs";

const frontmatter = `---
title: "Test"
sidebarTitle: "Test"
description: "Test page."
---
`;

async function fixture(source = `${frontmatter}\nValid page.\n`) {
  const root = await mkdtemp(join(tmpdir(), "modal-computer-use-docs-"));
  await mkdir(join(root, "operate"), { recursive: true });
  await writeFile(join(root, "operate", "performance.mdx"), source);
  await writeFile(
    join(root, "docs.json"),
    JSON.stringify({ navigation: { pages: ["operate/performance"] }, redirects: [] }),
  );
  return root;
}

test("accepts a valid documentation tree", async (context) => {
  const root = await fixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual((await validateDocs(root)).errors, []);
});

test("rejects a navigated page that hides footer pagination", async (context) => {
  const metadata = frontmatter.replace(
    "description: \"Test page.\"",
    "description: \"Test page.\"\nhideFooterPagination: true",
  );
  const root = await fixture(`${metadata}\nValid page.\n`);
  context.after(() => rm(root, { recursive: true, force: true }));
  assert.match(
    (await validateDocs(root)).errors.join("\n"),
    /remove hideFooterPagination to show previous and next page links/,
  );
});

test("rejects an unsupported false footer pagination value", async (context) => {
  const metadata = frontmatter.replace(
    "description: \"Test page.\"",
    "description: \"Test page.\"\nhideFooterPagination: false",
  );
  const root = await fixture(`${metadata}\nValid page.\n`);
  context.after(() => rm(root, { recursive: true, force: true }));
  assert.match(
    (await validateDocs(root)).errors.join("\n"),
    /remove hideFooterPagination to show previous and next page links/,
  );
});

test("rejects metadata that can reach unsafe YAML features", async (context) => {
  const root = await fixture(`---
title: "Test"
sidebarTitle: "Test"
description: "Test page."
alias: &value unsafe
---
`);
  context.after(() => rm(root, { recursive: true, force: true }));
  assert.match((await validateDocs(root)).errors.join("\n"), /use quoted/);
});

test("rejects missing navigation pages", async (context) => {
  const root = await fixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "docs.json"),
    JSON.stringify({ navigation: { pages: ["missing"] }, redirects: [] }),
  );
  assert.match((await validateDocs(root)).errors.join("\n"), /missing page/);
});

test("rejects invalid redirect destinations", async (context) => {
  const root = await fixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    join(root, "docs.json"),
    JSON.stringify({
      navigation: { pages: ["operate/performance"] },
      redirects: [{ source: "/old", destination: "/missing" }],
    }),
  );
  assert.match((await validateDocs(root)).errors.join("\n"), /has no page/);
});

for (const [name, url] of [
  ["blob", "https://github.com/ashtonchew/modal-computer-use/blob/main/docs/benchmarking.md"],
  ["tree", "https://github.com/ashtonchew/modal-computer-use/tree/main/benchmark-data"],
  ["raw", "https://raw.githubusercontent.com/ashtonchew/modal-computer-use/main/docs/benchmark-results.md"],
]) {
  test(`rejects an unpinned ${name} evidence link on any page`, async (context) => {
    const root = await fixture(`${frontmatter}\n[Evidence](${url})\n`);
    context.after(() => rm(root, { recursive: true, force: true }));
    assert.match((await validateDocs(root)).errors.join("\n"), /full commit SHA/);
  });
}
