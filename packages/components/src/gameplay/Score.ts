import { defineComponent } from '@repo/ecs';

/**
 * Score component for tracking points.
 */
export const Score = defineComponent('Score', {
  /** Current score */
  value: 0,
  /** Multiplier for points */
  multiplier: 1,
});

export type ScoreData = typeof Score.defaultValue;
