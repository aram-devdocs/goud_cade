import { type System, type World, SystemPriorities } from '@repo/ecs';
import { Transform, GridPosition, Sprite } from '@repo/components';

export interface Canvas2DRenderConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Background color */
  backgroundColor?: string;
  /** Enable pixel-perfect rendering */
  pixelPerfect?: boolean;
  /** Draw grid lines */
  showGrid?: boolean;
  /** Grid color */
  gridColor?: string;
  /** Grid cell size (if different from GridPosition cellWidth/Height) */
  gridSize?: number;
}

/**
 * Creates a Canvas2D render system for drawing sprites to a canvas.
 * Supports both Transform (continuous) and GridPosition (discrete) positioning.
 */
export function createCanvas2DRenderSystem(config: Canvas2DRenderConfig): System {
  let ctx: CanvasRenderingContext2D | null = null;

  return {
    name: 'Canvas2DRenderSystem',
    priority: SystemPriorities.RENDER,

    init(_world: World) {
      ctx = config.canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D rendering context');
      }

      config.canvas.width = config.width;
      config.canvas.height = config.height;

      if (config.pixelPerfect) {
        ctx.imageSmoothingEnabled = false;
      }
    },

    update(world, _deltaTime) {
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = config.backgroundColor || '#000000';
      ctx.fillRect(0, 0, config.width, config.height);

      // Draw grid if enabled
      if (config.showGrid && config.gridSize) {
        ctx.strokeStyle = config.gridColor || '#1a1a1a';
        ctx.lineWidth = 1;
        for (let x = 0; x <= config.width; x += config.gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, config.height);
          ctx.stroke();
        }
        for (let y = 0; y <= config.height; y += config.gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(config.width, y);
          ctx.stroke();
        }
      }

      // Get all renderable entities
      const entities = world.query(Sprite);

      // Build render list with position data
      const renderList: Array<{
        sprite: typeof Sprite.defaultValue;
        x: number;
        y: number;
      }> = [];

      for (const entity of entities) {
        const sprite = world.getComponent(entity, Sprite);
        if (!sprite || !sprite.visible) continue;

        let x: number, y: number;

        // Prefer GridPosition over Transform
        const gridPos = world.getComponent(entity, GridPosition);
        if (gridPos) {
          x = gridPos.col * gridPos.cellWidth;
          y = gridPos.row * gridPos.cellHeight;
        } else {
          const transform = world.getComponent(entity, Transform);
          if (transform) {
            x = transform.x;
            y = transform.y;
          } else {
            continue;
          }
        }

        renderList.push({ sprite, x, y });
      }

      // Sort by layer (lower = behind)
      renderList.sort((a, b) => a.sprite.layer - b.sprite.layer);

      // Render each sprite
      for (const { sprite, x, y } of renderList) {
        ctx.save();
        ctx.globalAlpha = sprite.opacity;
        ctx.fillStyle = sprite.color;

        switch (sprite.shape) {
          case 'rect':
            ctx.fillRect(x, y, sprite.width, sprite.height);
            break;

          case 'circle': {
            const centerX = x + sprite.width / 2;
            const centerY = y + sprite.height / 2;
            const radius = Math.min(sprite.width, sprite.height) / 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'roundRect':
            ctx.beginPath();
            ctx.roundRect(x, y, sprite.width, sprite.height, sprite.cornerRadius);
            ctx.fill();
            break;
        }

        // Draw border if specified
        if (sprite.borderColor && sprite.borderWidth > 0) {
          ctx.strokeStyle = sprite.borderColor;
          ctx.lineWidth = sprite.borderWidth;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Optional: CRT scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      for (let y = 0; y < config.height; y += 2) {
        ctx.fillRect(0, y, config.width, 1);
      }
    },

    cleanup() {
      ctx = null;
    },
  };
}
