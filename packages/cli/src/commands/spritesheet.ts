import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { createSpritesheet } from '../services/spritesheetService.js';
import { ensureDir } from '../services/imageService.js';
import type { Size } from '../types/index.js';

/**
 * Parse cell size from WxH string
 */
function parseCellSize(sizeStr: string | undefined): Size | undefined {
  if (!sizeStr) return undefined;
  
  const match = sizeStr.match(/^(\d+)x(\d+)$/i);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  
  throw new Error(`Invalid cell size format: ${sizeStr}. Use WxH format (e.g., 32x32)`);
}

export function createSpritesheetCommand(): Command {
  const command = new Command('spritesheet')
    .description('Combine multiple sprites into a spritesheet')
    .argument('<input>', 'Input file pattern (glob)')
    .option('-o, --output <file>', 'Output filename', 'spritesheet.png')
    .option('-c, --cols <n>', 'Number of columns')
    .option('-r, --rows <n>', 'Number of rows')
    .option('--cell-size <WxH>', 'Force cell size (default: auto from largest)')
    .option('--json', 'Generate JSON metadata file', false)
    .option('--names', 'Include filenames in JSON', false)
    .action(async (input: string, options) => {
      try {
        const files = await glob(input, { nodir: true });
        
        if (files.length === 0) {
          console.log(chalk.yellow(`No files found matching: ${input}`));
          return;
        }
        
        // Sort files naturally for consistent ordering
        files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        
        const outputPath = path.resolve(options.output);
        const outputDir = path.dirname(outputPath);
        await ensureDir(outputDir);
        
        const cellSize = parseCellSize(options.cellSize);
        const cols = options.cols ? parseInt(options.cols, 10) : undefined;
        const rows = options.rows ? parseInt(options.rows, 10) : undefined;
        
        console.log(chalk.cyan(`Creating spritesheet from ${files.length} image(s)...`));
        
        const metadata = await createSpritesheet(files, outputPath, {
          cols,
          rows,
          cellSize,
          includeNames: options.names,
        });
        
        console.log(chalk.green(`  ✓ Created ${path.basename(outputPath)}`));
        console.log(chalk.dim(`    Grid: ${metadata.cols}x${metadata.rows}`));
        console.log(chalk.dim(`    Cell size: ${metadata.cellWidth}x${metadata.cellHeight}`));
        
        if (options.json) {
          const jsonPath = outputPath.replace(/\.png$/i, '.json');
          await fs.writeFile(jsonPath, JSON.stringify(metadata, null, 2));
          console.log(chalk.green(`  ✓ Created ${path.basename(jsonPath)}`));
        }
        
        console.log(chalk.cyan('\nDone!'));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    });
  
  return command;
}
