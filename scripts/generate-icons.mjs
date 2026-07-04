// Generates the Forge PWA icons (ember "F" mark on #09090B) as PNGs without
// any image dependency: pixels are drawn into an RGBA buffer and encoded with
// a minimal PNG writer on top of node:zlib. Output: public/icons/*.png
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

// ---------- PNG encoding ----------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- drawing ----------

const BG = [0x09, 0x09, 0x0b];
const EMBER_FROM = [0xf9, 0x73, 0x16]; // #F97316
const EMBER_TO = [0xef, 0x44, 0x44]; // #EF4444

// The "F" mark as rectangles in unit icon space.
const F_RECTS = [
  [0.345, 0.26, 0.475, 0.74], // stem
  [0.345, 0.26, 0.7, 0.372], // top arm
  [0.345, 0.478, 0.648, 0.578], // middle arm
];

function insideRoundedRect(x, y, size, radius) {
  const r = radius;
  const cx = Math.max(r, Math.min(size - r, x));
  const cy = Math.max(r, Math.min(size - r, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function drawIcon(size, { fullBleed }) {
  const ss = 2; // 2x supersampling for smooth edges
  const S = size * ss;
  const big = Buffer.alloc(S * S * 4);
  const cornerRadius = 0.2233 * S;
  // Maskable/full-bleed icons keep the mark inside the safe zone.
  const shrink = fullBleed ? 0.78 : 1;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const inShape = fullBleed || insideRoundedRect(x + 0.5, y + 0.5, S, cornerRadius);
      if (!inShape) continue; // transparent
      let [r, g, b] = BG;
      // unit coords of this sample, un-shrunk around the center
      const ux = 0.5 + (x / S - 0.5) / shrink;
      const uy = 0.5 + (y / S - 0.5) / shrink;
      const inF = F_RECTS.some(([x1, y1, x2, y2]) => ux >= x1 && ux <= x2 && uy >= y1 && uy <= y2);
      if (inF) {
        const t = (ux + uy) / 2;
        r = Math.round(EMBER_FROM[0] + (EMBER_TO[0] - EMBER_FROM[0]) * t);
        g = Math.round(EMBER_FROM[1] + (EMBER_TO[1] - EMBER_FROM[1]) * t);
        b = Math.round(EMBER_FROM[2] + (EMBER_TO[2] - EMBER_FROM[2]) * t);
      }
      big[i] = r;
      big[i + 1] = g;
      big[i + 2] = b;
      big[i + 3] = 255;
    }
  }

  // box-filter downsample ss^2 -> 1
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let dy = 0; dy < ss; dy++)
          for (let dx = 0; dx < ss; dx++) sum += big[((y * ss + dy) * S + (x * ss + dx)) * 4 + c];
        out[(y * size + x) * 4 + c] = Math.round(sum / (ss * ss));
      }
    }
  }
  return encodePng(size, size, out);
}

mkdirSync(OUT_DIR, { recursive: true });
const files = [
  ['icon-192.png', drawIcon(192, { fullBleed: false })],
  ['icon-512.png', drawIcon(512, { fullBleed: false })],
  ['maskable-192.png', drawIcon(192, { fullBleed: true })],
  ['maskable-512.png', drawIcon(512, { fullBleed: true })],
  ['apple-touch-icon-180.png', drawIcon(180, { fullBleed: true })],
];
for (const [name, buf] of files) {
  writeFileSync(join(OUT_DIR, name), buf);
  console.log(`wrote public/icons/${name} (${buf.length} bytes)`);
}
