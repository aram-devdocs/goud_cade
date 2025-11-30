import { createWorld, type World } from '@repo/ecs';
import { InputSystem, createAudioSystem } from '@repo/systems';
import {
  createTetrominoMovementSystem,
  createTetrominoRotationSystem,
  createTetrominoFallSystem,
  createTetrominoLockSystem,
  createHardDropSystem,
  createTetrominoGameOverSystem,
  TetrominoRestartSystem,
} from './systems';
import { createTetrominoRenderSystem } from './render';
import {
  createTetrominoController,
  createEmptyBoard,
  createNewPiece,
  getRandomTetrominoType,
} from './prefabs';
import { TETROMINO_CONFIG } from './config';

export interface TetrominoGameOptions {
  canvas: HTMLCanvasElement;
  playSound: (type: string) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
}

export interface TetrominoGameInstance {
  world: World;
  start: () => void;
  stop: () => void;
  reset: () => void;
  destroy: () => void;
}

/**
 * Create a new Tetromino game instance.
 * Returns control methods for starting, stopping, and resetting.
 */
export function createTetrominoGame(options: TetrominoGameOptions): TetrominoGameInstance {
  const world = createWorld();
  let animationFrame: number | null = null;
  let lastTime = 0;
  let isRunning = false;

  const { cols, rows } = TETROMINO_CONFIG.grid;

  // Load high score from localStorage
  let initialHighScore = 0;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tetromino-high-score');
    if (saved) {
      initialHighScore = parseInt(saved, 10) || 0;
    }
  }

  // Initialize resources
  world.setResource('score', 0);
  world.setResource('highScore', initialHighScore);
  world.setResource('level', 1);
  world.setResource('totalLines', 0);
  world.setResource('gameOver', false);
  world.setResource('board', createEmptyBoard(rows, cols));
  world.setResource('currentPiece', null);
  world.setResource('nextPiece', getRandomTetrominoType());
  world.setResource('lastFallTime', Date.now());

  // Add systems in priority order
  world.addSystem(InputSystem);
  world.addSystem(createTetrominoMovementSystem());
  world.addSystem(createTetrominoRotationSystem());
  world.addSystem(createHardDropSystem());
  world.addSystem(TetrominoRestartSystem);
  world.addSystem(createTetrominoFallSystem());
  world.addSystem(createTetrominoLockSystem(options.onScoreChange));
  world.addSystem(createTetrominoGameOverSystem(options.onGameOver));
  world.addSystem(createTetrominoRenderSystem({ canvas: options.canvas }));
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
    world.setResource('level', 1);
    world.setResource('totalLines', 0);
    world.setResource('gameOver', false);
    world.setResource('board', createEmptyBoard(rows, cols));
    world.setResource('lastFallTime', Date.now());

    // Generate first pieces
    const firstType = getRandomTetrominoType();
    world.setResource('currentPiece', createNewPiece(firstType, cols));
    world.setResource('nextPiece', getRandomTetrominoType());

    // Create input controller entity
    createTetrominoController(world);
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
export { TETROMINO_CONFIG } from './config';
