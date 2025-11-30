import { createWorld, type World } from '@repo/ecs';
import { InputSystem, createAudioSystem } from '@repo/systems';
import {
  PacManDirectionSystem,
  createPacManMovementSystem,
  createGhostMovementSystem,
  createPelletSystem,
  createGhostCollisionSystem,
  createPacManGameOverSystem,
  ResetPositionsSystem,
  PacManRestartSystem,
} from './systems';
import { createPacManRenderSystem } from './render';
import { createPacMan, createAllGhosts, createMazePellets } from './prefabs';
import { PACMAN_CONFIG } from './config';

export interface PacManGameOptions {
  canvas: HTMLCanvasElement;
  playSound: (type: string) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
}

export interface PacManGameInstance {
  world: World;
  start: () => void;
  stop: () => void;
  reset: () => void;
  destroy: () => void;
}

/**
 * Create a new Pac-Man game instance.
 * Returns control methods for starting, stopping, and resetting.
 */
export function createPacManGame(options: PacManGameOptions): PacManGameInstance {
  const world = createWorld();
  let animationFrame: number | null = null;
  let lastTime = 0;
  let isRunning = false;

  // Load high score from localStorage
  let initialHighScore = 0;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pacman-high-score');
    if (saved) {
      initialHighScore = parseInt(saved, 10) || 0;
    }
  }

  // Count total pellets in maze
  let totalPellets = 0;
  for (const row of PACMAN_CONFIG.maze) {
    for (const cell of row) {
      if (cell === 2 || cell === 3) totalPellets++;
    }
  }

  // Initialize resources
  world.setResource('score', 0);
  world.setResource('highScore', initialHighScore);
  world.setResource('gameOver', false);
  world.setResource('levelComplete', false);
  world.setResource('pelletsLeft', totalPellets);

  // Add systems in priority order
  world.addSystem(InputSystem);
  world.addSystem(PacManDirectionSystem);
  world.addSystem(PacManRestartSystem);
  world.addSystem(createPacManMovementSystem());
  world.addSystem(createGhostMovementSystem());
  world.addSystem(createPelletSystem(options.onScoreChange));
  world.addSystem(createGhostCollisionSystem(options.onScoreChange));
  world.addSystem(createPacManGameOverSystem(options.onGameOver));
  world.addSystem(ResetPositionsSystem);
  world.addSystem(createPacManRenderSystem({ canvas: options.canvas }));
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
    world.setResource('levelComplete', false);
    world.setResource('pelletsLeft', totalPellets);

    // Create initial entities
    createPacMan(world);
    createAllGhosts(world);
    createMazePellets(world);
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
export { PACMAN_CONFIG } from './config';
