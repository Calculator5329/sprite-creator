# Nano Banana Technical Specification

## Architecture

```
packages/
├── cli/                    # Nano Banana CLI (nano-banana)
│   └── src/
│       ├── index.ts       # CLI entry point
│       ├── commands/      # Command handlers
│       ├── services/      # Business logic
│       └── types/         # TypeScript types
└── gui/                   # Future GUI (React/Vite)
```

### Layer Separation

1. **CLI Layer** (`commands/`) - Argument parsing, user output
2. **Service Layer** (`services/`) - Stateless image processing
3. **Types** (`types/`) - Shared TypeScript interfaces

## Core Dependencies

| Package | Purpose |
|---------|---------|
| sharp | High-performance image processing |
| commander | CLI framework |
| chalk | Terminal styling |
| glob | File pattern matching |

## Image Processing

### Output Format
- All outputs are **PNG with alpha channel**
- Transparency is preserved/created in all operations

### Resize Modes
- `contain` - Fit within bounds, preserve aspect ratio, transparent padding
- `cover` - Fill bounds, crop excess
- `stretch` - Ignore aspect ratio, fill exactly

### Hitbox Generation

Uses Marching Squares algorithm:
1. Extract alpha channel from image
2. Create binary mask (alpha >= threshold = solid)
3. Trace contour starting from first solid pixel
4. Simplify polygon with Ramer-Douglas-Peucker algorithm

## File Patterns

Glob patterns supported throughout:
- `*.png` - All PNG files in current dir
- `./sprites/**/*.png` - Recursive search
- `player_*.png` - Wildcard matching

## Configuration (Batch)

```json
{
  "input": "./raw-assets",
  "output": "./processed",
  "tasks": [
    {
      "pattern": "tiles/*.png",
      "operations": [
        { "cmd": "transparency", "color": "#FF00FF" },
        { "cmd": "resize", "size": "tile" }
      ]
    }
  ]
}
```

## Spritesheet Metadata

Output JSON format:
```json
{
  "image": "spritesheet.png",
  "cellWidth": 64,
  "cellHeight": 64,
  "cols": 4,
  "rows": 2,
  "frames": [
    { "name": "idle_0", "x": 0, "y": 0, "width": 64, "height": 64 }
  ]
}
```

## Hitbox Output

```json
{
  "sprite_name": {
    "polygon": [[x1, y1], [x2, y2], ...],
    "aabb": { "x": 0, "y": 0, "width": 64, "height": 64 }
  }
}
```
