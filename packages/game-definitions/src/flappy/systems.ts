import { type System, type World, SystemPriorities } from '@repo/ecs';
import {
  Transform,
  Velocity,
  Gravity,
  Sprite,
  Collider,
  Player,
  ActionInput,
  Pipe,
} from '@repo/components';
import { FLAPPY_CONFIG } from './config';
import { createPipePair, getRandomGapY } from './prefabs';

/**
 * Bird flap system - handles action input for flapping.
 */
export const BirdFlapSystem: System = {
  name: 'BirdFlapSystem',
  priority: SystemPriorities.INPUT + 10,

  update(world) {
    if (world.getResource<boolean>('gameOver')) return;

    const birds = world.query(Player, ActionInput, Velocity, Gravity);

    for (const entity of birds) {
      const input = world.getComponent(entity, ActionInput);
      if (!input?.actionJustPressed) continue;

      const velocity = world.getComponent(entity, Velocity)!;
      const gravity = world.getComponent(entity, Gravity)!;

      // Start the game on first flap
      if (!world.getResource<boolean>('gameStarted')) {
        world.setResource('gameStarted', true);
        world.addComponent(entity, Gravity, { ...gravity, enabled: true });
      }

      // Apply flap velocity
      world.addComponent(entity, Velocity, {
        ...velocity,
        y: FLAPPY_CONFIG.bird.flapVelocity,
      });

      world.emit('playSound', { type: 'flap' });
    }
  },
};

/**
 * Bird rotation system - rotates bird based on velocity.
 */
export const BirdRotationSystem: System = {
  name: 'BirdRotationSystem',
  priority: SystemPriorities.POST_PHYSICS,

  update(world) {
    const birds = world.query(Player, Velocity, Transform);

    for (const entity of birds) {
      const velocity = world.getComponent(entity, Velocity)!;
      const transform = world.getComponent(entity, Transform)!;

      // Rotation: -30 (up) to +90 (down) based on velocity
      const rotation = Math.min(Math.max(velocity.y * 20, -30), 90);

      world.addComponent(entity, Transform, {
        ...transform,
        rotation,
      });
    }
  },
};

/**
 * Pipe spawning system.
 * Uses world resource 'pipeSpawnFrame' for frame counting (reset on restart).
 */
export const PipeSpawnSystem: System = {
  name: 'PipeSpawnSystem',
  priority: SystemPriorities.GAME_LOGIC,

  update(world) {
    if (!world.getResource<boolean>('gameStarted')) return;
    if (world.getResource<boolean>('gameOver')) return;

    const frameCount = (world.getResource<number>('pipeSpawnFrame') ?? 0) + 1;
    world.setResource('pipeSpawnFrame', frameCount);

    if (frameCount % FLAPPY_CONFIG.pipes.spawnInterval === 0) {
      const gapY = getRandomGapY();
      createPipePair(world, gapY);
    }
  },
};

/**
 * Pipe cleanup system - removes off-screen pipes.
 */
export const PipeCleanupSystem: System = {
  name: 'PipeCleanupSystem',
  priority: SystemPriorities.GAME_LOGIC + 5,

  update(world) {
    const pipes = world.query(Pipe, Transform);

    for (const entity of pipes) {
      const transform = world.getComponent(entity, Transform)!;

      // Remove if off-screen
      if (transform.x + FLAPPY_CONFIG.pipes.width < 0) {
        world.removeAllComponents(entity);
        world.entities.destroy(entity);
      }
    }
  },
};

/**
 * Scoring system - detects when bird passes pipes.
 */
export function createScoringSystem(onScoreChange?: (score: number) => void): System {
  return {
    name: 'ScoringSystem',
    priority: SystemPriorities.GAME_LOGIC + 10,

    update(world) {
      if (world.getResource<boolean>('gameOver')) return;

      const birds = world.query(Player, Transform);
      if (birds.length === 0) return;

      const birdEntity = birds[0]!;
      const birdTransform = world.getComponent(birdEntity, Transform)!;

      const pipes = world.query(Pipe, Transform);

      for (const entity of pipes) {
        const pipe = world.getComponent(entity, Pipe)!;
        const transform = world.getComponent(entity, Transform)!;

        // Only check top pipes (avoid double scoring)
        if (!pipe.isTop || pipe.passed) continue;

        // Check if bird passed the pipe
        if (transform.x + FLAPPY_CONFIG.pipes.width < birdTransform.x) {
          world.addComponent(entity, Pipe, { ...pipe, passed: true });

          const score = (world.getResource<number>('score') ?? 0) + 1;
          world.setResource('score', score);
          onScoreChange?.(score);

          world.emit('playSound', { type: 'score' });
        }
      }
    },
  };
}

/**
 * Collision detection system for Flappy Bird.
 */
