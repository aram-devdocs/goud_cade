'use client';

import { useEffect } from 'react';
import { useInputStore } from '../stores/useInputStore';
import { useKeyboardInput } from './useKeyboardInput';
import { useGamepadInput } from './useGamepadInput';
import { useTouchInput } from './useTouchInput';

interface UseInputOptions {
  keyboard?: boolean;
  gamepad?: boolean;
  touch?: boolean;
}

/**
 * Main input hook that combines all input sources
 * Use this in your main app component to enable input handling
 */
export function useInput(options: UseInputOptions = {}) {
  const { keyboard = true, gamepad = true, touch = true } = options;

  // Initialize all input handlers
  useKeyboardInput(keyboard);
  useGamepadInput(gamepad);
  useTouchInput(touch);

  // Return input state and actions from the store
  const movement = useInputStore((state) => state.movement);
  const look = useInputStore((state) => state.look);
  const direction = useInputStore((state) => state.direction);
  const interact = useInputStore((state) => state.interact);
  const action = useInputStore((state) => state.action);
  const back = useInputStore((state) => state.back);
  const activeSource = useInputStore((state) => state.activeSource);
  const isTouchDevice = useInputStore((state) => state.isTouchDevice);
  const hasGamepad = useInputStore((state) => state.hasGamepad);
  const reset = useInputStore((state) => state.reset);

  return {
    // Input values
    movement,
    look,
    direction,
    interact,
    action,
    back,

    // Device info
    activeSource,
    isTouchDevice,
    hasGamepad,

    // Actions
    reset,
  };
}

/**
 * Hook to get movement input (for Player component)
 */
export function useMovementInput() {
  const movement = useInputStore((state) => state.movement);
  const look = useInputStore((state) => state.look);
  return { movement, look };
}

/**
 * Hook to get direction input (for games like Snake)
 */
export function useDirectionInput() {
  const direction = useInputStore((state) => state.direction);
  return direction;
}

/**
 * Hook to get button states
 */
export function useButtonInput() {
  const interact = useInputStore((state) => state.interact);
  const action = useInputStore((state) => state.action);
  const back = useInputStore((state) => state.back);
  return { interact, action, back };
}

/**
 * Hook to subscribe to interact button presses with edge detection
 */
export function useInteractPress(callback: () => void) {
  const interact = useInputStore((state) => state.interact);

  useEffect(() => {
    if (interact) {
      callback();
    }
  }, [interact, callback]);
}

/**
 * Hook to subscribe to action button presses with edge detection
 */
export function useActionPress(callback: () => void) {
  const action = useInputStore((state) => state.action);

  useEffect(() => {
    if (action) {
      callback();
    }
  }, [action, callback]);
}

/**
 * Hook to subscribe to back button presses with edge detection
 */
export function useBackPress(callback: () => void) {
  const back = useInputStore((state) => state.back);

  useEffect(() => {
    if (back) {
      callback();
    }
  }, [back, callback]);
}

/**
 * Hook to check if touch controls should be visible
 * Returns true if on a touch device and not using keyboard/gamepad recently
 */
export function useShouldShowTouchControls(): boolean {
  const isTouchDevice = useInputStore((state) => state.isTouchDevice);
  const activeSource = useInputStore((state) => state.activeSource);

  // Show touch controls if:
  // 1. It's a touch device, AND
  // 2. Either no other input is active, or touch is the active source
  return isTouchDevice && (activeSource === null || activeSource === 'touch');
}
