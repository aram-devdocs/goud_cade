'use client';

import { useEffect, useRef, useState } from 'react';

interface FPSOptions {
  /** How often to update the displayed FPS (in ms). Default: 500 */
  updateInterval?: number;
  /** Whether the FPS counter is enabled. Default: true */
  enabled?: boolean;
}

/**
 * Hook to track frames per second.
 * Uses requestAnimationFrame to measure actual render performance.
 */
export function useFPS(options: FPSOptions = {}): number {
  const { updateInterval = 500, enabled = true } = options;

  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setFps(0);
      return;
    }

    function measureFrame(currentTime: number) {
      frameCountRef.current++;

      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= updateInterval) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(measureFrame);
    }

    // Start measuring
    lastTimeRef.current = performance.now();
    frameCountRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, updateInterval]);

  return fps;
}
