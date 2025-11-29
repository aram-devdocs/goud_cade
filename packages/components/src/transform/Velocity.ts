import { defineComponent } from '@repo/ecs';

/**
 * Velocity component for movement speed.
 * Applied to Transform each frame by VelocitySystem.
 */
export const Velocity = defineComponent('Velocity', {
  x: 0,
  y: 0,
  z: 0,
});

export type VelocityData = typeof Velocity.defaultValue;
