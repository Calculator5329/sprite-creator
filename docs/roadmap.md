# Nano Banana Roadmap

## Current Version: 1.0.0

### Completed Features

- [x] **resize** - Resize sprites with preset support (player, tile, etc.)
- [x] **transparency** - Make colors transparent, trim, add padding
- [x] **spritesheet** - Combine sprites into sheets with JSON metadata
- [x] **hitbox** - Generate collision polygons from alpha channel
- [x] **preview** - Preview sprites in game context
- [x] **batch** - Config-driven bulk processing
- [x] **presets** - Show available size presets

### Asset Presets (Epoch Runner)

| Preset | Dimensions | Notes |
|--------|------------|-------|
| player | 60x90 | Default player sprite size |
| tile | 64x64 | Standard tile size |
| enemy | 64x64 | Enemy sprites |
| ui | 64x64 | UI elements (hearts, coins) |
| background | 960x540 | 16:9 backgrounds |

## Future Features

### v1.1 - Asset Enhancement
- [ ] Palette swapping for theme variants
- [ ] Animation frame extraction from GIFs
- [ ] Tile autotiling rule generator

### v1.2 - Integration
- [ ] Direct upload to Epoch Runner editor
- [ ] Export presets configuration

### v2.0 - GUI Mode
- [ ] Electron-based GUI application
- [ ] Drag-and-drop interface
- [ ] Real-time preview
- [ ] Batch queue management
