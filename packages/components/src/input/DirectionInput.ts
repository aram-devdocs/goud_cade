import { defineComponent } from '@repo/ecs';
import type { Direction } from '../gameplay/SnakeSegment';

/**
 * DirectionInput component stores discrete direction state.
 * Used for grid-based games like Snake.
 */
export const DirectionInput = defineComponent('DirectionInput', {
  /** Current direction input */
  direction: null as Direction | null,
  /** Previous frame's direction */
  lastDirection: null as Direction | null,
  /** Buffered direction for next move */
  bufferedDirection: null as Direction | null,
});

export type DirectionInputData = typeof DirectionInput.defaultValue;
