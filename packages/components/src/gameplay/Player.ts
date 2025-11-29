import { defineComponent } from '@repo/ecs';

/**
 * Player component marks an entity as player-controlled.
 */
export const Player = defineComponent('Player', {
  /** Player ID (for multiplayer) */
  id: 0,
});

export type PlayerData = typeof Player.defaultValue;
