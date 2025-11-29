export { createFlappyGame, FLAPPY_CONFIG, type FlappyGameOptions, type FlappyGameInstance } from './game';
export { createBird, createPipePair, getRandomGapY } from './prefabs';
export {
  BirdFlapSystem,
  BirdRotationSystem,
  PipeSpawnSystem,
  PipeCleanupSystem,
  createScoringSystem,
  FlappyCollisionSystem,
  createFlappyGameOverSystem,
  FlappyRestartSystem,
  GroundScrollSystem,
  WingAnimationSystem,
} from './systems';
export { createFlappyRenderSystem, type FlappyRenderConfig } from './render';
