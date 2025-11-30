/**
 * Pac-Man game configuration constants.
 * All visual and gameplay parameters in one place.
 */
export const PACMAN_CONFIG = {
  canvas: {
    width: 400,
    height: 360,
  },
  grid: {
    cols: 19,
    rows: 21,
    cellSize: 16,
    offsetX: 48, // Center the maze
    offsetY: 24,
  },
  gameplay: {
    pacmanSpeed: 100, // ms per move
    ghostSpeed: 120, // ms per move (slightly slower)
    frightenedSpeed: 200, // ghosts slow when frightened
    frightenedDuration: 8000, // 8 seconds
    blinkStart: 5000, // Start blinking with 3s left
    pointsPerDot: 10,
    pointsPerPowerPellet: 50,
    pointsPerGhost: 200, // Doubles for each ghost eaten in sequence
    lives: 3,
    startPosition: { col: 9, row: 15 },
    startDirection: 'LEFT' as const,
  },
  ghosts: {
    blinky: { col: 9, row: 8, color: '#FF0000', name: 'Blinky' }, // Red - chases directly
    pinky: { col: 8, row: 9, color: '#FFB8FF', name: 'Pinky' }, // Pink - ambushes
    inky: { col: 9, row: 9, color: '#00FFFF', name: 'Inky' }, // Cyan - unpredictable
    clyde: { col: 10, row: 9, color: '#FFB852', name: 'Clyde' }, // Orange - shy
  },
  colors: {
    background: '#000000',
    maze: '#2121DE',
    mazeOutline: '#0000AA',
    dot: '#FFB897',
    powerPellet: '#FFB897',
    pacman: '#FFFF00',
    pacmanMouth: '#000000',
    frightenedGhost: '#2121DE',
    frightenedGhostBlink: '#FFFFFF',
    ghostEyes: '#FFFFFF',
    ghostPupil: '#0000FF',
    score: '#FFFFFF',
    highScore: '#00FFFF',
    livesColor: '#FFFF00',
    readyText: '#FFFF00',
    gameOverText: '#FF0000',
    gameOverBg: 'rgba(0, 0, 0, 0.85)',
  },
  // Classic Pac-Man maze layout
  // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet, 4 = ghost house, 5 = tunnel
  maze: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
    [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [5, 0, 0, 0, 2, 0, 0, 1, 4, 4, 4, 1, 0, 0, 2, 0, 0, 0, 5],
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
    [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
    [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
    [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
} as const;

export type PacmanConfig = typeof PACMAN_CONFIG;
export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';
