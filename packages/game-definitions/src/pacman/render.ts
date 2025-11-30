import { type System, type World, SystemPriorities } from '@repo/ecs';
import { GridPosition, Ghost, Pellet, PacMan } from '@repo/components';
import { PACMAN_CONFIG } from './config';

export interface PacManRenderConfig {
  canvas: HTMLCanvasElement;
}

/**
 * Custom render system for Pac-Man with classic arcade visuals.
 */
export function createPacManRenderSystem(config: PacManRenderConfig): System {
  let ctx: CanvasRenderingContext2D | null = null;
  let powerPelletBlink = 0;

  const { width, height } = PACMAN_CONFIG.canvas;
  const { cellSize, cols, rows, offsetX, offsetY } = PACMAN_CONFIG.grid;

  // Helper to convert grid position to canvas position
  function toCanvas(col: number, row: number): { x: number; y: number } {
    return {
      x: offsetX + col * cellSize + cellSize / 2,
      y: offsetY + row * cellSize + cellSize / 2,
    };
  }

  // Draw a rounded rectangle
  function drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  // Draw maze walls
  function drawMaze(context: CanvasRenderingContext2D) {
    const { maze, colors } = PACMAN_CONFIG;

    context.strokeStyle = colors.maze;
    context.lineWidth = 2;

    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row]!.length; col++) {
        const cell = maze[row]![col];
        if (cell !== 1) continue;

        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;

        // Check neighbors to draw proper wall segments
        const hasTop = row > 0 && maze[row - 1]![col] === 1;
        const hasBottom = row < maze.length - 1 && maze[row + 1]![col] === 1;
        const hasLeft = col > 0 && maze[row]![col - 1] === 1;
        const hasRight = col < maze[row]!.length - 1 && maze[row]![col + 1] === 1;

        context.beginPath();

        // Draw wall based on neighbors
        if (hasTop && hasBottom && !hasLeft && !hasRight) {
          // Vertical segment
          context.moveTo(x + cellSize / 2, y);
          context.lineTo(x + cellSize / 2, y + cellSize);
        } else if (!hasTop && !hasBottom && hasLeft && hasRight) {
          // Horizontal segment
          context.moveTo(x, y + cellSize / 2);
          context.lineTo(x + cellSize, y + cellSize / 2);
        } else {
          // Draw a small rect for corners/intersections
          drawRoundedRect(context, x + 2, y + 2, cellSize - 4, cellSize - 4, 2);
          context.fillStyle = colors.maze;
          context.fill();
        }

        context.stroke();
      }
    }

    // Draw ghost house door
    context.strokeStyle = '#FFB8FF';
    context.lineWidth = 2;
    context.beginPath();
    const doorX = offsetX + 8 * cellSize;
    const doorY = offsetY + 8 * cellSize + cellSize / 2;
    context.moveTo(doorX, doorY);
    context.lineTo(doorX + 3 * cellSize, doorY);
    context.stroke();
  }

  // Draw Pac-Man
  function drawPacMan(
    context: CanvasRenderingContext2D,
    col: number,
    row: number,
    direction: string,
    mouthAngle: number
  ) {
    const pos = toCanvas(col, row);
    const radius = cellSize / 2 - 1;

    // Direction to angle mapping
    const dirAngles: Record<string, number> = {
      RIGHT: 0,
      DOWN: Math.PI / 2,
      LEFT: Math.PI,
      UP: -Math.PI / 2,
    };

    const baseAngle = dirAngles[direction] ?? 0;
    const mouthRad = (mouthAngle * Math.PI) / 180;

    context.fillStyle = PACMAN_CONFIG.colors.pacman;
    context.beginPath();
    context.moveTo(pos.x, pos.y);
    context.arc(pos.x, pos.y, radius, baseAngle + mouthRad, baseAngle + 2 * Math.PI - mouthRad);
    context.closePath();
    context.fill();
  }

  // Draw ghost
  function drawGhost(
    context: CanvasRenderingContext2D,
    col: number,
    row: number,
    color: string,
    mode: string,
    frightenedTimer: number
  ) {
    const pos = toCanvas(col, row);
    const radius = cellSize / 2 - 1;
    const { colors, gameplay } = PACMAN_CONFIG;

    // Determine color based on mode
    let ghostColor = color;
    if (mode === 'frightened') {
      const blinkPhase = frightenedTimer < gameplay.blinkStart;
      if (blinkPhase && Math.floor(Date.now() / 150) % 2 === 0) {
        ghostColor = colors.frightenedGhostBlink;
      } else {
        ghostColor = colors.frightenedGhost;
      }
    } else if (mode === 'eaten') {
      // Only draw eyes
      drawGhostEyes(context, pos.x, pos.y, radius);
      return;
    }

    // Draw ghost body
    context.fillStyle = ghostColor;
    context.beginPath();
    context.arc(pos.x, pos.y - radius / 3, radius, Math.PI, 0);
    context.lineTo(pos.x + radius, pos.y + radius / 2);

    // Wavy bottom
    const waveCount = 3;
    const waveWidth = (radius * 2) / waveCount;
    for (let i = 0; i < waveCount; i++) {
      const waveX = pos.x + radius - (i + 1) * waveWidth;
      const wavePhase = (Date.now() / 100 + i) % 2 < 1 ? 1 : -1;
      context.lineTo(waveX + waveWidth / 2, pos.y + radius / 2 + wavePhase * 3);
      context.lineTo(waveX, pos.y + radius / 2);
    }

    context.closePath();
    context.fill();

    // Draw eyes
    if (mode !== 'frightened') {
      drawGhostEyes(context, pos.x, pos.y, radius);
    } else {
      // Frightened face
      context.fillStyle = colors.ghostEyes;
      context.beginPath();
      context.arc(pos.x - radius / 3, pos.y - radius / 4, 2, 0, Math.PI * 2);
      context.arc(pos.x + radius / 3, pos.y - radius / 4, 2, 0, Math.PI * 2);
      context.fill();

      // Wavy mouth
      context.strokeStyle = colors.ghostEyes;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(pos.x - radius / 2, pos.y + 2);
      for (let i = 0; i < 4; i++) {
        const mx = pos.x - radius / 2 + (i + 0.5) * (radius / 2);
        const my = pos.y + 2 + (i % 2 === 0 ? 2 : -2);
        context.lineTo(mx, my);
      }
      context.stroke();
    }
  }

  // Draw ghost eyes
  function drawGhostEyes(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ) {
    const { colors } = PACMAN_CONFIG;

    // White of eyes
    context.fillStyle = colors.ghostEyes;
    context.beginPath();
    context.ellipse(x - radius / 3, y - radius / 4, 4, 5, 0, 0, Math.PI * 2);
    context.ellipse(x + radius / 3, y - radius / 4, 4, 5, 0, 0, Math.PI * 2);
    context.fill();

    // Pupils (look toward Pac-Man - simplified to center)
    context.fillStyle = colors.ghostPupil;
    context.beginPath();
    context.arc(x - radius / 3, y - radius / 4, 2, 0, Math.PI * 2);
    context.arc(x + radius / 3, y - radius / 4, 2, 0, Math.PI * 2);
    context.fill();
  }

  // Draw pellet
  function drawPellet(context: CanvasRenderingContext2D, col: number, row: number) {
    const pos = toCanvas(col, row);
    context.fillStyle = PACMAN_CONFIG.colors.dot;
    context.beginPath();
    context.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    context.fill();
  }

  // Draw power pellet
  function drawPowerPellet(context: CanvasRenderingContext2D, col: number, row: number) {
    const pos = toCanvas(col, row);

    // Blinking effect
    if (Math.floor(powerPelletBlink / 10) % 2 === 0) {
      context.fillStyle = PACMAN_CONFIG.colors.powerPellet;
      context.beginPath();
      context.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      context.fill();
    }
  }

  return {
    name: 'PacManRenderSystem',
    priority: SystemPriorities.RENDER,

    init(world: World) {
      ctx = config.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');

      config.canvas.width = width;
      config.canvas.height = height;
    },

    update(world) {
      if (!ctx) return;

      powerPelletBlink++;

      const gameOver = world.getResource<boolean>('gameOver') ?? false;
      const score = world.getResource<number>('score') ?? 0;
      const highScore = world.getResource<number>('highScore') ?? 0;
      const { colors } = PACMAN_CONFIG;

      // Clear with background
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      // Draw maze
      drawMaze(ctx);

      // Draw pellets
      const pellets = world.query(Pellet, GridPosition);
      for (const entity of pellets) {
        const pellet = world.getComponent(entity, Pellet);
        const pos = world.getComponent(entity, GridPosition);
        if (!pellet || !pos || pellet.eaten) continue;

        if (pellet.type === 'power') {
          drawPowerPellet(ctx, pos.col, pos.row);
        } else {
          drawPellet(ctx, pos.col, pos.row);
        }
      }

      // Draw ghosts
      const ghosts = world.query(Ghost, GridPosition);
      for (const entity of ghosts) {
        const ghost = world.getComponent(entity, Ghost);
        const pos = world.getComponent(entity, GridPosition);
        if (!ghost || !pos) continue;

        drawGhost(ctx, pos.col, pos.row, ghost.color, ghost.mode, ghost.frightenedTimer);
      }

      // Draw Pac-Man
      const pacmans = world.query(PacMan, GridPosition);
      for (const entity of pacmans) {
        const pacman = world.getComponent(entity, PacMan);
        const pos = world.getComponent(entity, GridPosition);
        if (!pacman || !pos) continue;

        drawPacMan(ctx, pos.col, pos.row, pacman.direction, pacman.mouthAngle);
      }

      // Draw score
      ctx.fillStyle = colors.score;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE`, 10, 14);
      ctx.fillText(`${score}`, 10, 26);

      // Draw high score
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.highScore;
      ctx.fillText(`HIGH SCORE`, width / 2, 14);
      ctx.fillText(`${highScore}`, width / 2, 26);

      // Draw lives
      const lives = pacmans.length > 0
        ? world.getComponent(pacmans[0]!, PacMan)?.lives ?? 0
        : 0;

      ctx.textAlign = 'right';
      ctx.fillText(`LIVES`, width - 10, 14);

      for (let i = 0; i < lives; i++) {
        const lifeX = width - 30 - i * 20;
        const lifeY = 22;
        ctx.fillStyle = colors.livesColor;
        ctx.beginPath();
        ctx.arc(lifeX, lifeY, 6, 0.2 * Math.PI, 1.8 * Math.PI);
        ctx.lineTo(lifeX, lifeY);
        ctx.fill();
      }

      // CRT scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }

      // Game over screen
      if (gameOver) {
        ctx.fillStyle = colors.gameOverBg;
        ctx.fillRect(0, 0, width, height);

        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        // GAME OVER text
        ctx.shadowColor = colors.gameOverText;
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = colors.gameOverText;
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width / 2, height / 2 - 40);
        ctx.shadowBlur = 0;

        // Final score
        ctx.fillStyle = colors.highScore;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, width / 2, height / 2);

        // High score
        ctx.fillStyle = '#00ffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`HIGH SCORE: ${highScore}`, width / 2, height / 2 + 25);

        // Blinking restart prompt
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.fillText('PRESS SPACE TO PLAY', width / 2, height / 2 + 60);
        }

        ctx.textAlign = 'left';
      }
    },

    cleanup() {
      ctx = null;
    },
  };
}
