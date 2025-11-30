import { type System, SystemPriorities } from '@repo/ecs';
import { DirectionInput, ActionInput } from '@repo/components';
import { TETROMINO_CONFIG } from './config';
import {
  type TetrominoPiece,
  type BoardState,
  isValidPosition,
  lockPiece,
  clearLines,
  createNewPiece,
  getRandomTetrominoType,
  tryRotate,
} from './prefabs';

const { cols, rows } = TETROMINO_CONFIG.grid;

/**
 * Movement system - handles left/right movement and soft drop
 */
export function createTetrominoMovementSystem(): System {
  let lastMoveTime = 0;
  const moveDelay = 100; // ms between moves when holding

  return {
    name: 'TetrominoMovementSystem',
    priority: SystemPriorities.INPUT + 10,

    init(world) {
      world.on('restart', () => {
        lastMoveTime = 0;
      });
    },

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const piece = world.getResource<TetrominoPiece>('currentPiece');
      const board = world.getResource<BoardState>('board');
      if (!piece || !board) return;

      const now = Date.now();
      if (now - lastMoveTime < moveDelay) return;

      // Find entity with DirectionInput
      const entities = world.query(DirectionInput);
      for (const entity of entities) {
        const input = world.getComponent(entity, DirectionInput);
        if (!input?.direction) continue;

        let newPiece: TetrominoPiece | null = null;

        switch (input.direction) {
          case 'LEFT':
            newPiece = { ...piece, col: piece.col - 1 };
            break;
          case 'RIGHT':
            newPiece = { ...piece, col: piece.col + 1 };
            break;
          case 'DOWN':
            // Soft drop - accelerate falling
            newPiece = { ...piece, row: piece.row + 1 };
            if (newPiece && isValidPosition(newPiece, board, rows, cols)) {
              world.setResource('currentPiece', newPiece);
              world.setResource('lastFallTime', Date.now()); // Reset fall timer
              world.emit('playSound', { type: 'move' });
            }
            lastMoveTime = now;
            return;
        }

        if (newPiece && isValidPosition(newPiece, board, rows, cols)) {
          world.setResource('currentPiece', newPiece);
          world.emit('playSound', { type: 'move' });
          lastMoveTime = now;
        }
      }
    },
  };
}

/**
 * Rotation system - handles piece rotation with wall kicks
 */
export function createTetrominoRotationSystem(): System {
  let lastRotateTime = 0;
  const rotateDelay = 150; // ms between rotations

  return {
    name: 'TetrominoRotationSystem',
    priority: SystemPriorities.INPUT + 11,

    init(world) {
      world.on('restart', () => {
        lastRotateTime = 0;
      });
    },

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const piece = world.getResource<TetrominoPiece>('currentPiece');
      const board = world.getResource<BoardState>('board');
      if (!piece || !board) return;

      const now = Date.now();
      if (now - lastRotateTime < rotateDelay) return;

      // Find entity with ActionInput for rotation (using action button)
      const entities = world.query(ActionInput);
      for (const entity of entities) {
        const input = world.getComponent(entity, ActionInput);
        if (input?.actionJustPressed) {
          const rotated = tryRotate(piece, 1, board, rows, cols);
          if (rotated) {
            world.setResource('currentPiece', rotated);
            world.emit('playSound', { type: 'rotate' });
            lastRotateTime = now;
          }
        }
      }

      // Also handle UP direction as rotation
      const dirEntities = world.query(DirectionInput);
      for (const entity of dirEntities) {
        const input = world.getComponent(entity, DirectionInput);
        if (input?.direction === 'UP') {
          const rotated = tryRotate(piece, 1, board, rows, cols);
          if (rotated) {
            world.setResource('currentPiece', rotated);
            world.emit('playSound', { type: 'rotate' });
            lastRotateTime = now;
          }
        }
      }
    },
  };
}

/**
 * Gravity/Fall system - pieces fall over time
 */
export function createTetrominoFallSystem(): System {
  return {
    name: 'TetrominoFallSystem',
    priority: SystemPriorities.PHYSICS,

    init(world) {
      world.setResource('lastFallTime', Date.now());
    },

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const piece = world.getResource<TetrominoPiece>('currentPiece');
      const board = world.getResource<BoardState>('board');
      if (!piece || !board) return;

      const level = world.getResource<number>('level') ?? 1;
      const lastFallTime = world.getResource<number>('lastFallTime') ?? Date.now();

      // Calculate fall speed based on level
      const { initialFallSpeed, minFallSpeed } = TETROMINO_CONFIG.gameplay;
      const fallSpeed = Math.max(minFallSpeed, initialFallSpeed - (level - 1) * 80);

      const now = Date.now();
      if (now - lastFallTime < fallSpeed) return;

      // Try to move piece down
      const newPiece = { ...piece, row: piece.row + 1 };

      if (isValidPosition(newPiece, board, rows, cols)) {
        world.setResource('currentPiece', newPiece);
        world.setResource('lastFallTime', now);
      } else {
        // Piece can't move down - lock it
        world.emit('lockPiece');
      }
    },
  };
}

