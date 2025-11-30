import { defineComponent } from '@repo/ecs';

export type PelletType = 'dot' | 'power';

/**
 * Pellet component for Pac-Man game entities.
 * Includes both regular dots and power pellets.
 */
export const Pellet = defineComponent('Pellet', {
  /** Pellet type */
  type: 'dot' as PelletType,
  /** Points awarded when eaten */
  points: 10,
  /** Whether this pellet has been eaten */
  eaten: false,
});

export type PelletData = typeof Pellet.defaultValue;
