import type { World, Entity } from '@repo/ecs';
import { Player, InputReceiver, DirectionInput, ActionInput } from '@repo/components';
import { TETROMINO_SHAPES, type TetrominoType } from './config';

/**
 * Tetromino piece state stored as a resource
 */
export interface TetrominoPiece {
  type: TetrominoType;
  rotation: number; // 0-3
  col: number; // Grid column position
  row: number; // Grid row position
}

/**
 * Board state - 2D array of settled blocks
 * null means empty, string is the color/type
 */
export type BoardState = (TetrominoType | null)[][];

/**
 * Create empty board state
 */
export function createEmptyBoard(rows: number, cols: number): BoardState {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null) as (TetrominoType | null)[]);
}

/**
 * Get the block positions for a tetromino at a given position and rotation
 */
export function getTetrominoBlocks(piece: TetrominoPiece): { row: number; col: number }[] {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  if (!shape) return [];

  return shape.map(([rowOffset, colOffset]) => ({
    row: piece.row + (rowOffset ?? 0),
    col: piece.col + (colOffset ?? 0),
  }));
}

/**
 * Check if a piece position is valid (no collisions)
 */
export function isValidPosition(
  piece: TetrominoPiece,
  board: BoardState,
  rows: number,
  cols: number
): boolean {
  const blocks = getTetrominoBlocks(piece);

  for (const block of blocks) {
    // Check bounds
    if (block.col < 0 || block.col >= cols) return false;
    if (block.row < 0 || block.row >= rows) return false;

    // Check collision with settled blocks
    if (board[block.row]?.[block.col] !== null) return false;
  }

  return true;
}

/**
 * Get a random tetromino type
 */
export function getRandomTetrominoType(): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  return types[Math.floor(Math.random() * types.length)]!;
}

/**
 * Create a new tetromino piece at spawn position
 */
export function createNewPiece(type: TetrominoType, cols: number): TetrominoPiece {
  return {
    type,
    rotation: 0,
    col: Math.floor(cols / 2) - 2, // Center horizontally
    row: 0, // Top of board
  };
}

/**
 * Lock a piece into the board
 */
export function lockPiece(piece: TetrominoPiece, board: BoardState): void {
  const blocks = getTetrominoBlocks(piece);

  for (const block of blocks) {
    if (block.row >= 0 && block.row < board.length) {
      const row = board[block.row];
      if (row && block.col >= 0 && block.col < row.length) {
        row[block.col] = piece.type;
      }
    }
  }
}

/**
 * Clear completed lines and return count
 */
export function clearLines(board: BoardState, cols: number): number {
  let linesCleared = 0;

  for (let row = board.length - 1; row >= 0; row--) {
    const boardRow = board[row];
    if (boardRow && boardRow.every((cell) => cell !== null)) {
      // Remove the completed row
      board.splice(row, 1);
      // Add new empty row at top
      board.unshift(Array(cols).fill(null) as (TetrominoType | null)[]);
      linesCleared++;
      row++; // Check this row again since rows shifted down
    }
  }

  return linesCleared;
}

/**
 * Calculate ghost piece position (where piece would land)
 */
export function getGhostPosition(
  piece: TetrominoPiece,
  board: BoardState,
  rows: number,
  cols: number
): TetrominoPiece {
  const ghost = { ...piece };

  while (isValidPosition({ ...ghost, row: ghost.row + 1 }, board, rows, cols)) {
    ghost.row++;
  }

  return ghost;
}

/**
 * Try to rotate a piece with wall kicks
 */
export function tryRotate(
  piece: TetrominoPiece,
  direction: 1 | -1,
  board: BoardState,
  rows: number,
  cols: number
): TetrominoPiece | null {
  const newRotation = (piece.rotation + direction + 4) % 4;
  const rotated = { ...piece, rotation: newRotation };

  // Try basic rotation
  if (isValidPosition(rotated, board, rows, cols)) {
    return rotated;
  }

  // Wall kick offsets to try
  const kicks = [
    { col: -1, row: 0 },
    { col: 1, row: 0 },
    { col: 0, row: -1 },
    { col: -1, row: -1 },
    { col: 1, row: -1 },
    { col: -2, row: 0 },
    { col: 2, row: 0 },
  ];

  for (const kick of kicks) {
    const kicked = {
      ...rotated,
      col: rotated.col + kick.col,
      row: rotated.row + kick.row,
    };
    if (isValidPosition(kicked, board, rows, cols)) {
      return kicked;
    }
  }

  return null; // Rotation not possible
}

/**
 * Create the input controller entity for tetromino game.
 */
export function createTetrominoController(world: World): Entity {
  const entity = world.entities.create();

  world.addComponent(entity, Player, { id: 0 });
  world.addComponent(entity, InputReceiver, { active: true, playerId: 0 });
  world.addComponent(entity, DirectionInput, {
    direction: null,
    lastDirection: null,
    bufferedDirection: null,
  });
  world.addComponent(entity, ActionInput, {
    action: false,
    actionJustPressed: false,
    interact: false,
    back: false,
  });

  return entity;
}
