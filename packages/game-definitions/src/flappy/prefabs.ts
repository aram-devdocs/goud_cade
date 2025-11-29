import type { World, Entity } from '@repo/ecs';
import {
  Transform,
  Velocity,
  Gravity,
  Sprite,
  Collider,
  Player,
  InputReceiver,
  ActionInput,
  Pipe,
} from '@repo/components';
import { FLAPPY_CONFIG } from './config';

/**
 * Create the bird entity with physics components.
 */
export function createBird(world: World): Entity {
  const entity = world.entities.create();
  const { bird, physics, canvas } = FLAPPY_CONFIG;

  world.addComponent(entity, Transform, {
    x: bird.x,
    y: canvas.height / 2,
    z: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });

  world.addComponent(entity, Velocity, {
    x: 0,
    y: 0,
    z: 0,
  });

  world.addComponent(entity, Gravity, {
    strength: physics.gravity,
    maxFallSpeed: physics.maxFallVelocity,
    enabled: false, // Enabled when game starts
  });

  world.addComponent(entity, Sprite, {
    width: bird.width,
    height: bird.height,
    color: FLAPPY_CONFIG.colors.bird,
    shape: 'circle',
    layer: 10,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, Collider, {
    type: 'box',
    width: bird.width - 4,
    height: bird.height - 4,
    radius: 0,
    offsetX: 2,
    offsetY: 2,
    layer: 1,
    mask: 0xffffffff,
  });

  world.addComponent(entity, Player, { id: 0 });
  world.addComponent(entity, InputReceiver, { active: true, playerId: 0 });
  world.addComponent(entity, ActionInput, {
    action: false,
    actionJustPressed: false,
    interact: false,
    back: false,
  });

  return entity;
}

/**
 * Create a pipe pair (top and bottom).
 */
export function createPipePair(world: World, gapY: number): { top: Entity; bottom: Entity } {
  const { pipes, canvas, ground } = FLAPPY_CONFIG;

  // Top pipe
  const topEntity = world.entities.create();
  const topHeight = gapY - pipes.gap / 2;

  world.addComponent(topEntity, Transform, {
    x: canvas.width,
    y: 0,
    z: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });

  world.addComponent(topEntity, Velocity, {
    x: -pipes.speed,
    y: 0,
    z: 0,
  });

  world.addComponent(topEntity, Sprite, {
    width: pipes.width,
    height: topHeight,
    color: FLAPPY_CONFIG.colors.pipeGreen,
    shape: 'rect',
    layer: 5,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(topEntity, Collider, {
    type: 'box',
    width: pipes.width,
    height: topHeight,
    radius: 0,
    offsetX: 0,
    offsetY: 0,
    layer: 2,
    mask: 1,
  });

  world.addComponent(topEntity, Pipe, {
    gapY,
    gapHeight: pipes.gap,
    passed: false,
    isTop: true,
  });

  // Bottom pipe
  const bottomEntity = world.entities.create();
  const bottomY = gapY + pipes.gap / 2;
  const bottomHeight = canvas.height - ground.height - bottomY;

  world.addComponent(bottomEntity, Transform, {
    x: canvas.width,
    y: bottomY,
    z: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });

  world.addComponent(bottomEntity, Velocity, {
    x: -pipes.speed,
    y: 0,
    z: 0,
  });

  world.addComponent(bottomEntity, Sprite, {
    width: pipes.width,
    height: bottomHeight,
    color: FLAPPY_CONFIG.colors.pipeGreen,
    shape: 'rect',
    layer: 5,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(bottomEntity, Collider, {
    type: 'box',
    width: pipes.width,
    height: bottomHeight,
    radius: 0,
    offsetX: 0,
    offsetY: 0,
    layer: 2,
    mask: 1,
  });

  world.addComponent(bottomEntity, Pipe, {
    gapY,
    gapHeight: pipes.gap,
    passed: false,
    isTop: false,
  });

  return { top: topEntity, bottom: bottomEntity };
}

/**
 * Generate a random gap Y position for pipes.
 */
export function getRandomGapY(): number {
  const { pipes, canvas, ground } = FLAPPY_CONFIG;
  const minGapY = pipes.minHeight + pipes.gap / 2;
  const maxGapY = canvas.height - ground.height - pipes.minHeight - pipes.gap / 2;
  return Math.random() * (maxGapY - minGapY) + minGapY;
}
