'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useInputStore } from '../stores/useInputStore';
import { isTouchDevice } from '../utils/deviceDetection';

/**
 * Hook to detect touch device and set up basic touch tracking
 * The actual touch controls are handled by the VirtualJoystick and TouchButton components
 * This hook handles camera look via touch drag
 */
export function useTouchInput(enabled: boolean = true) {
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);

  const setTouchDevice = useInputStore((state) => state.setTouchDevice);
  const addLook = useInputStore((state) => state.addLook);
  const setActiveSource = useInputStore((state) => state.setActiveSource);

  // Handle touch start for camera look (right side of screen)
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      // Only handle touches on the right side of the screen for camera look
      // (left side is reserved for joystick)
      for (const touch of Array.from(e.changedTouches)) {
        const screenWidth = window.innerWidth;
        const isRightSide = touch.clientX > screenWidth * 0.4;

        // Don't capture if touching a UI element
        const target = touch.target as HTMLElement;
        if (target.closest('[data-touch-control]')) {
          continue;
        }

        if (isRightSide && activeTouchIdRef.current === null) {
          activeTouchIdRef.current = touch.identifier;
          lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
          setActiveSource('touch');
        }
      }
    },
    [enabled, setActiveSource]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || activeTouchIdRef.current === null) return;

      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === activeTouchIdRef.current && lastTouchRef.current) {
          const deltaX = touch.clientX - lastTouchRef.current.x;
          const deltaY = touch.clientY - lastTouchRef.current.y;

          // Convert pixel delta to rotation radians
          // Lower sensitivity for smoother control - approximately 180 degrees per full screen swipe
          const screenWidth = window.innerWidth;
          const sensitivity = Math.PI / screenWidth; // Pi radians (180 deg) per screen width

          addLook({
            x: deltaX * sensitivity,
            y: deltaY * sensitivity,
          });

          lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
          setActiveSource('touch');
        }
      }
    },
    [enabled, addLook, setActiveSource]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === activeTouchIdRef.current) {
          activeTouchIdRef.current = null;
          lastTouchRef.current = null;
        }
      }
    },
    []
  );

  useEffect(() => {
    // Detect touch device on mount
    const isTouch = isTouchDevice();
    setTouchDevice(isTouch);
  }, [setTouchDevice]);

  useEffect(() => {
    if (!enabled) return;

    // Add touch event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);

      activeTouchIdRef.current = null;
      lastTouchRef.current = null;
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
