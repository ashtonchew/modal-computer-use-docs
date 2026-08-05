import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inflateSync } from "node:zlib";

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(source) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual(source.subarray(0, 8), signature);

  let offset = 8;
  let width;
  let height;
  const compressed = [];
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.subarray(offset + 4, offset + 8).toString("ascii");
    const data = source.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "wordmarks must use 8-bit channels");
      assert.equal(data[9], 6, "wordmarks must use RGBA color");
      assert.equal(data[12], 0, "wordmarks must not use interlacing");
    } else if (type === "IDAT") {
      compressed.push(data);
    }
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const encoded = inflateSync(Buffer.concat(compressed));
  const pixels = Buffer.alloc(stride * height);
  let encodedOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[encodedOffset];
    encodedOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const value = encoded[encodedOffset];
      encodedOffset += 1;
      const left = x >= bytesPerPixel ? pixels[y * stride + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft =
        y > 0 && x >= bytesPerPixel
          ? pixels[(y - 1) * stride + x - bytesPerPixel]
          : 0;
      const predictor = [0, left, above, Math.floor((left + above) / 2), paeth(left, above, upperLeft)][filter];
      assert.notEqual(predictor, undefined, `unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = (value + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

function alphaBounds(image, startX, endX) {
  let top = image.height;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3] > 128) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  assert.ok(bottom >= top, "expected visible wordmark content");
  return { top, bottom, center: (top + bottom) / 2 };
}

for (const mode of ["light", "dark"]) {
  test(`${mode} wordmark vertically aligns its icon and title`, async () => {
    const source = await readFile(
      new URL(`../logo/modal-computer-use-wordmark-${mode}.png`, import.meta.url),
    );
    const image = decodeRgbaPng(source);
    const icon = alphaBounds(image, 0, 110);
    const title = alphaBounds(image, 110, image.width);

    assert.ok(
      Math.abs(icon.center - title.center) <= 1,
      `icon center ${icon.center} and title center ${title.center} differ by more than 1 px`,
    );
  });
}

test("light and dark wordmarks keep the same visible geometry", async () => {
  const [lightSource, darkSource] = await Promise.all(
    ["light", "dark"].map((mode) =>
      readFile(
        new URL(`../logo/modal-computer-use-wordmark-${mode}.png`, import.meta.url),
      ),
    ),
  );
  const light = decodeRgbaPng(lightSource);
  const dark = decodeRgbaPng(darkSource);
  assert.equal(light.width, dark.width);
  assert.equal(light.height, dark.height);

  for (let offset = 3; offset < light.pixels.length; offset += 4) {
    assert.equal(
      light.pixels[offset],
      dark.pixels[offset],
      `alpha masks differ at pixel ${Math.floor(offset / 4)}`,
    );
  }
});
