/**
 * Gemini Watermark Remover - Reverse Alpha Blending Algorithm
 * Based on: https://github.com/journey-ad/gemini-watermark-remover (MIT License)
 * Formula: original = (watermarked - α × 255) / (1 - α)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';

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

function calculateAlphaMap(imageData: Buffer, width: number, height: number): Float32Array {
  const alphaMap = new Float32Array(width * height);
  for (let i = 0; i < alphaMap.length; i++) {
    const idx = i * 4;
    const maxChannel = Math.max(imageData[idx], imageData[idx + 1], imageData[idx + 2]);
    alphaMap[i] = maxChannel / 255.0;
  }
  return alphaMap;
}

async function getAlphaMap(size: 48 | 96): Promise<Float32Array> {
  const cached = alphaMapCache.get(size);
  if (cached) return cached;

  const assetPath = path.join(import.meta.dir, 'assets', `bg_${size}.png`);
  const fileData = await readFile(assetPath);
  const png = PNG.sync.read(fileData);
  const alphaMap = calculateAlphaMap(png.data, png.width, png.height);

  alphaMapCache.set(size, alphaMap);
  return alphaMap;
}

function applyReverseAlphaBlending(
  imageData: Buffer,
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
  const png = PNG.sync.read(Buffer.from(imageBuffer));
  const { width, height, data } = png;

  const config = detectWatermarkConfig(width, height);
  const position = calculateWatermarkPosition(width, height, config);
  const alphaMap = await getAlphaMap(config.logoSize as 48 | 96);

  applyReverseAlphaBlending(data, width, alphaMap, position);

  return PNG.sync.write(png);
}

export function hasWatermarkArea(width: number, height: number): boolean {
  const config = detectWatermarkConfig(width, height);
  const minWidth = config.logoSize + config.marginRight;
  const minHeight = config.logoSize + config.marginBottom;
  return width >= minWidth && height >= minHeight;
}
