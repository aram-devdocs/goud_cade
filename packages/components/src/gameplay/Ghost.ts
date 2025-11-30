import { defineComponent } from '@repo/ecs';

export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten';
export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde';

/**
 * Ghost component for Pac-Man game entities.
 */
export const Ghost = defineComponent('Ghost', {
  /** Ghost identity */
  name: 'blinky' as GhostName,
  /** Current behavior mode */
  mode: 'scatter' as GhostMode,
  /** Ghost color (hex) */
  color: '#FF0000',
  /** Target cell for pathfinding */
  targetCol: 0,
  targetRow: 0,
  /** Current movement direction */
  direction: 'UP' as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  /** Whether ghost is in the ghost house */
  inHouse: true,
  /** Timer for leaving house */
  houseTimer: 0,
  /** Frightened mode remaining time */
  frightenedTimer: 0,
});

export type GhostData = typeof Ghost.defaultValue;
