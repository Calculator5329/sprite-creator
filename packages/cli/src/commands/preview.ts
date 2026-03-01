import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import sharp from 'sharp';
import chalk from 'chalk';
import { ensureDir } from '../services/imageService.js';
import { PRESETS } from '../types/index.js';

type AssetType = 'tile' | 'player' | 'background' | 'ui';

/**
 * Create a preview image showing how a sprite will look in-game
 */
async function createPreviewImage(
  imagePaths: string[],
  outputPath: string,
  options: {
    type: AssetType;
    zoom: number;
    grid: boolean;
    animate: boolean;
  }
): Promise<void> {
  const zoom = options.zoom;
  
  // Load first image to get dimensions
  const firstImage = await sharp(imagePaths[0]).metadata();
  const imgWidth = firstImage.width || 64;
  const imgHeight = firstImage.height || 64;
  
  // Calculate preview canvas size based on type
  let canvasWidth: number;
  let canvasHeight: number;
  let bgColor = { r: 40, g: 40, b: 50, alpha: 255 };
  
  switch (options.type) {
    case 'tile':
      // Show a 5x5 grid of the tile
      canvasWidth = imgWidth * 5 * zoom;
      canvasHeight = imgHeight * 5 * zoom;
      break;
    case 'player':
      // Show player in a scene context
      canvasWidth = Math.max(imgWidth * 3, 200) * zoom;
      canvasHeight = Math.max(imgHeight * 2, 150) * zoom;
      break;
    case 'background':
      // Show background at scale
      canvasWidth = imgWidth * zoom;
      canvasHeight = imgHeight * zoom;
      break;
    case 'ui':
      // Show UI element with some context
      canvasWidth = imgWidth * 4 * zoom;
      canvasHeight = imgHeight * 2 * zoom;
      break;
    default:
      canvasWidth = imgWidth * zoom;
      canvasHeight = imgHeight * zoom;
  }
  
  // Create base canvas
  let canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: bgColor,
    },
  });
  
  const composites: sharp.OverlayOptions[] = [];
  
  // Resize the sprite(s) for preview
  const resizedSprite = await sharp(imagePaths[0])
    .resize(imgWidth * zoom, imgHeight * zoom, { fit: 'fill', kernel: 'nearest' })
    .toBuffer();
  
  if (options.type === 'tile') {
    // Tile the sprite in a 5x5 grid
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        composites.push({
          input: resizedSprite,
          left: col * imgWidth * zoom,
          top: row * imgHeight * zoom,
        });
      }
    }
  } else if (options.type === 'player') {
    // Center the player sprite
    const centerX = Math.floor((canvasWidth - imgWidth * zoom) / 2);
    const centerY = Math.floor((canvasHeight - imgHeight * zoom) / 2);
    composites.push({
      input: resizedSprite,
      left: centerX,
      top: centerY,
    });
    
    // Add a simple ground line
    const groundY = centerY + imgHeight * zoom;
    const groundSvg = `
      <svg width="${canvasWidth}" height="${canvasHeight}">
        <line x1="0" y1="${groundY}" x2="${canvasWidth}" y2="${groundY}" 
              stroke="#666" stroke-width="2"/>
      </svg>
    `;
    composites.push({
      input: Buffer.from(groundSvg),
      left: 0,
      top: 0,
    });
  } else if (options.type === 'ui') {
    // Show UI elements with some spacing
    const spacing = imgWidth * zoom * 0.5;
    let x = spacing;
    for (let i = 0; i < Math.min(3, imagePaths.length || 1); i++) {
      composites.push({
        input: resizedSprite,
        left: Math.floor(x),
        top: Math.floor((canvasHeight - imgHeight * zoom) / 2),
      });
      x += imgWidth * zoom + spacing;
    }
  } else {
    // Background - just show centered
    composites.push({
      input: resizedSprite,
      left: 0,
      top: 0,
    });
  }
  
  // Add grid overlay if requested
  if (options.grid && (options.type === 'tile' || options.type === 'player')) {
    const gridSize = (options.type === 'tile' ? imgWidth : PRESETS.tile.width) * zoom;
    let gridSvg = `<svg width="${canvasWidth}" height="${canvasHeight}">`;
    
    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      gridSvg += `<line x1="${x}" y1="0" x2="${x}" y2="${canvasHeight}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      gridSvg += `<line x1="0" y1="${y}" x2="${canvasWidth}" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
    }
    
    gridSvg += '</svg>';
    composites.push({
      input: Buffer.from(gridSvg),
      left: 0,
      top: 0,
    });
  }
  
  await canvas
    .composite(composites)
    .png()
    .toFile(outputPath);
}

export function createPreviewCommand(): Command {
  const command = new Command('preview')
    .description('Preview how sprites will look in-game')
    .argument('<input>', 'Input file or glob pattern')
    .option('-t, --type <type>', 'Asset type: tile, player, background, ui', 'tile')
    .option('-z, --zoom <n>', 'Zoom level 1-8', '2')
    .option('--grid', 'Show tile grid overlay', false)
    .option('--animate', 'Animate player sprites (creates GIF)', false)
    .option('-o, --output <file>', 'Save preview as image')
    .action(async (input: string, options) => {
      try {
        const files = await glob(input, { nodir: true });
        
        if (files.length === 0) {
          console.log(chalk.yellow(`No files found matching: ${input}`));
          return;
        }
        
        files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        
        const zoom = Math.min(8, Math.max(1, parseInt(options.zoom, 10)));
        const assetType = options.type as AssetType;
        
        // Determine output path
        let outputPath: string;
        if (options.output) {
          outputPath = path.resolve(options.output);
        } else {
          const baseName = path.basename(files[0], path.extname(files[0]));
          outputPath = path.resolve(`./preview_${baseName}.png`);
        }
        
        await ensureDir(path.dirname(outputPath));
        
        console.log(chalk.cyan(`Creating ${assetType} preview...`));
        console.log(chalk.dim(`  Zoom: ${zoom}x`));
        console.log(chalk.dim(`  Grid: ${options.grid ? 'yes' : 'no'}`));
        
        await createPreviewImage(files, outputPath, {
          type: assetType,
          zoom,
          grid: options.grid,
          animate: options.animate,
        });
        
        console.log(chalk.green(`  ✓ Preview saved to: ${outputPath}`));
        console.log(chalk.cyan('\nDone!'));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    });
  
  return command;
}