export const FlappyCollisionSystem: System = {
  name: 'FlappyCollisionSystem',
  priority: SystemPriorities.POST_PHYSICS + 10,

  update(world) {
    if (!world.getResource<boolean>('gameStarted')) return;
    if (world.getResource<boolean>('gameOver')) return;

    const birds = world.query(Player, Transform, Collider);
    if (birds.length === 0) return;

    const birdEntity = birds[0]!;
    const birdTransform = world.getComponent(birdEntity, Transform)!;
    const birdCollider = world.getComponent(birdEntity, Collider)!;

    const { canvas, ground, bird } = FLAPPY_CONFIG;

    // Ground collision
    if (birdTransform.y + bird.height >= canvas.height - ground.height) {
      world.emit('gameOver', { reason: 'ground' });
      return;
    }

    // Ceiling collision
    if (birdTransform.y <= 0) {
      world.emit('gameOver', { reason: 'ceiling' });
      return;
    }

    // Pipe collision
    const pipes = world.query(Pipe, Transform, Sprite);

    for (const pipeEntity of pipes) {
      const pipeTransform = world.getComponent(pipeEntity, Transform)!;
      const pipeSprite = world.getComponent(pipeEntity, Sprite)!;

      // AABB collision check
      const birdLeft = birdTransform.x + birdCollider.offsetX;
      const birdRight = birdLeft + birdCollider.width;
      const birdTop = birdTransform.y + birdCollider.offsetY;
      const birdBottom = birdTop + birdCollider.height;

      const pipeLeft = pipeTransform.x;
      const pipeRight = pipeLeft + pipeSprite.width;
      const pipeTop = pipeTransform.y;
      const pipeBottom = pipeTop + pipeSprite.height;

      if (birdRight > pipeLeft && birdLeft < pipeRight &&
          birdBottom > pipeTop && birdTop < pipeBottom) {
        world.emit('gameOver', { reason: 'pipe' });
        return;
      }
    }
  },
};

/**
 * Game over handler system.
 */
export function createFlappyGameOverSystem(onGameOver?: () => void): System {
  return {
    name: 'FlappyGameOverSystem',
    priority: SystemPriorities.GAME_LOGIC + 20,

    init(world: World) {
      world.on('gameOver', () => {
        world.setResource('gameOver', true);

        // Stop all pipes
        const pipes = world.query(Pipe, Velocity);
        for (const entity of pipes) {
          world.addComponent(entity, Velocity, { x: 0, y: 0, z: 0 });
        }

        // Disable bird gravity
        const birds = world.query(Player, Gravity);
        for (const entity of birds) {
          const gravity = world.getComponent(entity, Gravity)!;
          world.addComponent(entity, Gravity, { ...gravity, enabled: false });
        }

        // Stop bird velocity
        const birdVelocities = world.query(Player, Velocity);
        for (const entity of birdVelocities) {
          world.addComponent(entity, Velocity, { x: 0, y: 0, z: 0 });
        }

        // Update high score
        const score = world.getResource<number>('score') ?? 0;
        const highScore = world.getResource<number>('highScore') ?? 0;
        if (score > highScore) {
          world.setResource('highScore', score);
          if (typeof window !== 'undefined') {
            localStorage.setItem('flappybird-high-score', String(score));
          }
        }

        world.emit('playSound', { type: 'gameOver' });
        onGameOver?.();
      });
    },

    update() {},
  };
}

/**
 * Restart handler system.
 */
export const FlappyRestartSystem: System = {
  name: 'FlappyRestartSystem',
  priority: SystemPriorities.INPUT + 20,

  update(world) {
    if (!world.getResource<boolean>('gameOver')) return;

    const birds = world.query(Player, ActionInput);
    for (const entity of birds) {
      const input = world.getComponent(entity, ActionInput);
      if (input?.actionJustPressed) {
        world.emit('restart');
      }
    }
  },
};

/**
 * Ground scroll system - updates ground offset for animation.
 */
export const GroundScrollSystem: System = {
  name: 'GroundScrollSystem',
  priority: SystemPriorities.PRE_RENDER,

  update(world) {
    if (!world.getResource<boolean>('gameStarted')) return;
    if (world.getResource<boolean>('gameOver')) return;

    const offset = world.getResource<number>('groundOffset') ?? 0;
    world.setResource('groundOffset', offset + FLAPPY_CONFIG.ground.scrollSpeed);
  },
};

/**
 * Wing animation system.
 * Uses world resource 'wingAnimFrame' for frame counting (reset on restart).
 */
export const WingAnimationSystem: System = {
  name: 'WingAnimationSystem',
  priority: SystemPriorities.PRE_RENDER,

  update(world) {
    const frameCount = (world.getResource<number>('wingAnimFrame') ?? 0) + 1;
    world.setResource('wingAnimFrame', frameCount);

    if (frameCount % 8 === 0) {
      const wingFrame = world.getResource<number>('wingFrame') ?? 0;
      world.setResource('wingFrame', wingFrame + 1);
    }
  },
};
