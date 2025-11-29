import { createWorld, type World } from '@repo/ecs';
import { InputSystem, GravitySystem, VelocitySystem, createAudioSystem } from '@repo/systems';
import {
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
import { createFlappyRenderSystem } from './render';
import { createBird } from './prefabs';
import { FLAPPY_CONFIG } from './config';

export interface FlappyGameOptions {
  canvas: HTMLCanvasElement;
  playSound: (type: string) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
}

export interface FlappyGameInstance {
  world: World;
  start: () => void;
  stop: () => void;
  reset: () => void;
  destroy: () => void;
}

/**
 * Create a new Flappy Bird game instance.
 */
export function createFlappyGame(options: FlappyGameOptions): FlappyGameInstance {
  const world = createWorld();
  let animationFrame: number | null = null;
  let lastTime = 0;
  let isRunning = false;

  // Load high score
  let initialHighScore = 0;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('flappybird-high-score');
    if (saved) {
      initialHighScore = parseInt(saved, 10) || 0;
    }
  }

  // Initialize resources
  world.setResource('score', 0);
  world.setResource('highScore', initialHighScore);
  world.setResource('gameOver', false);
  world.setResource('gameStarted', false);
  world.setResource('groundOffset', 0);
  world.setResource('wingFrame', 0);
  world.setResource('pipeSpawnFrame', 0);
  world.setResource('wingAnimFrame', 0);

  // Add systems in priority order
  world.addSystem(InputSystem);
  world.addSystem(BirdFlapSystem);
  world.addSystem(FlappyRestartSystem);
  world.addSystem(GravitySystem);
  world.addSystem(VelocitySystem);
  world.addSystem(BirdRotationSystem);
  world.addSystem(PipeSpawnSystem);
  world.addSystem(PipeCleanupSystem);
  world.addSystem(createScoringSystem(options.onScoreChange));
  world.addSystem(FlappyCollisionSystem);
  world.addSystem(createFlappyGameOverSystem(options.onGameOver));
  world.addSystem(GroundScrollSystem);
  world.addSystem(WingAnimationSystem);
  world.addSystem(createFlappyRenderSystem({ canvas: options.canvas }));
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
    world.setResource('gameStarted', false);
    world.setResource('groundOffset', 0);
    world.setResource('wingFrame', 0);
    world.setResource('pipeSpawnFrame', 0);
    world.setResource('wingAnimFrame', 0);

    // Create bird
    createBird(world);
  }

  function gameLoop(time: number) {
    if (!isRunning) return;

    // Store current frame ID to detect if restart happened during update
    const currentFrame = animationFrame;

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    world.update(deltaTime);

    // Only schedule next frame if no restart happened during update
    // (restart changes animationFrame via stop() -> start())
    if (isRunning && animationFrame === currentFrame) {
      animationFrame = requestAnimationFrame(gameLoop);
    }
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

export { FLAPPY_CONFIG } from './config';
