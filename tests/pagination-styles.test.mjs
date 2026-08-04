import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paginationStyles = await readFile(
  new URL("../style.css", import.meta.url),
  "utf8",
);

test("uses Mintlify's documented pagination hook", () => {
  assert.match(paginationStyles, /#pagination\s*\{/);
});

test("keeps page navigation visible and independent from the footer", () => {
  const selectors = [
    ...paginationStyles
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .matchAll(/([^{}]+)\{/g),
  ].map((match) => match[1].trim());

  assert.doesNotMatch(paginationStyles, /display:\s*none/);
  assert.ok(selectors.every((selector) => selector.includes("#pagination")));
});
