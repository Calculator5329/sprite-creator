import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import chalk from 'chalk';
import { makeColorTransparent, ensureDir, getOutputPath } from '../services/imageService.js';
import type { TransparencyOptions } from '../types/index.js';

export function createTransparencyCommand(): Command {
  const command = new Command('transparency')
    .description('Add or fix transparency in sprites')
    .argument('<input>', 'Input file or glob pattern')
    .option('-c, --color <hex>', 'Color to make transparent (e.g., #FF00FF)')
    .option('-t, --threshold <n>', 'Color match threshold 0-255', '10')
    .option('-o, --output <dir>', 'Output directory', './output')
    .option('--trim', 'Trim transparent edges', false)
    .option('--padding <n>', 'Add padding around sprite', '0')
    .action(async (input: string, options) => {
      try {
        const outputDir = path.resolve(options.output);
        await ensureDir(outputDir);
        
        const files = await glob(input, { nodir: true });
        
        if (files.length === 0) {
          console.log(chalk.yellow(`No files found matching: ${input}`));
          return;
        }
        
        const transparencyOptions: TransparencyOptions = {
          color: options.color,
          threshold: parseInt(options.threshold, 10),
          trim: options.trim,
          padding: parseInt(options.padding, 10),
          output: outputDir,
        };
        
        console.log(chalk.cyan(`Processing ${files.length} file(s)...`));
        if (options.color) {
          console.log(chalk.dim(`  Making ${options.color} transparent (threshold: ${options.threshold})`));
        }
        if (options.trim) {
          console.log(chalk.dim('  Trimming transparent edges'));
        }
        if (parseInt(options.padding) > 0) {
          console.log(chalk.dim(`  Adding ${options.padding}px padding`));
        }
        
        for (const file of files) {
          const outputPath = getOutputPath(file, outputDir);
          await makeColorTransparent(file, outputPath, transparencyOptions);
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
