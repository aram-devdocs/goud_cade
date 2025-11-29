import { create } from 'zustand';
import type { InputStore, InputSource, Vector2, Direction } from '../types';

const initialState = {
  // Movement and look vectors
  movement: { x: 0, y: 0 },
  look: { x: 0, y: 0 },

  // Direction for games
  direction: null as Direction | null,

  // Action buttons
  interact: false,
  action: false,
  back: false,

  // Input source tracking
  activeSource: null as InputSource,
  isTouchDevice: false,
  hasGamepad: false,

  // Timestamps
  lastKeyboardInput: 0,
  lastTouchInput: 0,
  lastGamepadInput: 0,
};

export const useInputStore = create<InputStore>((set, get) => ({
  ...initialState,

  // Movement setters
  setMovement: (movement: Vector2) => set({ movement }),

  setLook: (look: Vector2) => set({ look }),

  addLook: (delta: Vector2) => {
    const current = get().look;
    set({
      look: {
        x: Math.max(-1, Math.min(1, current.x + delta.x)),
        y: Math.max(-1, Math.min(1, current.y + delta.y)),
      },
    });
  },

  // Direction setter
  setDirection: (direction: Direction | null) => set({ direction }),

  // Button setters
  setInteract: (interact: boolean) => set({ interact }),
  setAction: (action: boolean) => set({ action }),
  setBack: (back: boolean) => set({ back }),

  // Input source management
  setActiveSource: (source: InputSource) => {
    const now = Date.now();
    const updates: Partial<InputStore> = { activeSource: source };

    if (source === 'keyboard') {
      updates.lastKeyboardInput = now;
    } else if (source === 'touch') {
      updates.lastTouchInput = now;
    } else if (source === 'gamepad') {
      updates.lastGamepadInput = now;
    }

    set(updates);
  },

  setTouchDevice: (isTouchDevice: boolean) => set({ isTouchDevice }),
  setHasGamepad: (hasGamepad: boolean) => set({ hasGamepad }),

  // Reset
  reset: () => set({
    movement: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    direction: null,
    interact: false,
    action: false,
    back: false,
  }),
}));
