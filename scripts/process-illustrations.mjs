import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC =
  "/Users/xujiong/.cursor/projects/Users-xujiong-Desktop-person-record/assets";
const OUT = "public/illustrations";

const FILES = [
  "home-kpi",
  "daily-tip",
  "empty-no-records",
  "empty-no-data",
  "success-saved",
  "family-banner",
  "login-hero",
  // 背景类通常直接拷贝，不走角色抠图；保留名便于清单对齐
  // "bg-header-meadow", "bg-page-soft", "bg-tab-soft", "bg-subpage-wash",
];

function isCreamOrBorder(r, g, b, x, y, w, h) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const border = 5;
  const onEdge = x < border || y < border || x >= w - border || y >= h - border;
  if (onEdge && lum < 100) return true;
  // cream / off-white paper
  if (lum > 232 && r > 225 && g > 220 && b > 200 && Math.abs(r - g) < 25) {
    return true;
  }
  if (r > 245 && g > 242 && b > 235) return true;
  return false;
}

async function processOne(name) {
  const input = path.join(SRC, `${name}.jpg`);
  const output = path.join(OUT, `${name}.png`);
  if (!fs.existsSync(input)) {
    console.log("missing", input);
    return;
  }

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Pass 1: chroma-key cream + dark letterbox
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isCreamOrBorder(data[i], data[i + 1], data[i + 2], x, y, w, h)) {
        data[i + 3] = 0;
      }
    }
  }

  // Pass 2: flood from edges for remaining near-bg
  const visited = new Uint8Array(w * h);
  const q = [];
  const softBg = (r, g, b) => {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 225 && r > 215 && g > 210 && b > 190 && Math.abs(r - g) < 30;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (data[i + 3] === 0) {
      visited[idx] = 1;
      q.push(idx);
      return;
    }
    if (!softBg(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    q.push(idx);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (q.length) {
    const idx = q.pop();
    data[idx * 4 + 3] = 0;
    const x = idx % w;
    const y = (idx / w) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let kept = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        kept += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (!kept) {
    console.log("empty after key", name);
    return;
  }

  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const cropped = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const si = ((minY + y) * w + (minX + x)) * 4;
      const di = (y * tw + x) * 4;
      cropped[di] = data[si];
      cropped[di + 1] = data[si + 1];
      cropped[di + 2] = data[si + 2];
      cropped[di + 3] = data[si + 3];
    }
  }

  await sharp(cropped, { raw: { width: tw, height: th, channels: 4 } })
    .png()
    .toFile(output);

  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`${name}.png  ${w}x${h} -> ${tw}x${th}  ${kb}KB`);
}

fs.mkdirSync(OUT, { recursive: true });
for (const name of FILES) {
  await processOne(name);
}
