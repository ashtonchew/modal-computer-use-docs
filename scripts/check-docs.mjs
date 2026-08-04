import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("../", import.meta.url);
const errors = [];

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

const rootPath = root.pathname;
const files = await walk(rootPath);
const mdxFiles = files.filter((file) => extname(file) === ".mdx");
const pagePaths = new Set(
  mdxFiles.map((file) => file.slice(rootPath.length).replace(/\.mdx$/, "")),
);

for (const file of mdxFiles) {
  const relative = file.slice(rootPath.length);
  const source = await readFile(file, "utf8");
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
  const frontmatterLines = frontmatter.split("\n").filter(Boolean);
  const allowedFrontmatterLine = /^(?:title|sidebarTitle|description): "[^"\n]*"$/;
  if (
    frontmatterLines.length !== 3 ||
    frontmatterLines.some((line) => !allowedFrontmatterLine.test(line))
  ) {
    errors.push(`${relative}: use only quoted title, sidebarTitle, and description metadata`);
  }
  if (!/^title:\s*.+$/m.test(frontmatter)) {
    errors.push(`${relative}: add valid frontmatter with a title`);
  }
  if (!/^description:\s*.+$/m.test(frontmatter)) {
    errors.push(`${relative}: add a description to the frontmatter`);
  }
  for (const [character, name] of [["—", "em dash"], ["–", "en dash"]]) {
    if (source.includes(character)) errors.push(`${relative}: remove the ${name}`);
  }
  if (/Mintlify Starter Kit|Customize this file|under five minutes/i.test(source)) {
    errors.push(`${relative}: remove starter or promotional text`);
  }
  if (/\b(?:open_url|move|click|type|full|create|attach|terminate)_async\s*\(/.test(source)) {
    errors.push(`${relative}: verify the inferred async-suffix method`);
  }
  if (/expose_vnc\s*=\s*True[^.\n]*(?:grants|provides|is)\s+(?:a\s+)?view[- ]only/i.test(source)) {
    errors.push(`${relative}: expose_vnc=True grants control, not view-only access`);
  }
}

const config = JSON.parse(await readFile(join(rootPath, "docs.json"), "utf8"));
const navigationPages = [];
function collectPages(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") navigationPages.push(item);
      else collectPages(item);
    }
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "pages") collectPages(item);
      else if (key !== "redirects") collectPages(item);
    }
  }
}
collectPages(config.navigation);

for (const page of navigationPages) {
  if (!pagePaths.has(page)) errors.push(`docs.json: missing page ${page}.mdx`);
}
for (const page of pagePaths) {
  if (!navigationPages.includes(page)) errors.push(`${page}.mdx: page is not in navigation`);
}

const redirectSources = new Set();
for (const redirect of config.redirects ?? []) {
  if (redirectSources.has(redirect.source)) {
    errors.push(`docs.json: duplicate redirect source ${redirect.source}`);
  }
  redirectSources.add(redirect.source);
  const destination = redirect.destination === "/" ? "index" : redirect.destination.slice(1);
  if (!pagePaths.has(destination)) {
    errors.push(`docs.json: redirect destination ${redirect.destination} has no page`);
  }
}

for (const file of mdxFiles.filter((file) => file.includes("/benchmarks/"))) {
  const relative = file.slice(rootPath.length);
  const source = await readFile(file, "utf8");
  const codeLinks = source.matchAll(
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/blob\/([^/]+)\/(?:docs|benchmark-data)\//g,
  );
  for (const match of codeLinks) {
    if (!/^[0-9a-f]{40}$/.test(match[1])) {
      errors.push(`${relative}: pin benchmark evidence to a full commit SHA`);
    }
  }
}

for (const residue of [".atlas-analysis.json", "favicon.svg", "logo/dark.svg", "logo/light.svg"]) {
  if (files.some((file) => file === join(rootPath, residue))) {
    errors.push(`${residue}: remove generated starter residue`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${mdxFiles.length} documentation pages.`);
