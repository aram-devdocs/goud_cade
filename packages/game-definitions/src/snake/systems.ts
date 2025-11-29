import { type System, type World, SystemPriorities } from '@repo/ecs';
import {
  GridPosition,
  Sprite,
  SnakeSegment,
  DirectionInput,
  ActionInput,
  Food,
  type Direction,
} from '@repo/components';
import { SNAKE_CONFIG } from './config';
import { createSnakeSegment, createFood, getSnakePositions } from './prefabs';

/**
 * Direction validation system - prevents reversing into self.
 */
export const SnakeDirectionSystem: System = {
  name: 'SnakeDirectionSystem',
  priority: SystemPriorities.INPUT + 10,

  update(world) {
    const heads = world.query(SnakeSegment, DirectionInput);

    for (const entity of heads) {
      const segment = world.getComponent(entity, SnakeSegment);
      if (segment?.type !== 'head') continue;

      const input = world.getComponent(entity, DirectionInput);
      if (!input?.direction) continue;

      // Prevent 180-degree turns
      const opposite: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      if (input.direction === opposite[segment.direction]) {
        // Keep current direction
        world.addComponent(entity, DirectionInput, {
          ...input,
          direction: segment.direction,
        });
      }
    }
  },
};

/**
 * Snake movement system - moves snake on a timer.
 * Also handles collision detection immediately after movement (like original code).
 */
export function createSnakeMovementSystem(): System {
  let timeSinceMove = 0;

  return {
    name: 'SnakeMovementSystem',
    priority: SystemPriorities.PHYSICS,

    init(world) {
      // Reset timing on restart
      world.on('restart', () => {
        timeSinceMove = 0;
      });
    },

    update(world, deltaTime) {
      // Check if game is over
      if (world.getResource<boolean>('gameOver')) return;

      timeSinceMove += deltaTime * 1000;

      // Calculate speed based on score
      const score = world.getResource<number>('score') ?? 0;
      const { initialSpeed, minSpeed, speedDecrease } = SNAKE_CONFIG.gameplay;
      const currentSpeed = Math.max(
        minSpeed,
        initialSpeed - Math.floor(score / 50) * speedDecrease
      );

      if (timeSinceMove < currentSpeed) return;
      timeSinceMove = 0;

      // Get all segments sorted by index
      const segments = world
        .query(SnakeSegment, GridPosition)
        .map((e) => ({
          entity: e,
          segment: world.getComponent(e, SnakeSegment)!,
          pos: world.getComponent(e, GridPosition)!,
        }))
        .sort((a, b) => a.segment.index - b.segment.index);

      if (segments.length === 0) return;

      // Store previous positions for body following
      const prevPositions = segments.map((s) => ({ col: s.pos.col, row: s.pos.row }));

      // Get head and its direction
      const head = segments[0]!;
      const input = world.getComponent(head.entity, DirectionInput);
      const direction = input?.direction ?? head.segment.direction;

      // Calculate new head position
      let newCol = head.pos.col;
      let newRow = head.pos.row;

      switch (direction) {
        case 'UP':
          newRow -= 1;
          break;
        case 'DOWN':
          newRow += 1;
          break;
        case 'LEFT':
          newCol -= 1;
          break;
        case 'RIGHT':
          newCol += 1;
          break;
      }

      // Check collisions BEFORE updating positions (like original code)
      const { cols, rows } = SNAKE_CONFIG.grid;

      // Wall collision
      if (newCol < 0 || newCol >= cols || newRow < 0 || newRow >= rows) {
        world.emit('gameOver', { reason: 'wall' });
        return;
      }

      // Self collision (check against current body positions, excluding head)
      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i]!;
        if (newCol === seg.pos.col && newRow === seg.pos.row) {
          world.emit('gameOver', { reason: 'self' });
          return;
        }
      }

      // Update head position
      world.addComponent(head.entity, GridPosition, {
        ...head.pos,
        col: newCol,
        row: newRow,
      });

      // Update head direction
      world.addComponent(head.entity, SnakeSegment, {
        ...head.segment,
        direction,
      });

      // Body segments follow the segment ahead
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i]!;
        const prevPos = prevPositions[i - 1]!;

        world.addComponent(segment.entity, GridPosition, {
          ...segment.pos,
          col: prevPos.col,
          row: prevPos.row,
        });
      }

      // Store last tail position for growth
      const lastPos = prevPositions[prevPositions.length - 1]!;
      world.setResource('lastTailPosition', lastPos);
      world.setResource('lastTailDirection', segments[segments.length - 1]!.segment.direction);

      // Check food collision
      const foods = world.query(Food, GridPosition);
      for (const foodEntity of foods) {
        const foodPos = world.getComponent(foodEntity, GridPosition)!;
        if (newCol === foodPos.col && newRow === foodPos.row) {
          world.emit('foodEaten', { entity: foodEntity });
          break;
        }
      }

      // Emit move event
      world.emit('snakeMoved', { col: newCol, row: newRow });
    },
  };
}

