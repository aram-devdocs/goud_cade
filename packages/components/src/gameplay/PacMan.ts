import { defineComponent } from '@repo/ecs';

/**
 * PacMan component for the player character.
 */
export const PacMan = defineComponent('PacMan', {
  /** Current movement direction */
  direction: 'LEFT' as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  /** Requested direction (buffered input) */
  nextDirection: null as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null,
  /** Mouth animation angle (0-45 degrees) */
  mouthAngle: 45,
  /** Whether mouth is opening or closing */
  mouthOpening: false,
  /** Whether currently powered up */
  powered: false,
  /** Remaining lives */
  lives: 3,
  /** Ghost eat combo multiplier */
  ghostCombo: 1,
});

export type PacManData = typeof PacMan.defaultValue;
