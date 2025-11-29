import { defineComponent } from '@repo/ecs';

/**
 * Pipe component for Flappy Bird style obstacles.
 */
export const Pipe = defineComponent('Pipe', {
  /** Y position of the gap center */
  gapY: 180,
  /** Height of the gap */
  gapHeight: 140,
  /** Whether the player has passed this pipe */
  passed: false,
  /** Is this the top or bottom pipe */
  isTop: false,
});

export type PipeData = typeof Pipe.defaultValue;
