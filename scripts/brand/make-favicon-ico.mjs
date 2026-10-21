// Generates src/app/favicon.ico (16/32/48 PNG-in-ICO) from the monogram. Usage: node scripts/brand/make-favicon-ico.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="5" fill="#2F4A2C"/><path fill="#FAF7F2" d="M4 8h2.4v16H4zM14.8 8h2.4v16h-2.4zM25.6 8H28v16h-2.4zM4 8h4.3L12 24H7.7zM14.8 8h4.3L28 24h-4.3z"/></svg>`;
const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map((s) =>
    sharp(Buffer.from(svg), { density: 384 }).resize(s, s).png().toBuffer(),
  ),
);
const head = Buffer.alloc(6);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dir = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  e[0] = sizes[i];
  e[1] = sizes[i];
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([head, ...dir, ...pngs]));
console.log("wrote src/app/favicon.ico");
