/**
 * Tetromino (Tetris) game configuration constants.
 * All visual and gameplay parameters in one place.
 */

// Tetromino piece types
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// Tetromino shapes for each rotation state (4 rotations each)
// Each shape is a 4x4 grid represented as array of [row, col] offsets
export const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 1], [1, 1], [2, 1], [3, 1]],
  ],
  O: [
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [1, 2]],
  ],
  T: [
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  S: [
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 1], [1, 2], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  J: [
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
  ],
  L: [
    [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [1, 2], [2, 0]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
  ],
};

export const TETROMINO_CONFIG = {
  canvas: {
    width: 400,
    height: 360,
  },
  grid: {
    cols: 10,
    rows: 20,
    cellSize: 16,
    offsetX: 80, // Center the playfield
    offsetY: 20,
  },
  preview: {
    x: 280, // Next piece preview position
    y: 60,
    cellSize: 14,
  },
  gameplay: {
    initialFallSpeed: 1000, // ms per drop
    minFallSpeed: 100,
    softDropSpeed: 50,
    lockDelay: 500, // ms before piece locks
    linesPerLevel: 10,
    pointsPerLine: [0, 100, 300, 500, 800], // 0, 1, 2, 3, 4 lines
  },
  colors: {
    background: '#000000',
    grid: '#1a1a2e',
    border: '#00ffff',
    borderInner: '#005555',
    ghost: 'rgba(255, 255, 255, 0.2)',
    // Piece colors
    I: '#00ffff', // Cyan
    O: '#ffff00', // Yellow
    T: '#aa00ff', // Purple
    S: '#00ff00', // Green
    Z: '#ff0000', // Red
    J: '#0000ff', // Blue
    L: '#ff8800', // Orange
    // UI colors
    text: '#ffffff',
    score: '#00ffff',
    level: '#ffff00',
    lines: '#00ff00',
    gameOverBg: 'rgba(0, 0, 0, 0.85)',
    gameOverText: '#ff0000',
    restartText: '#ffffff',
  },
} as const;

export type TetrominoConfig = typeof TETROMINO_CONFIG;
