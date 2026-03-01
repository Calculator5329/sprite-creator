import sharp from 'sharp';
import path from 'path';
import type { Size, SpritesheetMetadata, SpritesheetFrame } from '../types/index.js';

interface ImageInfo {
  path: string;
  name: string;
  width: number;
  height: number;
}

/**
 * Get dimensions of multiple images
 */
export async function getImageDimensions(imagePaths: string[]): Promise<ImageInfo[]> {
  const results: ImageInfo[] = [];
  
  for (const imagePath of imagePaths) {
    const metadata = await sharp(imagePath).metadata();
    results.push({
      path: imagePath,
      name: path.basename(imagePath, path.extname(imagePath)),
      width: metadata.width || 0,
      height: metadata.height || 0,
    });
  }
  
  return results;
}

/**
 * Calculate optimal grid layout
 */
export function calculateGrid(
  imageCount: number,
  cols?: number,
  rows?: number
): { cols: number; rows: number } {
  if (cols && rows) {
    return { cols, rows };
  }
  
  if (cols) {
    return { cols, rows: Math.ceil(imageCount / cols) };
  }
  
  if (rows) {
    return { cols: Math.ceil(imageCount / rows), rows };
  }
  
  // Auto-calculate: prefer square-ish layouts
  const sqrt = Math.sqrt(imageCount);
  const calculatedCols = Math.ceil(sqrt);
  const calculatedRows = Math.ceil(imageCount / calculatedCols);
  
  return { cols: calculatedCols, rows: calculatedRows };
}

/**
 * Determine cell size from images
 */
export function determineCellSize(
  images: ImageInfo[],
  forcedSize?: Size
): Size {
  if (forcedSize) {
    return forcedSize;
  }
  
  // Use the largest dimensions found
  const maxWidth = Math.max(...images.map(img => img.width));
  const maxHeight = Math.max(...images.map(img => img.height));
  
  return { width: maxWidth, height: maxHeight };
}

/**
 * Create a spritesheet from multiple images
 */
export async function createSpritesheet(
  imagePaths: string[],
  outputPath: string,
  options: {
    cols?: number;
    rows?: number;
    cellSize?: Size;
    includeNames?: boolean;
  } = {}
): Promise<SpritesheetMetadata> {
  const images = await getImageDimensions(imagePaths);
  const grid = calculateGrid(images.length, options.cols, options.rows);
  const cellSize = determineCellSize(images, options.cellSize);
  
  const sheetWidth = grid.cols * cellSize.width;
  const sheetHeight = grid.rows * cellSize.height;
  
  // Create composite operations
  const composites: sharp.OverlayOptions[] = [];
  const frames: SpritesheetFrame[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);
    const x = col * cellSize.width;
    const y = row * cellSize.height;
    
    // Center the image within its cell
    const img = images[i];
    const offsetX = Math.floor((cellSize.width - img.width) / 2);
    const offsetY = Math.floor((cellSize.height - img.height) / 2);
    
    composites.push({
      input: img.path,
      left: x + offsetX,
      top: y + offsetY,
    });
    
    frames.push({
      name: img.name,
      x,
      y,
      width: cellSize.width,
      height: cellSize.height,
    });
  }
  
  // Create the spritesheet with transparent background
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
  
  return {
    image: path.basename(outputPath),
    cellWidth: cellSize.width,
    cellHeight: cellSize.height,
    cols: grid.cols,
    rows: grid.rows,
    frames,
  };
}
