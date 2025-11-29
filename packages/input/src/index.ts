// Types
export type {
  Direction,
  InputSource,
  Vector2,
  InputState,
  InputActions,
  InputStore,
} from './types';

export { GAMEPAD_BUTTONS, GAMEPAD_AXES } from './types';

// Store
export { useInputStore } from './stores/useInputStore';

// Hooks
export {
  useInput,
  useMovementInput,
  useDirectionInput,
  useButtonInput,
  useInteractPress,
  useActionPress,
  useBackPress,
  useShouldShowTouchControls,
} from './hooks/useInput';

export { useKeyboardInput } from './hooks/useKeyboardInput';
export { useGamepadInput } from './hooks/useGamepadInput';
export { useTouchInput } from './hooks/useTouchInput';

// Components
export { VirtualJoystick } from './components/VirtualJoystick';
export { VirtualDPad } from './components/VirtualDPad';
export { TouchButton } from './components/TouchButton';
export { TouchControls } from './components/TouchControls';

// Utilities
export {
  applyDeadzone,
  applyRadialDeadzone,
  clamp,
  normalizeVector,
} from './utils/deadzone';

export {
  isTouchDevice,
  hasGamepad,
  getFirstGamepad,
  isMobileBrowser,
  supportsGamepadAPI,
  supportsPointerEvents,
} from './utils/deviceDetection';
