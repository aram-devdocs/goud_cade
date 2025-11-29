import { defineComponent } from '@repo/ecs';

/**
 * GridPosition component for discrete grid-based position.
 * Use for tile-based games (Snake, Tetris, Pac-Man).
 */
export const GridPosition = defineComponent('GridPosition', {
  col: 0,
  row: 0,
  cellWidth: 20,
  cellHeight: 20,
});

export type GridPositionData = typeof GridPosition.defaultValue;