/**
 * Lock system - handles locking pieces and spawning new ones
 */
export function createTetrominoLockSystem(onScoreChange?: (score: number) => void): System {
  return {
    name: 'TetrominoLockSystem',
    priority: SystemPriorities.GAME_LOGIC,

    init(world) {
      world.on('lockPiece', () => {
        const piece = world.getResource<TetrominoPiece>('currentPiece');
        const board = world.getResource<BoardState>('board');
        if (!piece || !board) return;

        // Lock the piece into the board
        lockPiece(piece, board);
        world.emit('playSound', { type: 'lock' });

        // Check for completed lines
        const linesCleared = clearLines(board, cols);
        if (linesCleared > 0) {
          // Update score
          const currentScore = world.getResource<number>('score') ?? 0;
          const level = world.getResource<number>('level') ?? 1;
          const points = (TETROMINO_CONFIG.gameplay.pointsPerLine[linesCleared] ?? 0) * level;
          const newScore = currentScore + points;
          world.setResource('score', newScore);
          onScoreChange?.(newScore);

          // Update total lines
          const totalLines = world.getResource<number>('totalLines') ?? 0;
          const newTotalLines = totalLines + linesCleared;
          world.setResource('totalLines', newTotalLines);

          // Check for level up
          const { linesPerLevel } = TETROMINO_CONFIG.gameplay;
          const newLevel = Math.floor(newTotalLines / linesPerLevel) + 1;
          if (newLevel > (world.getResource<number>('level') ?? 1)) {
            world.setResource('level', newLevel);
            world.emit('playSound', { type: 'levelUp' });
          } else {
            world.emit('playSound', { type: 'lineClear' });
          }
        }

        // Spawn next piece
        const nextType = world.getResource<string>('nextPiece') as TetrominoPiece['type'];
        const newPiece = createNewPiece(nextType, cols);
        world.setResource('currentPiece', newPiece);
        world.setResource('nextPiece', getRandomTetrominoType());
        world.setResource('lastFallTime', Date.now());

        // Check if new piece is valid (game over if not)
        if (!isValidPosition(newPiece, board, rows, cols)) {
          world.emit('gameOver', { reason: 'overflow' });
        }
      });
    },

    update() {},
  };
}

/**
 * Hard drop system - instantly drop piece to bottom
 */
export function createHardDropSystem(): System {
  let lastDropTime = 0;
  const dropDelay = 200; // Prevent accidental double drops

  return {
    name: 'HardDropSystem',
    priority: SystemPriorities.INPUT + 12,

    init(world) {
      world.on('restart', () => {
        lastDropTime = 0;
      });
    },

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const piece = world.getResource<TetrominoPiece>('currentPiece');
      const board = world.getResource<BoardState>('board');
      if (!piece || !board) return;

      const now = Date.now();
      if (now - lastDropTime < dropDelay) return;

      // Check for interact button (hard drop)
      const entities = world.query(ActionInput);
      for (const entity of entities) {
        const input = world.getComponent(entity, ActionInput);
        if (input?.interact) {
          // Drop piece to bottom
          const newPiece = { ...piece };
          while (isValidPosition({ ...newPiece, row: newPiece.row + 1 }, board, rows, cols)) {
            newPiece.row++;
          }

          world.setResource('currentPiece', newPiece);
          world.emit('playSound', { type: 'hardDrop' });
          world.emit('lockPiece');
          lastDropTime = now;
        }
      }
    },
  };
}

/**
 * Game over handler system.
 */
export function createTetrominoGameOverSystem(onGameOver?: () => void): System {
  return {
    name: 'TetrominoGameOverSystem',
    priority: SystemPriorities.GAME_LOGIC + 20,

    init(world) {
      world.on('gameOver', () => {
        world.setResource('gameOver', true);

        // Update high score
        const score = world.getResource<number>('score') ?? 0;
        const highScore = world.getResource<number>('highScore') ?? 0;
        if (score > highScore) {
          world.setResource('highScore', score);
          if (typeof window !== 'undefined') {
            localStorage.setItem('tetromino-high-score', String(score));
          }
        }

        world.emit('playSound', { type: 'gameOver' });
        onGameOver?.();
      });
    },

    update() {},
  };
}

/**
 * Restart handler system - listens for action input to restart.
 */
export const TetrominoRestartSystem: System = {
  name: 'TetrominoRestartSystem',
  priority: SystemPriorities.INPUT + 20,

  update(world) {
    if (!world.getResource<boolean>('gameOver')) return;

    // Find entity with ActionInput
    const entities = world.query(ActionInput);
    for (const entity of entities) {
      const input = world.getComponent(entity, ActionInput);
      if (input?.actionJustPressed) {
        world.emit('restart');
      }
    }
  },
};
