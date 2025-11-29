import { defineComponent } from '@repo/ecs';

/**
 * Collider component for collision detection.
 * Supports box and circle colliders.
 */
export const Collider = defineComponent('Collider', {
  /** Collider type */
  type: 'box' as 'box' | 'circle',
  /** Width for box collider */
  width: 32,
  /** Height for box collider */
  height: 32,
  /** Radius for circle collider */
  radius: 16,
  /** X offset from entity position */
  offsetX: 0,
  /** Y offset from entity position */
  offsetY: 0,
  /** Collision layer (bitmask) */
  layer: 1,
  /** Which layers this collider interacts with (bitmask) */
  mask: 0xffffffff,
});

export type ColliderData = typeof Collider.defaultValue;
