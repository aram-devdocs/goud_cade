import { defineComponent } from '@repo/ecs';

/**
 * Health component for entities with lives/health.
 */
export const Health = defineComponent('Health', {
  /** Current health points */
  current: 3,
  /** Maximum health points */
  max: 3,
  /** Whether entity is invulnerable */
  invulnerable: false,
});

export type HealthData = typeof Health.defaultValue;
