#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createResizeCommand } from './commands/resize.js';
import { createTransparencyCommand } from './commands/transparency.js';
import { createSpritesheetCommand } from './commands/spritesheet.js';
import { createHitboxCommand } from './commands/hitbox.js';
import { createPreviewCommand } from './commands/preview.js';
import { createBatchCommand } from './commands/batch.js';
import { PRESETS } from './types/index.js';

const program = new Command();

program
  .name('nano-banana')
  .description('CLI tool for formatting sprite assets for Epoch Runner level packs')
  .version('1.0.0');

// Add all commands
program.addCommand(createResizeCommand());
program.addCommand(createTransparencyCommand());
program.addCommand(createSpritesheetCommand());
program.addCommand(createHitboxCommand());
program.addCommand(createPreviewCommand());
program.addCommand(createBatchCommand());

// Add a presets command to show available size presets
program
  .command('presets')
  .description('Show available size presets for Epoch Runner')
  .action(() => {
    console.log(chalk.cyan('\nAvailable size presets:\n'));
    console.log(chalk.bold('  Preset      Size'));
    console.log(chalk.dim('  ──────────  ─────────'));
    
    for (const [name, size] of Object.entries(PRESETS)) {
      console.log(`  ${chalk.green(name.padEnd(10))}  ${size.width}x${size.height}`);
    }
    
    console.log(chalk.dim('\nUsage: nano-banana resize sprite.png -s player'));
    console.log(chalk.dim('       nano-banana resize sprite.png -s 64x64\n'));
  });

// Show help by default if no command specified
if (process.argv.length === 2) {
  console.log(chalk.yellow(`
  🍌 ${chalk.bold('Nano Banana')} - Sprite Asset Formatter for Epoch Runner
  `));
  program.outputHelp();
}

program.parse();
