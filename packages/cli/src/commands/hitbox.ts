import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { generateHitbox, createHitboxPreview } from '../services/hitboxService.js';
import { ensureDir } from '../services/imageService.js';
import type { Polygon } from '../types/index.js';

export function createHitboxCommand(): Command {
  const command = new Command('hitbox')
    .description('Auto-generate hitbox polygons from sprite alpha channel')
    .argument('<input>', 'Input file or glob pattern')
    .option('-o, --output <file>', 'Output JSON file', 'hitboxes.json')
    .option('-t, --threshold <n>', 'Alpha threshold 0-255', '128')
    .option('-s, --simplify <n>', 'Polygon simplification tolerance', '2')
    .option('--preview', 'Generate preview images with hitbox overlay', false)
    .option('--format <type>', 'Output format: polygon, aabb, both', 'both')
    .action(async (input: string, options) => {
      try {
        const files = await glob(input, { nodir: true });
        
        if (files.length === 0) {
          console.log(chalk.yellow(`No files found matching: ${input}`));
          return;
        }
        
        const threshold = parseInt(options.threshold, 10);
        const simplifyTolerance = parseInt(options.simplify, 10);
        const outputPath = path.resolve(options.output);
        const outputDir = path.dirname(outputPath);
        
        await ensureDir(outputDir);
        
        console.log(chalk.cyan(`Generating hitboxes for ${files.length} file(s)...`));
        console.log(chalk.dim(`  Alpha threshold: ${threshold}`));
        console.log(chalk.dim(`  Simplification: ${simplifyTolerance}`));
        
        const hitboxes: Record<string, Partial<Polygon>> = {};
        
        for (const file of files) {
          const name = path.basename(file, path.extname(file));
          const hitbox = await generateHitbox(file, threshold, simplifyTolerance);
          
          // Format output based on option
          if (options.format === 'polygon') {
            hitboxes[name] = { polygon: hitbox.polygon };
          } else if (options.format === 'aabb') {
            hitboxes[name] = { aabb: hitbox.aabb };
          } else {
            hitboxes[name] = hitbox;
          }
          
          console.log(chalk.green(`  ✓ ${name} (${hitbox.polygon.length} vertices)`));
          
          // Generate preview if requested
          if (options.preview) {
            const previewDir = path.join(outputDir, 'previews');
            await ensureDir(previewDir);
            const previewPath = path.join(previewDir, `${name}_hitbox.png`);
            await createHitboxPreview(file, previewPath, hitbox);
            console.log(chalk.dim(`    → ${path.basename(previewPath)}`));
          }
        }
        
        await fs.writeFile(outputPath, JSON.stringify(hitboxes, null, 2));
        console.log(chalk.cyan(`\nDone! Hitboxes saved to: ${outputPath}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    });
  
  return command;
}
