export { createSnakeGame, SNAKE_CONFIG, type SnakeGameOptions, type SnakeGameInstance } from './game';
export { createSnakeHead, createSnakeSegment, createFood, getSnakePositions } from './prefabs';
export {
  SnakeDirectionSystem,
  createSnakeMovementSystem,
  SnakeCollisionSystem,
  createSnakeGrowthSystem,
  createGameOverSystem,
  RestartSystem,
} from './systems';
export { createSnakeRenderSystem, type SnakeRenderConfig } from './render';
