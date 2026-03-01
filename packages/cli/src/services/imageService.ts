import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import type { Size, ResizeMode, TransparencyOptions } from '../types/index.js';

/**
 * Resize an image to the specified dimensions
 * All outputs are PNG with transparency support
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  size: Size,
  mode: ResizeMode = 'contain'
): Promise<void> {
  const fitMode = mode === 'stretch' ? 'fill' : mode;
  
  await sharp(inputPath)
    .resize(size.width, size.height, {
      fit: fitMode,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);
}

/**
 * Parse hex color string to RGB values
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

/**
 * Make a specific color transparent in an image
 */
export async function makeColorTransparent(
  inputPath: string,
  outputPath: string,
  options: TransparencyOptions
): Promise<void> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (options.color) {
    const targetColor = parseHexColor(options.color);
    const threshold = options.threshold;
    const pixels = new Uint8Array(data);

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const distance = Math.sqrt(
        Math.pow(r - targetColor.r, 2) +
        Math.pow(g - targetColor.g, 2) +
        Math.pow(b - targetColor.b, 2)
      );

      if (distance <= threshold) {
        pixels[i + 3] = 0; // Set alpha to 0
      }
    }

    let result = sharp(Buffer.from(pixels), {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    });

    if (options.trim) {
      result = result.trim();
    }

    if (options.padding > 0) {
      result = result.extend({
        top: options.padding,
        bottom: options.padding,
        left: options.padding,
        right: options.padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    await result.png().toFile(outputPath);
  } else {
    // No color specified, just trim/pad if requested
    let result = image.ensureAlpha();
    
    if (options.trim) {
      result = result.trim();
    }

    if (options.padding > 0) {
      result = result.extend({
        top: options.padding,
        bottom: options.padding,
        left: options.padding,
        right: options.padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    await result.png().toFile(outputPath);
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(inputPath: string) {
  return sharp(inputPath).metadata();
}

/**
 * Ensure output directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Generate output filename
 */
export function getOutputPath(
  inputPath: string,
  outputDir: string,
  suffix?: string
): string {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const fileName = suffix ? `${baseName}${suffix}.png` : `${baseName}.png`;
  return path.join(outputDir, fileName);
}