/**
 * Snake collision system - checks for wall, self, and food collisions.
 */
export const SnakeCollisionSystem: System = {
  name: 'SnakeCollisionSystem',
  priority: SystemPriorities.GAME_LOGIC,

  update(world) {
    if (world.getResource<boolean>('gameOver')) return;

    // Find head
    const heads = world.query(SnakeSegment, GridPosition);
    const headEntity = heads.find((e) => {
      const seg = world.getComponent(e, SnakeSegment);
      return seg?.type === 'head';
    });

    if (!headEntity) return;

    const headPos = world.getComponent(headEntity, GridPosition)!;
    const { cols, rows } = SNAKE_CONFIG.grid;

    // Wall collision
    if (headPos.col < 0 || headPos.col >= cols || headPos.row < 0 || headPos.row >= rows) {
      world.emit('gameOver', { reason: 'wall' });
      return;
    }

    // Self collision (check against body segments only)
    const bodySegments = world.query(SnakeSegment, GridPosition).filter((e) => {
      const seg = world.getComponent(e, SnakeSegment);
      return seg?.type !== 'head';
    });

    for (const body of bodySegments) {
      const bodyPos = world.getComponent(body, GridPosition)!;
      if (headPos.col === bodyPos.col && headPos.row === bodyPos.row) {
        world.emit('gameOver', { reason: 'self' });
        return;
      }
    }

    // Food collision
    const foods = world.query(Food, GridPosition);
    for (const food of foods) {
      const foodPos = world.getComponent(food, GridPosition)!;
      if (headPos.col === foodPos.col && headPos.row === foodPos.row) {
        world.emit('foodEaten', { entity: food });
      }
    }
  },
};

/**
 * Snake growth system - handles food eating and snake growth.
 */
export function createSnakeGrowthSystem(onScoreChange?: (score: number) => void): System {
  return {
    name: 'SnakeGrowthSystem',
    priority: SystemPriorities.GAME_LOGIC + 10,

    init(world) {
      world.on('foodEaten', (data) => {
        const { entity } = data as { entity: number };

        const food = world.getComponent(entity, Food);
        if (!food) return;

        // Update score
        const currentScore = world.getResource<number>('score') ?? 0;
        const newScore = currentScore + food.points;
        world.setResource('score', newScore);
        onScoreChange?.(newScore);

        // Get last tail position (stored by movement system)
        const lastPos = world.getResource<{ col: number; row: number }>('lastTailPosition');
        const lastDir = world.getResource<Direction>('lastTailDirection');

        if (lastPos && lastDir) {
          // Get current snake length
          const segments = world.query(SnakeSegment);
          const newIndex = segments.length;

          // Add new segment at old tail position
          createSnakeSegment(world, lastPos.col, lastPos.row, newIndex, lastDir);
        }

        // Remove old food
        world.removeAllComponents(entity);
        world.entities.destroy(entity);

        // Spawn new food
        const snakePositions = getSnakePositions(world);
        createFood(world, snakePositions);

        // Play sound
        world.emit('playSound', { type: 'eat' });
      });
    },

    update() {},
  };
}

/**
 * Game over handler system.
 */
export function createGameOverSystem(onGameOver?: () => void): System {
  return {
    name: 'GameOverSystem',
    priority: SystemPriorities.GAME_LOGIC + 20,

    init(world) {
      world.on('gameOver', () => {
        world.setResource('gameOver', true);

        // Update high score
        const score = world.getResource<number>('score') ?? 0;
        const highScore = world.getResource<number>('highScore') ?? 0;
        if (score > highScore) {
          world.setResource('highScore', score);
          if (typeof window !== 'undefined') {
            localStorage.setItem('snake-high-score', String(score));
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
 * Restart handler system - listens for action input to restart.
 */
export const RestartSystem: System = {
  name: 'RestartSystem',
  priority: SystemPriorities.INPUT + 20,

  update(world) {
    if (!world.getResource<boolean>('gameOver')) return;

    // Find entity with ActionInput
    const entities = world.query(ActionInput);
    for (const entity of entities) {
      const input = world.getComponent(entity, ActionInput);
      if (input?.actionJustPressed) {
        world.emit('restart');
      }
    }
  },
};
