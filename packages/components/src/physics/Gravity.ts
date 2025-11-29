import { defineComponent } from '@repo/ecs';

/**
 * Gravity component marks an entity as affected by gravity.
 * GravitySystem applies this to the entity's Velocity each frame.
 */
export const Gravity = defineComponent('Gravity', {
  /** Gravity strength (pixels per frame squared) */
  strength: 0.15,
  /** Maximum fall speed */
  maxFallSpeed: 10,
  /** Whether gravity is currently enabled */
  enabled: true,
});

export type GravityData = typeof Gravity.defaultValue;
