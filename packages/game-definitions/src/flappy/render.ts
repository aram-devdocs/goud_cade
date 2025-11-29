import { type System, type World, SystemPriorities } from '@repo/ecs';
import { Transform, Sprite, Player, Pipe } from '@repo/components';
import { FLAPPY_CONFIG } from './config';

export interface FlappyRenderConfig {
  canvas: HTMLCanvasElement;
}

/**
 * Custom render system for Flappy Bird with detailed graphics.
 */
export function createFlappyRenderSystem(config: FlappyRenderConfig): System {
  let ctx: CanvasRenderingContext2D | null = null;

  const { width, height } = FLAPPY_CONFIG.canvas;
  const { bird, pipes, ground, colors } = FLAPPY_CONFIG;

  return {
    name: 'FlappyRenderSystem',
    priority: SystemPriorities.RENDER,

    init(_world: World) {
      ctx = config.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');

      config.canvas.width = width;
      config.canvas.height = height;
    },

    update(world) {
      if (!ctx) return;

      const gameStarted = world.getResource<boolean>('gameStarted') ?? false;
      const gameOver = world.getResource<boolean>('gameOver') ?? false;
      const score = world.getResource<number>('score') ?? 0;
      const highScore = world.getResource<number>('highScore') ?? 0;
      const groundOffset = world.getResource<number>('groundOffset') ?? 0;
      const wingFrame = world.getResource<number>('wingFrame') ?? 0;

      // Draw sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height - ground.height);
      gradient.addColorStop(0, colors.skyGradient);
      gradient.addColorStop(1, colors.sky);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height - ground.height);

      // Draw clouds
      ctx.fillStyle = colors.cloud;
      drawCloud(ctx, 80, 60, 1);
      drawCloud(ctx, 280, 100, 0.8);
      drawCloud(ctx, 180, 40, 0.7);

      // Draw pipes
      const pipeEntities = world.query(Pipe, Transform, Sprite);
      for (const entity of pipeEntities) {
        const transform = world.getComponent(entity, Transform)!;
        const sprite = world.getComponent(entity, Sprite)!;
        const pipe = world.getComponent(entity, Pipe)!;

        drawPipe(ctx, transform.x, transform.y, sprite.width, sprite.height, pipe.isTop);
      }

      // Draw ground
      drawGround(ctx, groundOffset);

      // Draw bird
      const birds = world.query(Player, Transform, Sprite);
      if (birds.length > 0) {
        const birdEntity = birds[0]!;
        const transform = world.getComponent(birdEntity, Transform)!;
        drawBird(ctx, transform.x, transform.y, transform.rotation, wingFrame);
      }

      // Draw score (when game started)
      if (gameStarted) {
        drawScore(ctx, score);
      }

      // Draw overlays
      if (gameOver) {
        drawGameOver(ctx, score, highScore);
      } else if (!gameStarted) {
        drawStartScreen(ctx);
      }

      // CRT scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
    },

    cleanup() {
      ctx = null;
    },
  };

  function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.beginPath();
    ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
    ctx.arc(x + 30 * scale, y - 5, 30 * scale, 0, Math.PI * 2);
    ctx.arc(x + 60 * scale, y, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPipe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pipeWidth: number,
    pipeHeight: number,
    isTop: boolean
  ) {
    const capHeight = 26;
    const capOverhang = 4;

    if (isTop) {
      // Top pipe body
      ctx.fillStyle = colors.pipeGreen;
      ctx.fillRect(x, y, pipeWidth, pipeHeight - capHeight);

      // Top pipe cap
      ctx.fillRect(x - capOverhang, pipeHeight - capHeight, pipeWidth + capOverhang * 2, capHeight);

      // Highlight
      ctx.fillStyle = colors.pipeHighlight;
      ctx.fillRect(x + 4, y, 8, pipeHeight - capHeight);
      ctx.fillRect(x - capOverhang + 4, pipeHeight - capHeight, 8, capHeight);

      // Shadow
      ctx.fillStyle = colors.pipeDarkGreen;
      ctx.fillRect(x + pipeWidth - 8, y, 8, pipeHeight - capHeight);
      ctx.fillRect(x + pipeWidth - 4, pipeHeight - capHeight, 8, capHeight);
    } else {
      // Bottom pipe cap
      ctx.fillStyle = colors.pipeGreen;
      ctx.fillRect(x - capOverhang, y, pipeWidth + capOverhang * 2, capHeight);

      // Bottom pipe body
      ctx.fillRect(x, y + capHeight, pipeWidth, pipeHeight - capHeight);

      // Highlight
      ctx.fillStyle = colors.pipeHighlight;
      ctx.fillRect(x - capOverhang + 4, y, 8, capHeight);
      ctx.fillRect(x + 4, y + capHeight, 8, pipeHeight - capHeight);

      // Shadow
      ctx.fillStyle = colors.pipeDarkGreen;
      ctx.fillRect(x + pipeWidth - 4, y, 8, capHeight);
      ctx.fillRect(x + pipeWidth - 8, y + capHeight, 8, pipeHeight - capHeight);
    }
  }

  function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
    const groundY = height - ground.height;
    const scrollOffset = offset % 24;

    // Grass strip
    ctx.fillStyle = colors.groundGrass;
    ctx.fillRect(0, groundY, width, 12);

    // Ground body
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, groundY + 12, width, ground.height - 12);

    // Scrolling pattern
    ctx.fillStyle = colors.groundDetail;
    for (let x = -scrollOffset; x < width + 24; x += 24) {
      ctx.fillRect(x, groundY + 20, 12, 4);
      ctx.fillRect(x + 12, groundY + 32, 12, 4);
    }
  }

  function drawBird(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
    wingFrame: number
  ) {
    ctx.save();
    ctx.translate(x + bird.width / 2, y + bird.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-bird.width / 2, -bird.height / 2);

    // Body
    ctx.fillStyle = colors.bird;
    ctx.beginPath();
    ctx.ellipse(bird.width / 2, bird.height / 2, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = colors.birdOutline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing (animated)
    ctx.fillStyle = colors.birdWing;
    const wingY = wingFrame % 2 === 0 ? bird.height / 2 - 4 : bird.height / 2 + 2;
    ctx.beginPath();
    ctx.ellipse(bird.width / 2 - 4, wingY, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = colors.birdEye;
    ctx.beginPath();
    ctx.arc(bird.width - 10, bird.height / 2 - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = colors.black;
    ctx.beginPath();
    ctx.arc(bird.width - 8, bird.height / 2 - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = colors.birdBeak;
    ctx.beginPath();
    ctx.moveTo(bird.width - 2, bird.height / 2);
    ctx.lineTo(bird.width + 8, bird.height / 2 + 2);
    ctx.lineTo(bird.width - 2, bird.height / 2 + 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawScore(ctx: CanvasRenderingContext2D, score: number) {
    ctx.fillStyle = colors.white;
    ctx.strokeStyle = colors.black;
    ctx.lineWidth = 3;
    ctx.font = 'bold 36px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    const text = score.toString();
    ctx.strokeText(text, width / 2, 50);
    ctx.fillText(text, width / 2, 50);

    ctx.textAlign = 'left';
  }

  function drawGameOver(ctx: CanvasRenderingContext2D, score: number, highScore: number) {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';

    // Game Over text
    ctx.fillStyle = colors.gameOverText;
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 60);

    // Score
    ctx.fillStyle = colors.white;
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${score}`, width / 2, height / 2 - 10);

    // High score
    ctx.fillStyle = colors.highScoreText;
    ctx.fillText(`BEST: ${highScore}`, width / 2, height / 2 + 20);

    // Restart prompt (blinking)
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = colors.white;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('TAP TO RESTART', width / 2, height / 2 + 60);
    }

    ctx.textAlign = 'left';
  }

  function drawStartScreen(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = 'center';

    ctx.fillStyle = colors.white;
    ctx.strokeStyle = colors.black;
    ctx.lineWidth = 3;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.strokeText('FLAPPY BIRD', width / 2, height / 2 - 40);
    ctx.fillText('FLAPPY BIRD', width / 2, height / 2 - 40);

    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.strokeText('TAP TO START', width / 2, height / 2 + 20);
      ctx.fillText('TAP TO START', width / 2, height / 2 + 20);
    }

    ctx.textAlign = 'left';
  }
}
