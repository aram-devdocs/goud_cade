'use client';

import { useEffect, useRef } from 'react';
import { useInputStore } from '../stores/useInputStore';
import type { Direction } from '../types';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  action: boolean;
  back: boolean;
}

const initialKeyState: KeyState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  interact: false,
  action: false,
  back: false,
};

/**
 * Hook to handle keyboard input and update the input store
 * Also handles mouse movement for camera look
 */
export function useKeyboardInput(enabled: boolean = true) {
  const keyStateRef = useRef<KeyState>({ ...initialKeyState });
  const isPointerLockedRef = useRef(false);

  const setMovement = useInputStore((state) => state.setMovement);
  const addLook = useInputStore((state) => state.addLook);
  const setDirection = useInputStore((state) => state.setDirection);
  const setInteract = useInputStore((state) => state.setInteract);
  const setAction = useInputStore((state) => state.setAction);
  const setBack = useInputStore((state) => state.setBack);
  const setActiveSource = useInputStore((state) => state.setActiveSource);

  useEffect(() => {
    if (!enabled) return;

    const updateMovement = () => {
      const keys = keyStateRef.current;

      // Calculate movement vector
      let x = 0;
      let y = 0;

      if (keys.forward) y -= 1;
      if (keys.backward) y += 1;
      if (keys.left) x -= 1;
      if (keys.right) x += 1;

      // Normalize diagonal movement
      if (x !== 0 && y !== 0) {
        const magnitude = Math.sqrt(x * x + y * y);
        x /= magnitude;
        y /= magnitude;
      }

      setMovement({ x, y });

      // Convert to discrete direction for games
      let direction: Direction | null = null;
      if (keys.forward && !keys.backward) direction = 'UP';
      else if (keys.backward && !keys.forward) direction = 'DOWN';
      else if (keys.left && !keys.right) direction = 'LEFT';
      else if (keys.right && !keys.left) direction = 'RIGHT';

      setDirection(direction);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      let handled = false;
      const keys = keyStateRef.current;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.forward = true;
          handled = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.backward = true;
          handled = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = true;
          handled = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = true;
          handled = true;
          break;
        case 'KeyE':
          if (!keys.interact) {
            keys.interact = true;
            setInteract(true);
          }
          handled = true;
          break;
        case 'Space':
          if (!keys.action) {
            keys.action = true;
            setAction(true);
          }
          handled = true;
          break;
        case 'Escape':
          if (!keys.back) {
            keys.back = true;
            setBack(true);
          }
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        setActiveSource('keyboard');
        updateMovement();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keys = keyStateRef.current;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = false;
          break;
        case 'KeyE':
          keys.interact = false;
          setInteract(false);
          break;
        case 'Space':
          keys.action = false;
          setAction(false);
          break;
        case 'Escape':
          keys.back = false;
          setBack(false);
          break;
      }

      updateMovement();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Only handle mouse movement when pointer is locked (first-person mode)
      if (!document.pointerLockElement) return;

      const sensitivity = 0.002;
      addLook({
        x: e.movementX * sensitivity,
        y: e.movementY * sensitivity,
      });
      setActiveSource('keyboard');
    };

    const handlePointerLockChange = () => {
      isPointerLockedRef.current = !!document.pointerLockElement;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);

      // Reset key state
      keyStateRef.current = { ...initialKeyState };
    };
  }, [enabled, setMovement, addLook, setDirection, setInteract, setAction, setBack, setActiveSource]);
}
