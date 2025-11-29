'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInputStore } from '../stores/useInputStore';
import { applyRadialDeadzone } from '../utils/deadzone';
import { GAMEPAD_BUTTONS, GAMEPAD_AXES, type Direction } from '../types';

interface GamepadButtonState {
  interact: boolean;
  action: boolean;
  back: boolean;
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
}

const initialButtonState: GamepadButtonState = {
  interact: false,
  action: false,
  back: false,
  dpadUp: false,
  dpadDown: false,
  dpadLeft: false,
  dpadRight: false,
};

/**
 * Hook to handle gamepad input using the Gamepad API
 * Polls gamepad state in an animation frame loop
 */
export function useGamepadInput(enabled: boolean = true) {
  const animationFrameRef = useRef<number | null>(null);
  const buttonStateRef = useRef<GamepadButtonState>({ ...initialButtonState });

  const setMovement = useInputStore((state) => state.setMovement);
  const setLook = useInputStore((state) => state.setLook);
  const setDirection = useInputStore((state) => state.setDirection);
  const setInteract = useInputStore((state) => state.setInteract);
  const setAction = useInputStore((state) => state.setAction);
  const setBack = useInputStore((state) => state.setBack);
  const setActiveSource = useInputStore((state) => state.setActiveSource);
  const setHasGamepad = useInputStore((state) => state.setHasGamepad);

  const pollGamepad = useCallback(() => {
    if (!enabled) return;

    const gamepads = navigator.getGamepads();
    let gamepad: Gamepad | null = null;

    // Find the first connected gamepad
    for (const gp of gamepads) {
      if (gp !== null) {
        gamepad = gp;
        break;
      }
    }

    if (!gamepad) {
      setHasGamepad(false);
      animationFrameRef.current = requestAnimationFrame(pollGamepad);
      return;
    }

    setHasGamepad(true);

    // Read analog sticks
    const leftStick = applyRadialDeadzone({
      x: gamepad.axes[GAMEPAD_AXES.LEFT_X] ?? 0,
      y: gamepad.axes[GAMEPAD_AXES.LEFT_Y] ?? 0,
    });

    const rightStick = applyRadialDeadzone({
      x: gamepad.axes[GAMEPAD_AXES.RIGHT_X] ?? 0,
      y: gamepad.axes[GAMEPAD_AXES.RIGHT_Y] ?? 0,
    });

    // Check if there's any gamepad input
    const hasInput =
      leftStick.x !== 0 ||
      leftStick.y !== 0 ||
      rightStick.x !== 0 ||
      rightStick.y !== 0 ||
      gamepad.buttons.some((b) => b.pressed);

    if (hasInput) {
      setActiveSource('gamepad');
    }

    // Update movement from left stick
    setMovement(leftStick);

    // Update look from right stick (scale for sensitivity)
    const lookSensitivity = 0.05;
    setLook({
      x: rightStick.x * lookSensitivity,
      y: rightStick.y * lookSensitivity,
    });

    // Read D-pad for direction (useful for games like Snake)
    const buttons = buttonStateRef.current;
    const dpadUp = gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP]?.pressed ?? false;
    const dpadDown = gamepad.buttons[GAMEPAD_BUTTONS.DPAD_DOWN]?.pressed ?? false;
    const dpadLeft = gamepad.buttons[GAMEPAD_BUTTONS.DPAD_LEFT]?.pressed ?? false;
    const dpadRight = gamepad.buttons[GAMEPAD_BUTTONS.DPAD_RIGHT]?.pressed ?? false;

    // Determine direction from D-pad
    let direction: Direction | null = null;
    if (dpadUp && !dpadDown) direction = 'UP';
    else if (dpadDown && !dpadUp) direction = 'DOWN';
    else if (dpadLeft && !dpadRight) direction = 'LEFT';
    else if (dpadRight && !dpadLeft) direction = 'RIGHT';

    // Also use left stick for direction if D-pad not pressed
    if (!direction && (Math.abs(leftStick.x) > 0.5 || Math.abs(leftStick.y) > 0.5)) {
      if (Math.abs(leftStick.y) > Math.abs(leftStick.x)) {
        direction = leftStick.y < 0 ? 'UP' : 'DOWN';
      } else {
        direction = leftStick.x < 0 ? 'LEFT' : 'RIGHT';
      }
    }

    setDirection(direction);

    // Update buttons with edge detection
    const aPressed = gamepad.buttons[GAMEPAD_BUTTONS.A]?.pressed ?? false;
    const bPressed = gamepad.buttons[GAMEPAD_BUTTONS.B]?.pressed ?? false;
    const xPressed = gamepad.buttons[GAMEPAD_BUTTONS.X]?.pressed ?? false;

    // A button = interact/action
    if (aPressed !== buttons.interact) {
      buttons.interact = aPressed;
      setInteract(aPressed);
      // Also trigger action on A press
      if (aPressed) {
        setAction(true);
      }
    }

    // X button = action (alternative)
    if (xPressed !== buttons.action) {
      buttons.action = xPressed;
      setAction(xPressed);
    }

    // B button = back
    if (bPressed !== buttons.back) {
      buttons.back = bPressed;
      setBack(bPressed);
    }

    // Continue polling
    animationFrameRef.current = requestAnimationFrame(pollGamepad);
  }, [enabled, setMovement, setLook, setDirection, setInteract, setAction, setBack, setActiveSource, setHasGamepad]);

  useEffect(() => {
    if (!enabled) return;

    // Check for Gamepad API support
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return;
    }

    // Handle gamepad connection events
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      setHasGamepad(true);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      // Check if any gamepads remain
      const gamepads = navigator.getGamepads();
      const hasRemaining = gamepads.some((gp) => gp !== null);
      setHasGamepad(hasRemaining);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Start polling
    animationFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Reset button state
      buttonStateRef.current = { ...initialButtonState };
    };
  }, [enabled, pollGamepad, setHasGamepad]);
}
