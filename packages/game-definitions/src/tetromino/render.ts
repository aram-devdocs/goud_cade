import { type System, type World, SystemPriorities } from '@repo/ecs';
import { TETROMINO_CONFIG, type TetrominoType } from './config';
import {
  type TetrominoPiece,
  type BoardState,
  getTetrominoBlocks,
  getGhostPosition,
} from './prefabs';

export interface TetrominoRenderConfig {
  canvas: HTMLCanvasElement;
}

/**
 * Custom render system for Tetromino with arcade visual effects.
 */
export function createTetrominoRenderSystem(config: TetrominoRenderConfig): System {
  let ctx: CanvasRenderingContext2D | null = null;
  let flashTime = 0;

  const { width, height } = TETROMINO_CONFIG.canvas;
  const { cellSize, cols, rows, offsetX, offsetY } = TETROMINO_CONFIG.grid;
  const preview = TETROMINO_CONFIG.preview;

  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  function drawBlock(
    x: number,
    y: number,
    size: number,
    color: string,
    isGhost = false
  ) {
    if (!ctx) return;

    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    } else {
      // Main block color
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);

      // Highlight (top-left)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, y, size, 2);
      ctx.fillRect(x, y, 2, size);

      // Shadow (bottom-right)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x, y + size - 2, size, 2);
      ctx.fillRect(x + size - 2, y, 2, size);

      // Inner border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }
  }

  function drawPiece(piece: TetrominoPiece, isGhost = false) {
    const blocks = getTetrominoBlocks(piece);
    const color = isGhost
      ? TETROMINO_CONFIG.colors.ghost
      : TETROMINO_CONFIG.colors[piece.type];

    for (const block of blocks) {
      if (block.row >= 0) {
        // Only draw visible blocks
        const x = offsetX + block.col * cellSize;
        const y = offsetY + block.row * cellSize;
        drawBlock(x, y, cellSize, color, isGhost);
      }
    }
  }

  function drawPreviewPiece(type: TetrominoType) {
    if (!ctx) return;

    const previewPiece: TetrominoPiece = {
      type,
      rotation: 0,
      col: 0,
      row: 0,
    };

    const blocks = getTetrominoBlocks(previewPiece);
    const color = TETROMINO_CONFIG.colors[type];

    // Find bounds of the piece for centering
    let minCol = 4,
      maxCol = 0,
      minRow = 4,
      maxRow = 0;
    for (const block of blocks) {
      minCol = Math.min(minCol, block.col);
      maxCol = Math.max(maxCol, block.col);
      minRow = Math.min(minRow, block.row);
      maxRow = Math.max(maxRow, block.row);
    }

    const pieceWidth = (maxCol - minCol + 1) * preview.cellSize;
    const pieceHeight = (maxRow - minRow + 1) * preview.cellSize;
    const boxSize = 4 * preview.cellSize;

    // Center the piece in the preview box
    const pieceOffsetX = preview.x + (boxSize - pieceWidth) / 2 - minCol * preview.cellSize;
    const pieceOffsetY = preview.y + 20 + (boxSize - pieceHeight) / 2 - minRow * preview.cellSize;

    for (const block of blocks) {
      const x = pieceOffsetX + block.col * preview.cellSize;
      const y = pieceOffsetY + block.row * preview.cellSize;
      drawBlock(x, y, preview.cellSize, color);
    }
  }

  return {
    name: 'TetrominoRenderSystem',
    priority: SystemPriorities.RENDER,

    init(world: World) {
      ctx = config.canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');

      config.canvas.width = width;
      config.canvas.height = height;

      // Listen for line clear to trigger flash
      world.on('lineClear', () => {
        flashTime = Date.now();
      });
    },

    update(world) {
      if (!ctx) return;

      const gameOver = world.getResource<boolean>('gameOver') ?? false;
      const score = world.getResource<number>('score') ?? 0;
      const highScore = world.getResource<number>('highScore') ?? 0;
      const level = world.getResource<number>('level') ?? 1;
      const totalLines = world.getResource<number>('totalLines') ?? 0;
      const piece = world.getResource<TetrominoPiece>('currentPiece');
      const board = world.getResource<BoardState>('board');
      const nextPiece = world.getResource<TetrominoType>('nextPiece');

      // Clear with background
      ctx.fillStyle = TETROMINO_CONFIG.colors.background;
      ctx.fillRect(0, 0, width, height);

      // Flash effect when clearing lines
      const flashAge = Date.now() - flashTime;
      if (flashAge < 150) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * (1 - flashAge / 150)})`;
        ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);
      }

      // Draw playfield border
      ctx.shadowColor = TETROMINO_CONFIG.colors.border;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = TETROMINO_CONFIG.colors.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(offsetX - 3, offsetY - 3, gridWidth + 6, gridHeight + 6);
      ctx.shadowBlur = 0;

      // Draw inner border
      ctx.strokeStyle = TETROMINO_CONFIG.colors.borderInner;
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX - 1, offsetY - 1, gridWidth + 2, gridHeight + 2);

      // Draw grid background
      ctx.fillStyle = TETROMINO_CONFIG.colors.grid;
      ctx.fillRect(offsetX, offsetY, gridWidth, gridHeight);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * cellSize, offsetY);
        ctx.lineTo(offsetX + x * cellSize, offsetY + gridHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * cellSize);
        ctx.lineTo(offsetX + gridWidth, offsetY + y * cellSize);
        ctx.stroke();
      }

      // Draw settled blocks
      if (board) {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cell = board[row]?.[col];
            if (cell) {
              const x = offsetX + col * cellSize;
              const y = offsetY + row * cellSize;
              drawBlock(x, y, cellSize, TETROMINO_CONFIG.colors[cell]);
            }
          }
        }
      }

      // Draw ghost piece
      if (piece && board && !gameOver) {
        const ghost = getGhostPosition(piece, board, rows, cols);
        if (ghost.row !== piece.row) {
          drawPiece(ghost, true);
        }
      }

      // Draw current piece
      if (piece && !gameOver) {
        drawPiece(piece);
      }

      // Draw UI panel (right side)
      // Next piece label
      ctx.fillStyle = TETROMINO_CONFIG.colors.text;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('NEXT', preview.x, preview.y - 5);

      // Next piece box
      ctx.strokeStyle = TETROMINO_CONFIG.colors.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(preview.x - 5, preview.y + 5, 4 * preview.cellSize + 10, 4 * preview.cellSize + 10);

      // Draw next piece
      if (nextPiece) {
        drawPreviewPiece(nextPiece);
      }

      // Score
      ctx.fillStyle = TETROMINO_CONFIG.colors.score;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('SCORE', preview.x, preview.y + 90);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(String(score), preview.x, preview.y + 108);

      // High score
      ctx.fillStyle = TETROMINO_CONFIG.colors.text;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('HIGH', preview.x, preview.y + 140);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(String(highScore), preview.x, preview.y + 158);

      // Level
      ctx.fillStyle = TETROMINO_CONFIG.colors.level;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('LEVEL', preview.x, preview.y + 190);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(String(level), preview.x, preview.y + 208);

      // Lines
      ctx.fillStyle = TETROMINO_CONFIG.colors.lines;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('LINES', preview.x, preview.y + 240);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(String(totalLines), preview.x, preview.y + 258);

      // CRT scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }

      // Game over screen
      if (gameOver) {
        ctx.fillStyle = TETROMINO_CONFIG.colors.gameOverBg;
        ctx.fillRect(0, 0, width, height);

        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        // GAME OVER text
        ctx.shadowColor = TETROMINO_CONFIG.colors.gameOverText;
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = TETROMINO_CONFIG.colors.gameOverText;
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width / 2, height / 2 - 50);
        ctx.shadowBlur = 0;

        // Final score
        ctx.fillStyle = TETROMINO_CONFIG.colors.score;
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(`SCORE: ${score}`, width / 2, height / 2);

        // Level and lines
        ctx.fillStyle = TETROMINO_CONFIG.colors.level;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`LEVEL ${level} - ${totalLines} LINES`, width / 2, height / 2 + 25);

        // High score
        ctx.fillStyle = '#00ffff';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`HIGH SCORE: ${highScore}`, width / 2, height / 2 + 55);

        // Blinking restart prompt
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.fillStyle = TETROMINO_CONFIG.colors.restartText;
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillText('PRESS SPACE TO PLAY', width / 2, height / 2 + 90);
        }

        ctx.textAlign = 'left';
      }
    },

    cleanup() {
      ctx = null;
    },
  };
}
