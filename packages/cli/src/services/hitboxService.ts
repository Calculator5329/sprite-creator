import sharp from 'sharp';
import path from 'path';
import type { Polygon } from '../types/index.js';

interface Point {
  x: number;
  y: number;
}

/**
 * Get alpha channel data from an image
 */
export async function getAlphaData(
  imagePath: string
): Promise<{ data: Uint8Array; width: number; height: number }> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const alphaData = new Uint8Array(width * height);
  
  // Extract alpha channel (every 4th byte starting at index 3)
  for (let i = 0; i < alphaData.length; i++) {
    alphaData[i] = data[i * 4 + 3];
  }
  
  return { data: alphaData, width, height };
}

/**
 * Create binary mask from alpha data
 */
export function createBinaryMask(
  alphaData: Uint8Array,
  width: number,
  height: number,
  threshold: number
): boolean[][] {
  const mask: boolean[][] = [];
  
  for (let y = 0; y < height; y++) {
    mask[y] = [];
    for (let x = 0; x < width; x++) {
      const alpha = alphaData[y * width + x];
      mask[y][x] = alpha >= threshold;
    }
  }
  
  return mask;
}

/**
 * Marching Squares algorithm to trace contour
 */
export function marchingSquares(
  mask: boolean[][],
  width: number,
  height: number
): Point[] {
  const points: Point[] = [];
  
  // Find starting point (first opaque pixel from top-left)
  let startX = -1;
  let startY = -1;
  
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x]) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }
  
  if (startX === -1) {
    return points; // No opaque pixels found
  }
  
  // Direction vectors for marching
  const dx = [1, 0, -1, 0];
  const dy = [0, 1, 0, -1];
  
  let x = startX;
  let y = startY;
  let dir = 0; // Start going right
  
  const visited = new Set<string>();
  const maxIterations = width * height * 4;
  let iterations = 0;
  
  do {
    const key = `${x},${y},${dir}`;
    if (visited.has(key)) break;
    visited.add(key);
    
    points.push({ x, y });
    
    // Try to turn right first, then straight, then left
    for (let i = 0; i < 4; i++) {
      const newDir = (dir + 3 + i) % 4; // Right, straight, left, back
      const newX = x + dx[newDir];
      const newY = y + dy[newDir];
      
      if (
        newX >= 0 && newX < width &&
        newY >= 0 && newY < height &&
        mask[newY][newX]
      ) {
        x = newX;
        y = newY;
        dir = newDir;
        break;
      }
    }
    
    iterations++;
  } while ((x !== startX || y !== startY) && iterations < maxIterations);
  
  return points;
}

/**
 * Ramer-Douglas-Peucker algorithm for polygon simplification
 */
export function simplifyPolygon(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  
  // Find the point with the maximum distance from the line
  let maxDistance = 0;
  let maxIndex = 0;
  
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolygon(points.slice(maxIndex), tolerance);
    
    return [...left.slice(0, -1), ...right];
  }
  
  return [start, end];
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }
  
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  
  const nearestX = lineStart.x + t * dx;
  const nearestY = lineStart.y + t * dy;
  
  return Math.sqrt(Math.pow(point.x - nearestX, 2) + Math.pow(point.y - nearestY, 2));
}

/**
 * Calculate axis-aligned bounding box
 */
export function calculateAABB(points: Point[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Generate hitbox data for an image
 */
export async function generateHitbox(
  imagePath: string,
  threshold: number = 128,
  simplifyTolerance: number = 2
): Promise<Polygon> {
  const { data, width, height } = await getAlphaData(imagePath);
  const mask = createBinaryMask(data, width, height, threshold);
  const contour = marchingSquares(mask, width, height);
  const simplified = simplifyPolygon(contour, simplifyTolerance);
  
  return {
    polygon: simplified.map(p => [p.x, p.y] as [number, number]),
    aabb: calculateAABB(contour),
  };
}

/**
 * Create a preview image with hitbox overlay
 */
export async function createHitboxPreview(
  imagePath: string,
  outputPath: string,
  hitbox: Polygon
): Promise<void> {
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  
  // Create SVG overlay for the polygon
  const points = hitbox.polygon.map(([x, y]) => `${x},${y}`).join(' ');
  const svg = `
    <svg width="${width}" height="${height}">
      <polygon points="${points}" fill="none" stroke="#00ff00" stroke-width="2"/>
      <rect x="${hitbox.aabb.x}" y="${hitbox.aabb.y}" 
            width="${hitbox.aabb.width}" height="${hitbox.aabb.height}"
            fill="none" stroke="#ff0000" stroke-width="1" stroke-dasharray="4"/>
    </svg>
  `;
  
  await sharp(imagePath)
    .composite([{
      input: Buffer.from(svg),
      top: 0,
      left: 0,
    }])
    .png()
    .toFile(outputPath);
}
