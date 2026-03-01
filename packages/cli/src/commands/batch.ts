import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { resizeImage, makeColorTransparent, ensureDir, getOutputPath } from '../services/imageService.js';
import { generateHitbox } from '../services/hitboxService.js';
import { createSpritesheet } from '../services/spritesheetService.js';
import { PRESETS, type BatchConfig, type BatchOperation, type Size, type PresetName } from '../types/index.js';

/**
 * Parse size from operation config
 */
function parseSize(sizeArg: string | number): Size {
  if (typeof sizeArg === 'number') {
    return { width: sizeArg, height: sizeArg };
  }
  
  const presetName = sizeArg.toLowerCase() as PresetName;
  if (presetName in PRESETS) {
    return PRESETS[presetName];
  }
  
  if (/^\d+$/.test(sizeArg)) {
    const size = parseInt(sizeArg, 10);
    return { width: size, height: size };
  }
  
  const match = sizeArg.match(/^(\d+)x(\d+)$/i);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  
  return { width: 64, height: 64 };
}

/**
 * Execute a single operation on a file
 */
async function executeOperation(
  file: string,
  operation: BatchOperation,
  outputDir: string
): Promise<string> {
  const outputPath = getOutputPath(file, outputDir);
  
  switch (operation.cmd) {
    case 'resize': {
      const size = parseSize(operation.size as string | number || '64');
      const mode = (operation.mode as 'contain' | 'cover' | 'stretch') || 'contain';
      await resizeImage(file, outputPath, size, mode);
      break;
    }
    
    case 'transparency': {
      await makeColorTransparent(file, outputPath, {
        color: operation.color as string | undefined,
        threshold: (operation.threshold as number) || 10,
        trim: (operation.trim as boolean) || false,
        padding: (operation.padding as number) || 0,
        output: outputDir,
      });
      break;
    }
    
    case 'hitbox': {
      const hitbox = await generateHitbox(
        file,
        (operation.threshold as number) || 128,
        (operation.simplify as number) || 2
      );
      const jsonPath = outputPath.replace(/\.png$/i, '.hitbox.json');
      await fs.writeFile(jsonPath, JSON.stringify(hitbox, null, 2));
      // Copy original file to output
      await fs.copyFile(file, outputPath);
      break;
    }
    
    default:
      console.log(chalk.yellow(`    Unknown operation: ${operation.cmd}`));
      await fs.copyFile(file, outputPath);
  }
  
  return outputPath;
}

export function createBatchCommand(): Command {
  const command = new Command('batch')
    .description('Process multiple files with a config file')
    .argument('<config>', 'Path to config file (JSON)')
    .action(async (configPath: string) => {
      try {
        const configFile = path.resolve(configPath);
        const configContent = await fs.readFile(configFile, 'utf-8');
        const config: BatchConfig = JSON.parse(configContent);
        
        const baseInput = path.resolve(path.dirname(configFile), config.input || '.');
        const baseOutput = path.resolve(path.dirname(configFile), config.output || './processed');
        
        console.log(chalk.cyan('Starting batch processing...'));
        console.log(chalk.dim(`  Input: ${baseInput}`));
        console.log(chalk.dim(`  Output: ${baseOutput}`));
        
        await ensureDir(baseOutput);
        
        for (const task of config.tasks) {
          console.log(chalk.cyan(`\nProcessing: ${task.pattern}`));
          
          const pattern = path.join(baseInput, task.pattern);
          const files = await glob(pattern, { nodir: true });
          
          if (files.length === 0) {
            console.log(chalk.yellow(`  No files found matching: ${task.pattern}`));
            continue;
          }
          
          console.log(chalk.dim(`  Found ${files.length} file(s)`));
          
          for (const file of files) {
            // Determine output subdirectory based on task pattern
            const relPath = path.relative(baseInput, path.dirname(file));
            const taskOutput = path.join(baseOutput, relPath);
            await ensureDir(taskOutput);
            
            let currentFile = file;
            
            // Execute operations in sequence
            for (const operation of task.operations) {
              console.log(chalk.dim(`    ${operation.cmd}: ${path.basename(currentFile)}`));
              currentFile = await executeOperation(currentFile, operation, taskOutput);
            }
            
            console.log(chalk.green(`  ✓ ${path.basename(file)}`));
          }
        }
        
        console.log(chalk.cyan('\nBatch processing complete!'));
        console.log(chalk.dim(`Output saved to: ${baseOutput}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    });
  
  return command;
}
