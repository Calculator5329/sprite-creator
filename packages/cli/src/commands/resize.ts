import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import chalk from 'chalk';
import { resizeImage, ensureDir, getOutputPath } from '../services/imageService.js';
import { PRESETS, type Size, type ResizeMode, type PresetName } from '../types/index.js';

/**
 * Parse size argument - supports presets (player, tile) or WxH format
 */
function parseSize(sizeArg: string): Size {
  // Check if it's a preset name
  const presetName = sizeArg.toLowerCase() as PresetName;
  if (presetName in PRESETS) {
    return PRESETS[presetName];
  }
  
  // Check if it's a single number (square)
  if (/^\d+$/.test(sizeArg)) {
    const size = parseInt(sizeArg, 10);
    return { width: size, height: size };
  }
  
  // Parse WxH format
  const match = sizeArg.match(/^(\d+)x(\d+)$/i);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  
  throw new Error(`Invalid size format: ${sizeArg}. Use preset name (player, tile, enemy, ui, background), single number, or WxH format.`);
}

export function createResizeCommand(): Command {
  const command = new Command('resize')
    .description('Resize sprites to standard tile sizes')
    .argument('<input>', 'Input file or glob pattern')
    .option('-s, --size <size>', 'Target size: preset name or WxH', '64')
    .option('-o, --output <dir>', 'Output directory', './output')
    .option('-m, --mode <mode>', 'Resize mode: contain, cover, stretch', 'contain')
    .option('--maintain-aspect', 'Maintain aspect ratio', true)
    .action(async (input: string, options) => {
      try {
        const size = parseSize(options.size);
        const mode = options.mode as ResizeMode;
        const outputDir = path.resolve(options.output);
        
        await ensureDir(outputDir);
        
        // Expand glob pattern
        const files = await glob(input, { nodir: true });
        
        if (files.length === 0) {
          console.log(chalk.yellow(`No files found matching: ${input}`));
          return;
        }
        
        console.log(chalk.cyan(`Resizing ${files.length} file(s) to ${size.width}x${size.height}...`));
        
        for (const file of files) {
          const outputPath = getOutputPath(file, outputDir);
          await resizeImage(file, outputPath, size, mode);
          console.log(chalk.green(`  ✓ ${path.basename(file)} → ${path.basename(outputPath)}`));
        }
        
        console.log(chalk.cyan(`\nDone! Output saved to: ${outputDir}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    });
  
  return command;
}
