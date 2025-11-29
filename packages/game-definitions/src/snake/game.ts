import { createWorld, type World } from '@repo/ecs';
import { InputSystem, createAudioSystem } from '@repo/systems';
import {
  SnakeDirectionSystem,
  createSnakeMovementSystem,
  createSnakeGrowthSystem,
  createGameOverSystem,
  RestartSystem,
} from './systems';
import { createSnakeRenderSystem } from './render';
import { createSnakeHead, createFood, getSnakePositions } from './prefabs';
import { SNAKE_CONFIG } from './config';

export interface SnakeGameOptions {
  canvas: HTMLCanvasElement;
  playSound: (type: string) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
}

export interface SnakeGameInstance {
  world: World;
  start: () => void;
  stop: () => void;
  reset: () => void;
  destroy: () => void;
}

/**
 * Create a new Snake game instance.
 * Returns control methods for starting, stopping, and resetting.
 */
export function createSnakeGame(options: SnakeGameOptions): SnakeGameInstance {
  const world = createWorld();
  let animationFrame: number | null = null;
  let lastTime = 0;
  let isRunning = false;

  // Load high score from localStorage
  let initialHighScore = 0;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) {
      initialHighScore = parseInt(saved, 10) || 0;
    }
  }

  // Initialize resources
  world.setResource('score', 0);
  world.setResource('highScore', initialHighScore);
  world.setResource('gameOver', false);

  // Add systems in priority order
  world.addSystem(InputSystem);
  world.addSystem(SnakeDirectionSystem);
  world.addSystem(RestartSystem);
  world.addSystem(createSnakeMovementSystem());
  // Note: Collision detection is now integrated into movement system
  world.addSystem(createSnakeGrowthSystem(options.onScoreChange));
  world.addSystem(createGameOverSystem(options.onGameOver));
  world.addSystem(createSnakeRenderSystem({ canvas: options.canvas }));
  world.addSystem(createAudioSystem({ playSound: options.playSound }));

  // Handle restart
  world.on('restart', () => {
    reset();
  });

  function initEntities() {
    // Clear all entities
    for (const entity of world.entities.getAll()) {
      world.removeAllComponents(entity);
      world.entities.destroy(entity);
    }

    // Reset resources
    world.setResource('score', 0);
    world.setResource('gameOver', false);
    world.setResource('lastTailPosition', null);
    world.setResource('lastTailDirection', null);

    // Create initial entities
    createSnakeHead(world);
    const snakePositions = getSnakePositions(world);
    createFood(world, snakePositions);
  }

  function gameLoop(time: number) {
    if (!isRunning) return;

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    world.update(deltaTime);

    animationFrame = requestAnimationFrame(gameLoop);
  }

  function start() {
    if (isRunning) return;

    initEntities();
    options.playSound('start');
    isRunning = true;
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function stop() {
    isRunning = false;
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function reset() {
    stop();
    start();
  }

  function destroy() {
    stop();
    world.destroy();
  }

  return { world, start, stop, reset, destroy };
}

// Re-export config for consumers
export { SNAKE_CONFIG } from './config';
