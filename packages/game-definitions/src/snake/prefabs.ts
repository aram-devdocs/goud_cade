import type { World, Entity } from '@repo/ecs';
import {
  GridPosition,
  Sprite,
  SnakeSegment,
  Player,
  InputReceiver,
  DirectionInput,
  ActionInput,
  Food,
} from '@repo/components';
import { SNAKE_CONFIG } from './config';

/**
 * Create the snake head entity with all required components.
 */
export function createSnakeHead(world: World): Entity {
  const entity = world.entities.create();
  const { cellSize } = SNAKE_CONFIG.grid;
  const { startPosition, startDirection } = SNAKE_CONFIG.gameplay;

  world.addComponent(entity, GridPosition, {
    col: startPosition.col,
    row: startPosition.row,
    cellWidth: cellSize,
    cellHeight: cellSize,
  });

  world.addComponent(entity, Sprite, {
    width: cellSize - 2,
    height: cellSize - 2,
    color: SNAKE_CONFIG.colors.snakeHead,
    shape: 'rect',
    layer: 10,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, SnakeSegment, {
    type: 'head',
    index: 0,
    direction: startDirection,
  });

  world.addComponent(entity, Player, { id: 0 });
  world.addComponent(entity, InputReceiver, { active: true, playerId: 0 });
  world.addComponent(entity, DirectionInput, {
    direction: startDirection,
    lastDirection: startDirection,
    bufferedDirection: null,
  });
  world.addComponent(entity, ActionInput, {
    action: false,
    actionJustPressed: false,
    interact: false,
    back: false,
  });

  return entity;
}

/**
 * Create a snake body segment at the specified position.
 */
export function createSnakeSegment(
  world: World,
  col: number,
  row: number,
  index: number,
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
): Entity {
  const entity = world.entities.create();
  const { cellSize } = SNAKE_CONFIG.grid;

  // Gradient from head to tail
  const brightness = 1 - (index / 20) * 0.6;

  world.addComponent(entity, GridPosition, {
    col,
    row,
    cellWidth: cellSize,
    cellHeight: cellSize,
  });

  world.addComponent(entity, Sprite, {
    width: cellSize - 2,
    height: cellSize - 2,
    color: SNAKE_CONFIG.colors.snakeBody(brightness),
    shape: 'rect',
    layer: 10 - index * 0.01,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, SnakeSegment, {
    type: 'body',
    index,
    direction,
  });

  return entity;
}

/**
 * Create food entity at a random position avoiding the snake.
 */
export function createFood(world: World, avoidPositions: Set<string>): Entity {
  const entity = world.entities.create();
  const { cellSize, cols, rows } = SNAKE_CONFIG.grid;

  // Find valid position
  let col: number, row: number;
  do {
    col = Math.floor(Math.random() * cols);
    row = Math.floor(Math.random() * rows);
  } while (avoidPositions.has(`${col},${row}`));

  world.addComponent(entity, GridPosition, {
    col,
    row,
    cellWidth: cellSize,
    cellHeight: cellSize,
  });

  world.addComponent(entity, Sprite, {
    width: cellSize - 4,
    height: cellSize - 4,
    color: SNAKE_CONFIG.colors.food,
    shape: 'circle',
    layer: 5,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, Food, {
    points: SNAKE_CONFIG.gameplay.pointsPerFood,
    respawns: true,
  });

  return entity;
}

/**
 * Get all snake positions as a Set for collision checking.
 */
export function getSnakePositions(world: World): Set<string> {
  const positions = new Set<string>();
  const segments = world.query(SnakeSegment, GridPosition);

  for (const entity of segments) {
    const pos = world.getComponent(entity, GridPosition);
    if (pos) {
      positions.add(`${pos.col},${pos.row}`);
    }
  }

  return positions;
}
