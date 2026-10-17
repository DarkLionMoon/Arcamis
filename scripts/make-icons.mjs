#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════
   ARCAMIS — make-icons.mjs

   Genera le icone PWA partendo da Artboard_1.png, senza dipendenze
   native (niente sharp/ImageMagick): PNG decodificato con zlib,
   ridimensionato con filtro box e ricodificato.

   Output (in public/, quindi copiati in dist a ogni build):
     public/icons/icon-192.png          any
     public/icons/icon-512.png          any
     public/icons/icon-maskable-192.png maskable (safe zone 80%)
     public/icons/icon-maskable-512.png maskable
     public/apple-touch-icon.png        180×180 opaca
     public/favicon.ico                 32×32 (PNG in ICO)

   Uso: npm run icons
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const source = path.join(root, 'Artboard_1.png');
const publicDir = path.join(root, 'public');
const iconsDir = path.join(publicDir, 'icons');
const BG = [8, 10, 14, 255];

/* ── CRC32 per i chunk PNG ── */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();
function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* ── Lettura PNG ── */
function readPng(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('non è un PNG');
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  let bitDepth = 8;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('PNG interlacciato non supportato');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  if (bitDepth !== 8) throw new Error('supportato solo PNG 8 bit');
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error('formato colore non supportato: ' + colorType);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? line[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      line[x] = value & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      if (channels === 4) {
        pixels[dst] = line[src];
        pixels[dst + 1] = line[src + 1];
        pixels[dst + 2] = line[src + 2];
        pixels[dst + 3] = line[src + 3];
      } else if (channels === 3) {
        pixels[dst] = line[src];
        pixels[dst + 1] = line[src + 1];
        pixels[dst + 2] = line[src + 2];
        pixels[dst + 3] = 255;
      } else {
        pixels[dst] = pixels[dst + 1] = pixels[dst + 2] = line[src];
        pixels[dst + 3] = 255;
      }
    }
    prev = line;
  }
  return { width, height, pixels };
}

/* ── Ridimensionamento box + composizione su tela ── */
function resize(source, size, { scale = 1, opaque = false, background = BG } = {}) {
  const { width, height, pixels } = source;
  const out = Buffer.alloc(size * size * 4);
  const content = Math.round(size * scale);
  const offset = Math.round((size - content) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dst = (y * size + x) * 4;
      const inside = x >= offset && x < offset + content && y >= offset && y < offset + content;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      if (inside) {
        const sx0 = Math.floor(((x - offset) * width) / content);
        const sy0 = Math.floor(((y - offset) * height) / content);
        const sx1 = Math.max(sx0 + 1, Math.floor(((x - offset + 1) * width) / content));
        const sy1 = Math.max(sy0 + 1, Math.floor(((y - offset + 1) * height) / content));
        let count = 0;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let sa = 0;
        for (let sy = sy0; sy < sy1; sy++) {
          for (let sx = sx0; sx < sx1; sx++) {
            const src = (sy * width + sx) * 4;
            const alpha = pixels[src + 3] / 255;
            sr += pixels[src] * alpha;
            sg += pixels[src + 1] * alpha;
            sb += pixels[src + 2] * alpha;
            sa += pixels[src + 3];
            count++;
          }
        }
        if (count) {
          r = sr / count;
          g = sg / count;
          b = sb / count;
          a = sa / count;
        }
      }
      if (opaque || scale < 1) {
        /* composita su sfondo pieno (maskable e apple-touch non devono avere trasparenza) */
        const alpha = a / 255;
        r = r * alpha + background[0] * (1 - alpha);
        g = g * alpha + background[1] * (1 - alpha);
        b = b * alpha + background[2] * (1 - alpha);
        a = 255;
      }
      out[dst] = Math.round(r);
      out[dst + 1] = Math.round(g);
      out[dst + 2] = Math.round(b);
      out[dst + 3] = Math.round(a);
    }
  }
  return out;
}

/* ── Scrittura PNG (RGBA, filtro 0) ── */
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}
function writePng(file, size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
  return png;
}

/* ── ICO con payload PNG (supportato da tutti i browser moderni) ── */
function writeIco(file, png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32BE(png.length, 8);
  entry.writeUInt32BE(22, 12);
  fs.writeFileSync(file, Buffer.concat([header, entry, png]));
}

/* ── Esecuzione ── */
const source_png = readPng(source);
console.log(`✔ sorgente ${source_png.width}×${source_png.height}`);

const jobs = [
  { file: path.join(iconsDir, 'icon-192.png'), size: 192, options: {} },
  { file: path.join(iconsDir, 'icon-512.png'), size: 512, options: {} },
  { file: path.join(iconsDir, 'icon-maskable-192.png'), size: 192, options: { scale: 0.8 } },
  { file: path.join(iconsDir, 'icon-maskable-512.png'), size: 512, options: { scale: 0.8 } },
  { file: path.join(publicDir, 'apple-touch-icon.png'), size: 180, options: { opaque: true, scale: 0.94 } },
];

for (const job of jobs) {
  const pixels = resize(source_png, job.size, job.options);
  writePng(job.file, job.size, pixels);
  console.log(`✔ ${path.relative(root, job.file)} (${job.size}×${job.size})`);
}

const icoPixels = resize(source_png, 32, { opaque: true });
const icoPng = writePng(path.join(publicDir, '.favicon-32.png'), 32, icoPixels);
writeIco(path.join(publicDir, 'favicon.ico'), icoPng, 32);
fs.unlinkSync(path.join(publicDir, '.favicon-32.png'));
console.log('✔ public/favicon.ico (32×32)');
