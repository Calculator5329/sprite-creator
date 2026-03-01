# Nano Banana 🍌

A CLI tool for formatting sprite assets for Epoch Runner level packs.

## Quick Start

```bash
# Install dependencies
npm install

# Build the CLI
npm run build:cli

# Run commands
npx nano-banana <command> [options]
```

## Commands

| Command | Description |
|---------|-------------|
| `resize` | Resize sprites to standard sizes |
| `transparency` | Add/fix transparency in sprites |
| `spritesheet` | Combine sprites into a spritesheet |
| `hitbox` | Generate collision polygons |
| `preview` | Preview sprites in game context |
| `batch` | Bulk process with config file |
| `presets` | Show available size presets |

## Asset Presets

```bash
nano-banana presets
```

| Preset | Size | Description |
|--------|------|-------------|
| `player` | 60x90 | Player character sprites |
| `tile` | 64x64 | Level tiles |
| `enemy` | 64x64 | Enemy sprites |
| `ui` | 64x64 | UI elements |
| `background` | 960x540 | Level backgrounds |

## Examples

```bash
# Resize to player size
nano-banana resize sprite.png -s player -o ./output

# Make magenta transparent
nano-banana transparency sprite.png -c "#FF00FF" --trim

# Create spritesheet with metadata
nano-banana spritesheet ./frames/*.png -o sheet.png --json

# Generate hitboxes
nano-banana hitbox ./sprites/*.png -o hitboxes.json --preview

# Preview as tile
nano-banana preview tile.png -t tile --grid -z 4
```

## Project Structure

```
sprite-creator/
├── packages/
│   ├── cli/          # Nano Banana CLI (nano-banana)
│   └── gui/          # Future GUI application
├── docs/
│   ├── roadmap.md    # Feature roadmap
│   ├── tech_spec.md  # Technical details
│   └── changelog.md  # Version history
```

## Development

```bash
# Watch mode for CLI development
npm run dev:cli

# Build everything
npm run build

# Run GUI dev server
npm run dev:gui
```

## License

MIT
