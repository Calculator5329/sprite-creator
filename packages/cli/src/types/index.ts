// Asset dimension presets for Epoch Runner
export const PRESETS = {
  player: { width: 60, height: 90 },
  tile: { width: 64, height: 64 },
  enemy: { width: 64, height: 64 },
  ui: { width: 64, height: 64 },
  background: { width: 960, height: 540 },
} as const;

export type PresetName = keyof typeof PRESETS;

export interface Size {
  width: number;
  height: number;
}

export type ResizeMode = 'contain' | 'cover' | 'stretch';

export interface ResizeOptions {
  size: Size;
  mode: ResizeMode;
  maintainAspect: boolean;
  output: string;
}

export interface TransparencyOptions {
  color?: string;
  threshold: number;
  trim: boolean;
  padding: number;
  output: string;
}

export interface SpritesheetOptions {
  output: string;
  cols?: number;
  rows?: number;
  cellSize?: Size;
  json: boolean;
  names: boolean;
}

export interface SpritesheetFrame {
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface SpritesheetMetadata {
  image: string;
  cellWidth: number;
  cellHeight: number;
  cols: number;
  rows: number;
  frames: SpritesheetFrame[];
}

export interface HitboxOptions {
  output: string;
  threshold: number;
  simplify: number;
  preview: boolean;
  format: 'polygon' | 'aabb' | 'both';
}

export interface Polygon {
  polygon: [number, number][];
  aabb: { x: number; y: number; width: number; height: number };
}

export interface PreviewOptions {
  type: 'tile' | 'player' | 'background' | 'ui';
  zoom: number;
  grid: boolean;
  animate: boolean;
  output?: string;
}

export interface BatchTask {
  pattern: string;
  operations: BatchOperation[];
}

export interface BatchOperation {
  cmd: string;
  [key: string]: unknown;
}

export interface BatchConfig {
  input: string;
  output: string;
  tasks: BatchTask[];
}
