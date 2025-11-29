/**
 * Flappy Bird game configuration constants.
 */
export const FLAPPY_CONFIG = {
  canvas: {
    width: 400,
    height: 360,
  },
  bird: {
    x: 80,
    width: 34,
    height: 24,
    flapVelocity: -4,
  },
  physics: {
    gravity: 0.15,
    maxFallVelocity: 4,
  },
  pipes: {
    width: 52,
    gap: 140,
    speed: 2,
    spawnInterval: 150, // frames
    minHeight: 50,
  },
  ground: {
    height: 56,
    scrollSpeed: 2,
  },
  colors: {
    sky: '#4EC0CA',
    skyGradient: '#70C5CE',
    cloud: '#FFFFFF',
    bird: '#F8E81C',
    birdWing: '#F5A623',
    birdBeak: '#FA6900',
    birdEye: '#FFFFFF',
    birdOutline: '#D4A017',
    pipeGreen: '#73BF2E',
    pipeDarkGreen: '#558B2F',
    pipeHighlight: '#8BC34A',
    ground: '#DED895',
    groundGrass: '#73BF2E',
    groundDetail: '#C4B778',
    white: '#FFFFFF',
    black: '#000000',
    gameOverText: '#FF6B6B',
    highScoreText: '#FFD700',
  },
} as const;

export type FlappyConfig = typeof FLAPPY_CONFIG;
