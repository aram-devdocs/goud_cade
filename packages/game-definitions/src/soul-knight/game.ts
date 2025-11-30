import { createWorld, type World } from '@repo/ecs';
import { InputSystem, VelocitySystem, createAudioSystem } from '@repo/systems';
import {
  PlayerMovementSystem,
  PlayerBoundarySystem,
  EnemyAISystem,
  EnemyBoundarySystem,
  PlayerAttackSystem,
  ClearHitEnemiesSystem,
  EnemyDeathSystem,
  createEnemySpawnSystem,
  createSoulKnightGameOverSystem,
  SoulKnightRestartSystem,
  GameStartSystem,
} from './systems';
import { createSoulKnightRenderSystem } from './render';
import { createPlayer, type EnemyState } from './prefabs';

export interface SoulKnightGameOptions {
  canvas: HTMLCanvasElement;
  playSound: (type: string) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
}

export interface SoulKnightGameInstance {
  world: World;
  start: () => void;
  stop: () => void;
  reset: () => void;
  destroy: () => void;
}

/**
 * Create a new Soul Knight game instance.
 */
export function createSoulKnightGame(options: SoulKnightGameOptions): SoulKnightGameInstance {
  const world = createWorld();
  let animationFrame: number | null = null;
  let lastTime = 0;
  let isRunning = false;

  // Load high score
  let initialHighScore = 0;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('soulknight-high-score');
    if (saved) {
      initialHighScore = parseInt(saved, 10) || 0;
    }
  }

  // Initialize resources
  world.setResource('score', 0);
  world.setResource('highScore', initialHighScore);
  world.setResource('gameOver', false);
  world.setResource('gameStarted', false);
  world.setResource('wave', 1);
  world.setResource('spawnTimer', 0);
  world.setResource('enemiesKilledThisWave', 0);
  world.setResource('enemyStates', new Map<number, EnemyState>());
  world.setResource('hitEnemies', new Set<number>());

  // Add systems in priority order
  world.addSystem(InputSystem);
  world.addSystem(GameStartSystem);
  world.addSystem(ClearHitEnemiesSystem);
  world.addSystem(PlayerMovementSystem);
  world.addSystem(SoulKnightRestartSystem);
  world.addSystem(VelocitySystem);
  world.addSystem(PlayerBoundarySystem);
  world.addSystem(EnemyBoundarySystem);
  world.addSystem(EnemyAISystem);
  world.addSystem(PlayerAttackSystem);
  world.addSystem(EnemyDeathSystem);
  world.addSystem(createEnemySpawnSystem(options.onScoreChange));
  world.addSystem(createSoulKnightGameOverSystem(options.onGameOver));
  world.addSystem(createSoulKnightRenderSystem({ canvas: options.canvas }));
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
    world.setResource('wave', 1);
    world.setResource('spawnTimer', 0);
    world.setResource('enemiesKilledThisWave', 0);
    world.setResource('enemyStates', new Map<number, EnemyState>());
    world.setResource('hitEnemies', new Set<number>());

    // Create player
    createPlayer(world);
  }

  function gameLoop(time: number) {
    if (!isRunning) return;

    // Store current frame ID to detect if restart happened during update
    const currentFrame = animationFrame;

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    world.update(deltaTime);

    // Only schedule next frame if no restart happened during update
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

export { SOUL_KNIGHT_CONFIG } from './config';
