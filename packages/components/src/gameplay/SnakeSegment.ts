import { defineComponent } from '@repo/ecs';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * SnakeSegment component for snake game entities.
 */
export const SnakeSegment = defineComponent('SnakeSegment', {
  /** Segment type */
  type: 'head' as 'head' | 'body' | 'tail',
  /** Position in snake (0 = head) */
  index: 0,
  /** Current movement direction */
  direction: 'RIGHT' as Direction,
});

export type SnakeSegmentData = typeof SnakeSegment.defaultValue;
