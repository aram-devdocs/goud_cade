export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type InputSource = 'keyboard' | 'touch' | 'gamepad' | null;

export interface Vector2 {
  x: number;
  y: number;
}

export interface InputState {
  // Movement vector (normalized -1 to 1)
  movement: Vector2;

  // Camera/look vector (normalized -1 to 1)
  look: Vector2;

  // Direction for games (discrete, for d-pad style input)
  direction: Direction | null;

  // Action buttons
  interact: boolean;
  action: boolean;
  back: boolean;

  // Input source tracking
  activeSource: InputSource;
  isTouchDevice: boolean;
  hasGamepad: boolean;

  // Timestamps for input source switching
  lastKeyboardInput: number;
  lastTouchInput: number;
  lastGamepadInput: number;
}

export interface InputActions {
  // Movement setters
  setMovement: (movement: Vector2) => void;
  setLook: (look: Vector2) => void;
  addLook: (delta: Vector2) => void;

  // Direction setter
  setDirection: (direction: Direction | null) => void;

  // Button setters
  setInteract: (pressed: boolean) => void;
  setAction: (pressed: boolean) => void;
  setBack: (pressed: boolean) => void;

  // Input source management
  setActiveSource: (source: InputSource) => void;
  setTouchDevice: (isTouch: boolean) => void;
  setHasGamepad: (hasGamepad: boolean) => void;

  // Reset all input state
  reset: () => void;
}

export type InputStore = InputState & InputActions;

// Gamepad button mappings (standard layout)
export const GAMEPAD_BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  L3: 10,
  R3: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const;

// Gamepad axis mappings
export const GAMEPAD_AXES = {
  LEFT_X: 0,
  LEFT_Y: 1,
  RIGHT_X: 2,
  RIGHT_Y: 3,
} as const;
