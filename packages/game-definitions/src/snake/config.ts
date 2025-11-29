/**
 * Snake game configuration constants.
 * All visual and gameplay parameters in one place.
 */
export const SNAKE_CONFIG = {
  canvas: {
    width: 400,
    height: 360,
  },
  grid: {
    cols: 20,
    rows: 18,
    cellSize: 20,
  },
  gameplay: {
    initialSpeed: 150, // ms per move
    minSpeed: 80,
    speedDecrease: 5, // ms faster per 50 points
    pointsPerFood: 10,
    initialSnakeLength: 1,
    startPosition: { col: 10, row: 9 },
    startDirection: 'RIGHT' as const,
  },
  colors: {
    background: '#000000',
    grid: '#0f2f0f',
    border: '#00ff00',
    borderInner: '#005500',
    snakeHead: '#00ff00',
    snakeBody: (brightness: number) => `rgb(0, ${Math.floor(255 * brightness)}, 0)`,
    food: '#ff0000',
    score: '#00ff00',
    highScore: '#ffff00',
    gameOverBg: 'rgba(0, 0, 0, 0.85)',
    gameOverText: '#ff0000',
    restartText: '#ffffff',
  },
} as const;

export type SnakeConfig = typeof SNAKE_CONFIG;
