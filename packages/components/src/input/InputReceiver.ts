import { defineComponent } from '@repo/ecs';

/**
 * InputReceiver marks an entity as receiving input.
 * The InputSystem will update input components on entities with this.
 */
export const InputReceiver = defineComponent('InputReceiver', {
  /** Whether input is currently active */
  active: true,
  /** Player ID this receiver listens to */
  playerId: 0,
});

export type InputReceiverData = typeof InputReceiver.defaultValue;
