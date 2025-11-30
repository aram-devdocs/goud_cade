import type { World, Entity } from '@repo/ecs';
import {
  Transform,
  Velocity,
  Sprite,
  Collider,
  Player,
  Health,
  InputReceiver,
  DirectionInput,
  ActionInput,
} from '@repo/components';
import { SOUL_KNIGHT_CONFIG } from './config';

/**
 * Player state stored as a world resource.
 */
export interface PlayerState {
  stamina: number;
  maxStamina: number;
  isRolling: boolean;
  rollFrames: number;
  rollCooldown: number;
  rollDirection: { x: number; y: number };
  isAttacking: boolean;
  attackFrames: number;
  attackCooldown: number;
  attackDirection: { x: number; y: number };
  facingDirection: { x: number; y: number };
  invincibilityFrames: number;
  lastDamageTime: number;
}

/**
 * Enemy state stored on each enemy entity via world resources.
 */
export interface EnemyState {
  health: number;
  isAttacking: boolean;
  attackFrames: number;
  attackCooldown: number;
  targetX: number;
  targetY: number;
  deathFrames: number;
  isDying: boolean;
}

/**
 * Create the player knight entity.
 */
export function createPlayer(world: World): Entity {
  const entity = world.entities.create();
  const { player, arena } = SOUL_KNIGHT_CONFIG;

  world.addComponent(entity, Transform, {
    x: arena.offsetX + player.startX,
    y: arena.offsetY + player.startY,
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

  world.addComponent(entity, Sprite, {
    width: player.width,
    height: player.height,
    color: SOUL_KNIGHT_CONFIG.colors.playerBody,
    shape: 'rect',
    layer: 20,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, Collider, {
    type: 'box',
    width: player.width - 4,
    height: player.height - 4,
    radius: 0,
    offsetX: 2,
    offsetY: 2,
    layer: 1,
    mask: 0xffffffff,
  });

  world.addComponent(entity, Player, { id: 0 });

  world.addComponent(entity, Health, {
    current: player.maxHealth,
    max: player.maxHealth,
    invulnerable: false,
  });

  world.addComponent(entity, InputReceiver, { active: true, playerId: 0 });

  world.addComponent(entity, DirectionInput, {
    direction: null,
    lastDirection: null,
    bufferedDirection: null,
  });

  world.addComponent(entity, ActionInput, {
    action: false,
    actionJustPressed: false,
    interact: false,
    back: false,
  });

  // Initialize player state resource
  const playerState: PlayerState = {
    stamina: player.maxStamina,
    maxStamina: player.maxStamina,
    isRolling: false,
    rollFrames: 0,
    rollCooldown: 0,
    rollDirection: { x: 0, y: 0 },
    isAttacking: false,
    attackFrames: 0,
    attackCooldown: 0,
    attackDirection: { x: 1, y: 0 },
    facingDirection: { x: 1, y: 0 },
    invincibilityFrames: 0,
    lastDamageTime: 0,
  };
  world.setResource('playerState', playerState);

  return entity;
}

/**
 * Create an enemy entity at the specified position.
 */
export function createEnemy(world: World, x: number, y: number): Entity {
  const entity = world.entities.create();
  const { enemy } = SOUL_KNIGHT_CONFIG;

  world.addComponent(entity, Transform, {
    x,
    y,
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

  world.addComponent(entity, Sprite, {
    width: enemy.width,
    height: enemy.height,
    color: SOUL_KNIGHT_CONFIG.colors.enemyBody,
    shape: 'rect',
    layer: 15,
    visible: true,
    opacity: 1,
    borderColor: undefined,
    borderWidth: 0,
    cornerRadius: 0,
  });

  world.addComponent(entity, Collider, {
    type: 'box',
    width: enemy.width - 4,
    height: enemy.height - 4,
    radius: 0,
    offsetX: 2,
    offsetY: 2,
    layer: 2,
    mask: 1,
  });

  // Store enemy state in world resource by entity ID
  const enemyStates = world.getResource<Map<Entity, EnemyState>>('enemyStates') ?? new Map();
  enemyStates.set(entity, {
    health: enemy.health,
    isAttacking: false,
    attackFrames: 0,
    attackCooldown: 0,
    targetX: x,
    targetY: y,
    deathFrames: 0,
    isDying: false,
  });
  world.setResource('enemyStates', enemyStates);

  return entity;
}

/**
 * Get a random spawn position along the arena edges.
 */
export function getRandomSpawnPosition(): { x: number; y: number } {
  const { arena } = SOUL_KNIGHT_CONFIG;
  const edge = Math.floor(Math.random() * 4);
  const margin = 40;

  switch (edge) {
    case 0: // Top
      return {
        x: arena.offsetX + margin + Math.random() * (arena.width - margin * 2),
        y: arena.offsetY + margin,
      };
    case 1: // Right
      return {
        x: arena.offsetX + arena.width - margin,
        y: arena.offsetY + margin + Math.random() * (arena.height - margin * 2),
      };
    case 2: // Bottom
      return {
        x: arena.offsetX + margin + Math.random() * (arena.width - margin * 2),
        y: arena.offsetY + arena.height - margin,
      };
    default: // Left
      return {
        x: arena.offsetX + margin,
        y: arena.offsetY + margin + Math.random() * (arena.height - margin * 2),
      };
  }
}

/**
 * Get distance between two points.
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector.
 */
export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
