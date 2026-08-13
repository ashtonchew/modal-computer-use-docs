import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const script = await readFile(
  new URL("../table-keyboard-scroll.js", import.meta.url),
  "utf8",
);

function loadHandler() {
  let handler;
  vm.runInNewContext(script, {
    document: {
      addEventListener(type, callback) {
        assert.equal(type, "keydown");
        handler = callback;
      },
    },
  });
  assert.equal(typeof handler, "function");
  return handler;
}

test("scrolls an overflowing table region with horizontal arrow keys", () => {
  const handler = loadHandler();
  const calls = [];
  const region = {
    clientWidth: 320,
    scrollWidth: 640,
    querySelector: (selector) => (selector === "table" ? {} : null),
    scrollBy: (options) => calls.push(options),
  };
  const target = { closest: () => region };
  let prevented = false;

  handler({
    key: "ArrowRight",
    target,
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].left, 48);
  assert.equal(calls[0].behavior, "auto");
  assert.equal(prevented, true);
});

test("leaves non-overflowing tables and other keys unchanged", () => {
  const handler = loadHandler();
  const calls = [];
  const region = {
    clientWidth: 640,
    scrollWidth: 640,
    querySelector: () => ({}),
    scrollBy: (options) => calls.push(options),
  };
  const target = { closest: () => region };

  handler({ key: "ArrowLeft", target, preventDefault: assert.fail });
  handler({ key: "ArrowDown", target, preventDefault: assert.fail });

  assert.deepEqual(calls, []);
});
