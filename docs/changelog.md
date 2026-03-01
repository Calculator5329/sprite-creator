# Changelog

All notable changes to Nano Banana will be documented in this file.

## [1.0.0] - 2026-02-01

### Added
- Initial release of Nano Banana CLI
- **resize** command with preset support (player: 60x90, tile/enemy/ui: 64x64, background: 960x540)
- **transparency** command for color-keying, trimming, and padding
- **spritesheet** command for combining sprites with JSON metadata export
- **hitbox** command using Marching Squares algorithm with RDP simplification
- **preview** command for visualizing sprites in game context
- **batch** command for config-driven bulk processing
- **presets** command to display available size presets
- Monorepo structure with npm workspaces (cli + gui packages)
- Full TypeScript implementation
- PNG output with transparent backgrounds throughout
