import { defineComponent } from '@repo/ecs';

/**
 * ActionInput component stores button states.
 * Updated by InputSystem each frame.
 */
export const ActionInput = defineComponent('ActionInput', {
  /** Action button is pressed (Space/A button) */
  action: false,
  /** Action was just pressed this frame (edge detection) */
  actionJustPressed: false,
  /** Interact button is pressed (E/A button) */
  interact: false,
  /** Back button is pressed (ESC/B button) */
  back: false,
});

export type ActionInputData = typeof ActionInput.defaultValue;
