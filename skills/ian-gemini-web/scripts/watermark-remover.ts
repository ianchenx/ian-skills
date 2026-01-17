/**
 * Gemini Watermark Remover - Reverse Alpha Blending Algorithm
 * Based on: https://github.com/journey-ad/gemini-watermark-remover (MIT License)
 * Formula: original = (watermarked - α × 255) / (1 - α)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { dlopen, FFIType, suffix } from 'bun:ffi';

const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255;

interface WatermarkConfig {
  logoSize: number;
  marginRight: number;
  marginBottom: number;
}

interface WatermarkPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const alphaMapCache: Map<number, Float32Array> = new Map();

function detectWatermarkConfig(imageWidth: number, imageHeight: number): WatermarkConfig {
  if (imageWidth > 1024 && imageHeight > 1024) {
    return { logoSize: 96, marginRight: 64, marginBottom: 64 };
  }
  return { logoSize: 48, marginRight: 32, marginBottom: 32 };
}

function calculateWatermarkPosition(
  imageWidth: number,
  imageHeight: number,
  config: WatermarkConfig,
): WatermarkPosition {
  return {
    x: imageWidth - config.marginRight - config.logoSize,
    y: imageHeight - config.marginBottom - config.logoSize,
    width: config.logoSize,
    height: config.logoSize,
  };
}

function calculateAlphaMap(imageData: Uint8Array, width: number, height: number): Float32Array {
  const alphaMap = new Float32Array(width * height);
  for (let i = 0; i < alphaMap.length; i++) {
    const idx = i * 4;
    const maxChannel = Math.max(imageData[idx], imageData[idx + 1], imageData[idx + 2]);
    alphaMap[i] = maxChannel / 255.0;
  }
  return alphaMap;
}

function decodePNG(buffer: Uint8Array): { width: number; height: number; data: Uint8Array } {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) {
    throw new Error('Invalid PNG signature');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Uint8Array[] = [];

  while (offset < buffer.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7],
    );

    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      bitDepth = buffer[offset + 16];
      colorType = buffer[offset + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }

    offset += 12 + length;
  }

  const compressedData = new Uint8Array(idatChunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let pos = 0;
  for (const chunk of idatChunks) {
    compressedData.set(chunk, pos);
    pos += chunk.length;
  }

  const decompressed = Bun.inflateSync(compressedData);

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const bytesPerPixel = (bitDepth / 8) * channels;
  const scanlineLength = width * bytesPerPixel + 1;

  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * scanlineLength;
    const filterType = decompressed[scanlineOffset];
    const scanline = decompressed.slice(scanlineOffset + 1, scanlineOffset + 1 + width * bytesPerPixel);

    const prevScanline =
      y > 0 ? data.slice((y - 1) * width * 4, y * width * 4) : new Uint8Array(width * 4);

    for (let x = 0; x < width; x++) {
      const srcIdx = x * bytesPerPixel;
      const dstIdx = (y * width + x) * 4;

      let r = 0,
        g = 0,
        b = 0,
        a = 255;

      if (channels === 4) {
        r = scanline[srcIdx];
        g = scanline[srcIdx + 1];
        b = scanline[srcIdx + 2];
        a = scanline[srcIdx + 3];
      } else if (channels === 3) {
        r = scanline[srcIdx];
        g = scanline[srcIdx + 1];
        b = scanline[srcIdx + 2];
      } else if (channels === 2) {
        r = g = b = scanline[srcIdx];
        a = scanline[srcIdx + 1];
      } else {
        r = g = b = scanline[srcIdx];
      }

      const applyFilter = (current: number, left: number, up: number, upLeft: number): number => {
        switch (filterType) {
          case 0:
            return current;
          case 1:
            return (current + left) & 0xff;
          case 2:
            return (current + up) & 0xff;
          case 3:
            return (current + Math.floor((left + up) / 2)) & 0xff;
          case 4: {
            const p = left + up - upLeft;
            const pa = Math.abs(p - left);
            const pb = Math.abs(p - up);
            const pc = Math.abs(p - upLeft);
            const pr = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
            return (current + pr) & 0xff;
          }
          default:
            return current;
        }
      };

      const leftIdx = x > 0 ? dstIdx - 4 : -1;
      const upIdx = y > 0 ? dstIdx - width * 4 : -1;
      const upLeftIdx = x > 0 && y > 0 ? dstIdx - width * 4 - 4 : -1;

      data[dstIdx] = applyFilter(
        r,
        leftIdx >= 0 ? data[leftIdx] : 0,
        upIdx >= 0 ? data[upIdx] : 0,
        upLeftIdx >= 0 ? data[upLeftIdx] : 0,
      );
      data[dstIdx + 1] = applyFilter(
        g,
        leftIdx >= 0 ? data[leftIdx + 1] : 0,
        upIdx >= 0 ? data[upIdx + 1] : 0,
        upLeftIdx >= 0 ? data[upLeftIdx + 1] : 0,
      );
      data[dstIdx + 2] = applyFilter(
        b,
        leftIdx >= 0 ? data[leftIdx + 2] : 0,
        upIdx >= 0 ? data[upIdx + 2] : 0,
        upLeftIdx >= 0 ? data[upLeftIdx + 2] : 0,
      );
      data[dstIdx + 3] = channels >= 2 && (channels === 4 || channels === 2)
        ? applyFilter(
            a,
            leftIdx >= 0 ? data[leftIdx + 3] : 0,
            upIdx >= 0 ? data[upIdx + 3] : 0,
            upLeftIdx >= 0 ? data[upLeftIdx + 3] : 0,
          )
        : 255;
    }
  }

  return { width, height, data };
}

function encodePNG(width: number, height: number, data: Uint8Array): Uint8Array {
  const scanlines: number[] = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      scanlines.push(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
    }
  }

  const rawData = new Uint8Array(scanlines);
  const compressed = Bun.deflateSync(rawData);

  const chunks: Uint8Array[] = [];

  chunks.push(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  const ihdr = new Uint8Array(25);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, 13);
  ihdr.set([0x49, 0x48, 0x44, 0x52], 4);
  ihdrView.setUint32(8, width);
  ihdrView.setUint32(12, height);
  ihdr[16] = 8;
  ihdr[17] = 6;
  ihdr[18] = 0;
  ihdr[19] = 0;
  ihdr[20] = 0;
  ihdrView.setUint32(21, crc32(ihdr.slice(4, 21)));
  chunks.push(ihdr);

  const idat = new Uint8Array(12 + compressed.length);
  const idatView = new DataView(idat.buffer);
  idatView.setUint32(0, compressed.length);
  idat.set([0x49, 0x44, 0x41, 0x54], 4);
  idat.set(compressed, 8);
  idatView.setUint32(8 + compressed.length, crc32(idat.slice(4, 8 + compressed.length)));
  chunks.push(idat);

  const iend = new Uint8Array(12);
  const iendView = new DataView(iend.buffer);
  iendView.setUint32(0, 0);
  iend.set([0x49, 0x45, 0x4e, 0x44], 4);
  iendView.setUint32(8, crc32(iend.slice(4, 8)));
  chunks.push(iend);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function getAlphaMap(size: 48 | 96): Promise<Float32Array> {
  const cached = alphaMapCache.get(size);
  if (cached) return cached;

  const assetPath = path.join(import.meta.dir, 'assets', `bg_${size}.png`);
  const fileData = await readFile(assetPath);
  const { width, height, data } = decodePNG(new Uint8Array(fileData));
  const alphaMap = calculateAlphaMap(data, width, height);

  alphaMapCache.set(size, alphaMap);
  return alphaMap;
}

function applyReverseAlphaBlending(
  imageData: Uint8Array,
  imageWidth: number,
  alphaMap: Float32Array,
  position: WatermarkPosition,
): void {
  const { x, y, width, height } = position;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const imgIdx = ((y + row) * imageWidth + (x + col)) * 4;
      const alphaIdx = row * width + col;
      let alpha = alphaMap[alphaIdx];

      if (alpha < ALPHA_THRESHOLD) continue;

      alpha = Math.min(alpha, MAX_ALPHA);
      const divisor = 1.0 - alpha;

      for (let c = 0; c < 3; c++) {
        const watermarked = imageData[imgIdx + c];
        const original = (watermarked - alpha * LOGO_VALUE) / divisor;
        imageData[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
      }
    }
  }
}

export async function removeWatermark(imageBuffer: Uint8Array): Promise<Uint8Array> {
  const { width, height, data } = decodePNG(imageBuffer);

  const config = detectWatermarkConfig(width, height);
  const position = calculateWatermarkPosition(width, height, config);
  const alphaMap = await getAlphaMap(config.logoSize as 48 | 96);

  applyReverseAlphaBlending(data, width, alphaMap, position);

  return encodePNG(width, height, data);
}

export function hasWatermarkArea(width: number, height: number): boolean {
  const config = detectWatermarkConfig(width, height);
  const minWidth = config.logoSize + config.marginRight;
  const minHeight = config.logoSize + config.marginBottom;
  return width >= minWidth && height >= minHeight;
}
