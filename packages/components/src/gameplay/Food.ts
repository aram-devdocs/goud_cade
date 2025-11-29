import { defineComponent } from '@repo/ecs';

/**
 * Food component for collectible items.
 */
export const Food = defineComponent('Food', {
  /** Points awarded when collected */
  points: 10,
  /** Whether food respawns after collection */
  respawns: true,
});

export type FoodData = typeof Food.defaultValue;
