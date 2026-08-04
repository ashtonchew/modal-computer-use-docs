import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extname, join, relative } from "node:path";

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

function collectNavigationPages(value, pages) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") pages.push(item);
      else collectNavigationPages(item, pages);
    }
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "pages") collectNavigationPages(item, pages);
      else if (key !== "redirects") collectNavigationPages(item, pages);
    }
  }
}

function evidenceReferences(source) {
  const references = [];
  const github = source.matchAll(
    /https:\/\/github\.com\/ashtonchew\/modal-computer-use\/(?:blob|tree|raw)\/([^/\s)]+)\/([^\s)]+)/g,
  );
  for (const match of github) references.push({ revision: match[1], path: match[2] });

  const raw = source.matchAll(
    /https:\/\/raw\.githubusercontent\.com\/ashtonchew\/modal-computer-use\/([^/\s)]+)\/([^\s)]+)/g,
  );
  for (const match of raw) references.push({ revision: match[1], path: match[2] });
  return references.filter(({ path }) =>
    path
      .split(/[/?#]/)
      .some((segment) => segment === "benchmark-data" || /benchmark/i.test(segment)),
  );
}

function hasSafeFrontmatter(lines) {
  const quotedMetadataLine = /^(title|sidebarTitle|description): "[^"\n]*"$/;
  const booleanMetadataLine = /^(hideFooterPagination): true$/;
  const counts = new Map();

  for (const line of lines) {
    const match = quotedMetadataLine.exec(line) ?? booleanMetadataLine.exec(line);
    if (match === null) return false;
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
  }

  return (
    counts.get("title") === 1 &&
    counts.get("sidebarTitle") === 1 &&
    counts.get("description") === 1 &&
    counts.get("hideFooterPagination") === 1 &&
    lines.length === 4
  );
}

export async function validateDocs(rootPath = repositoryRoot) {
  const errors = [];
  const files = await walk(rootPath);
  const mdxFiles = files.filter((file) => extname(file) === ".mdx");
  const pagePaths = new Set(
    mdxFiles.map((file) => relative(rootPath, file).replace(/\.mdx$/, "")),
  );

  for (const file of mdxFiles) {
    const relativePath = relative(rootPath, file);
    const source = await readFile(file, "utf8");
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
    const frontmatterLines = frontmatter.split("\n").filter(Boolean);
    if (!hasSafeFrontmatter(frontmatterLines)) {
      errors.push(
        `${relativePath}: use quoted title, sidebarTitle, and description metadata plus hideFooterPagination: true`,
      );
    }
    if (!/^title:\s*.+$/m.test(frontmatter)) {
      errors.push(`${relativePath}: add valid frontmatter with a title`);
    }
    if (!/^description:\s*.+$/m.test(frontmatter)) {
      errors.push(`${relativePath}: add a description to the frontmatter`);
    }
    for (const [character, name] of [["—", "em dash"], ["–", "en dash"]]) {
      if (source.includes(character)) errors.push(`${relativePath}: remove the ${name}`);
    }
    if (/Mintlify Starter Kit|Customize this file|under five minutes/i.test(source)) {
      errors.push(`${relativePath}: remove starter or promotional text`);
    }
    if (/\b(?:open_url|move|click|type|full|create|attach|terminate)_async\s*\(/.test(source)) {
      errors.push(`${relativePath}: verify the inferred async-suffix method`);
    }
    if (/expose_vnc\s*=\s*True[^.\n]*(?:grants|provides|is)\s+(?:a\s+)?view[- ]only/i.test(source)) {
      errors.push(`${relativePath}: expose_vnc=True grants control, not view-only access`);
    }
    for (const { revision } of evidenceReferences(source)) {
      if (!/^[0-9a-f]{40}$/.test(revision)) {
        errors.push(`${relativePath}: pin benchmark evidence to a full commit SHA`);
      }
    }
  }

  const config = JSON.parse(await readFile(join(rootPath, "docs.json"), "utf8"));
  const navigationPages = [];
  collectNavigationPages(config.navigation, navigationPages);

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

  for (const residue of [".atlas-analysis.json", "favicon.svg", "logo/dark.svg", "logo/light.svg"]) {
    if (files.some((file) => file === join(rootPath, residue))) {
      errors.push(`${residue}: remove generated starter residue`);
    }
  }
  return { errors, pageCount: mdxFiles.length };
}

async function main() {
  const { errors, pageCount } = await validateDocs();
  if (errors.length > 0) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${pageCount} documentation pages.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
