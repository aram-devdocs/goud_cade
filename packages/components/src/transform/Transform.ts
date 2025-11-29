import { defineComponent } from '@repo/ecs';

/**
 * Transform component for continuous 2D/3D position.
 * Use for physics-based games (Flappy Bird, platformers).
 */
export const Transform = defineComponent('Transform', {
  x: 0,
  y: 0,
  z: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
});

export type TransformData = typeof Transform.defaultValue;
