import { type System, type World, SystemPriorities } from '@repo/ecs';
import { GridPosition, Sprite, SnakeSegment, type Direction } from '@repo/components';
import { SNAKE_CONFIG } from './config';

export interface SnakeRenderConfig {
  canvas: HTMLCanvasElement;
}

/**
 * Custom render system for Snake with arcade visual effects.
 */
export function createSnakeRenderSystem(config: SnakeRenderConfig): System {
  let ctx: CanvasRenderingContext2D | null = null;
  let flashTime = 0;

  const { width, height } = SNAKE_CONFIG.canvas;
  const { cellSize, cols, rows } = SNAKE_CONFIG.grid;

  return {
    name: 'SnakeRenderSystem',
    priority: SystemPriorities.RENDER,

    init(world: World) {
      ctx = config.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');

      config.canvas.width = width;
      config.canvas.height = height;

      // Listen for food eaten to trigger flash
      world.on('foodEaten', () => {
        flashTime = Date.now();
      });
    },

    update(world) {
      if (!ctx) return;

      const gameOver = world.getResource<boolean>('gameOver') ?? false;
      const score = world.getResource<number>('score') ?? 0;
      const highScore = world.getResource<number>('highScore') ?? 0;

      // Clear with background
      ctx.fillStyle = SNAKE_CONFIG.colors.background;
      ctx.fillRect(0, 0, width, height);

      // Flash effect when eating
      const flashAge = Date.now() - flashTime;
      if (flashAge < 100) {
        ctx.fillStyle = `rgba(0, 255, 0, ${0.3 * (1 - flashAge / 100)})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw outer border with glow
      ctx.shadowColor = SNAKE_CONFIG.colors.border;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = SNAKE_CONFIG.colors.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, width - 4, height - 4);
      ctx.shadowBlur = 0;

      // Draw inner border
      ctx.strokeStyle = SNAKE_CONFIG.colors.borderInner;
      ctx.lineWidth = 1;
      ctx.strokeRect(5, 5, width - 10, height - 10);

      // Draw grid
      ctx.strokeStyle = SNAKE_CONFIG.colors.grid;
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, height);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(width, y * cellSize);
        ctx.stroke();
      }

      // Draw food
      const foods = world.query(Sprite, GridPosition);
      for (const entity of foods) {
        // Skip snake segments
        if (world.hasComponent(entity, SnakeSegment)) continue;

        const pos = world.getComponent(entity, GridPosition)!;
        const sprite = world.getComponent(entity, Sprite)!;

        if (!sprite.visible) continue;

        ctx.fillStyle = sprite.color;
        ctx.shadowColor = sprite.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(
          pos.col * cellSize + cellSize / 2,
          pos.row * cellSize + cellSize / 2,
          cellSize / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw snake segments (sorted by index for proper layering)
      const segments = world
        .query(SnakeSegment, GridPosition, Sprite)
        .map((e) => ({
          entity: e,
          segment: world.getComponent(e, SnakeSegment)!,
          pos: world.getComponent(e, GridPosition)!,
          sprite: world.getComponent(e, Sprite)!,
        }))
        .sort((a, b) => b.segment.index - a.segment.index); // Draw tail first

      for (const { segment, pos, sprite } of segments) {
        if (!sprite.visible) continue;

        const x = pos.col * cellSize + 1;
        const y = pos.row * cellSize + 1;

        ctx.fillStyle = sprite.color;
        ctx.fillRect(x, y, sprite.width, sprite.height);

        // Head gets glow and eyes
        if (segment.type === 'head') {
          ctx.shadowColor = SNAKE_CONFIG.colors.snakeHead;
          ctx.shadowBlur = 10;
          ctx.fillRect(x, y, sprite.width, sprite.height);
          ctx.shadowBlur = 0;

          // Draw eyes
          ctx.fillStyle = '#000000';
          const eyeSize = 3;
          const eyeOffset = 4;
          const baseX = pos.col * cellSize;
          const baseY = pos.row * cellSize;

          switch (segment.direction as Direction) {
            case 'UP':
              ctx.fillRect(baseX + eyeOffset, baseY + eyeOffset, eyeSize, eyeSize);
              ctx.fillRect(baseX + cellSize - eyeOffset - eyeSize, baseY + eyeOffset, eyeSize, eyeSize);
              break;
            case 'DOWN':
              ctx.fillRect(baseX + eyeOffset, baseY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
              ctx.fillRect(baseX + cellSize - eyeOffset - eyeSize, baseY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
              break;
            case 'LEFT':
              ctx.fillRect(baseX + eyeOffset, baseY + eyeOffset, eyeSize, eyeSize);
              ctx.fillRect(baseX + eyeOffset, baseY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
              break;
            case 'RIGHT':
              ctx.fillRect(baseX + cellSize - eyeOffset - eyeSize, baseY + eyeOffset, eyeSize, eyeSize);
              ctx.fillRect(baseX + cellSize - eyeOffset - eyeSize, baseY + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
              break;
          }
        }
      }

      // Draw score
      ctx.fillStyle = SNAKE_CONFIG.colors.score;
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${score}`, 10, 22);

      // Draw high score
      ctx.fillStyle = SNAKE_CONFIG.colors.highScore;
      ctx.fillText(`HI: ${highScore}`, width - 100, 22);

      // CRT scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }

      // Game over screen
      if (gameOver) {
        ctx.fillStyle = SNAKE_CONFIG.colors.gameOverBg;
        ctx.fillRect(0, 0, width, height);

        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        // GAME OVER text
        ctx.shadowColor = SNAKE_CONFIG.colors.gameOverText;
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = SNAKE_CONFIG.colors.gameOverText;
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width / 2, height / 2 - 50);
        ctx.shadowBlur = 0;

        // Final score
        ctx.fillStyle = SNAKE_CONFIG.colors.highScore;
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, width / 2, height / 2);

        // High score
        ctx.fillStyle = '#00ffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`HIGH SCORE: ${highScore}`, width / 2, height / 2 + 30);

        // Blinking restart prompt
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = SNAKE_CONFIG.colors.restartText;
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillText('PRESS SPACE TO PLAY', width / 2, height / 2 + 70);
        }

        ctx.textAlign = 'left';
      }
    },

    cleanup() {
      ctx = null;
    },
  };
}
