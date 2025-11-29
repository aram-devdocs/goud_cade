'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useInputStore } from '../stores/useInputStore';
import { normalizeVector } from '../utils/deadzone';
import type { Vector2 } from '../types';

interface VirtualJoystickProps {
  size?: number;
  deadzone?: number;
}

/**
 * Virtual joystick component for touch controls
 * Minimal Dark design - frosted glass effect
 */
export function VirtualJoystick({
  size = 120,
  deadzone = 0.1,
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const [knobPosition, setKnobPosition] = useState<Vector2>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const setMovement = useInputStore((state) => state.setMovement);
  const setActiveSource = useInputStore((state) => state.setActiveSource);

  const knobSize = size * 0.4;
  const maxRadius = (size - knobSize) / 2 - 4;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current !== null) return;
      // Note: preventDefault not needed - touch-action: none handles scroll prevention
      e.stopPropagation();

      const touch = e.changedTouches[0];
      if (!touch || !containerRef.current) return;

      touchIdRef.current = touch.identifier;
      setIsActive(true);
      setActiveSource('touch');

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;

      const normalizedX = Math.max(-1, Math.min(1, deltaX / maxRadius));
      const normalizedY = Math.max(-1, Math.min(1, deltaY / maxRadius));

      const vector = normalizeVector({ x: normalizedX, y: normalizedY });
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

      if (magnitude < deadzone) {
        setKnobPosition({ x: 0, y: 0 });
        setMovement({ x: 0, y: 0 });
      } else {
        const clampedMag = Math.min(1, magnitude);
        setKnobPosition({ x: vector.x * clampedMag * maxRadius, y: vector.y * clampedMag * maxRadius });
        setMovement(vector);
      }
    },
    [maxRadius, deadzone, setMovement, setActiveSource]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current === null || !containerRef.current) return;
      // Note: preventDefault not needed - touch-action: none handles scroll prevention

      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current
      );
      if (!touch) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;

      const normalizedX = Math.max(-1, Math.min(1, deltaX / maxRadius));
      const normalizedY = Math.max(-1, Math.min(1, deltaY / maxRadius));

      const vector = normalizeVector({ x: normalizedX, y: normalizedY });
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

      if (magnitude < deadzone) {
        setKnobPosition({ x: 0, y: 0 });
        setMovement({ x: 0, y: 0 });
      } else {
        const clampedMag = Math.min(1, magnitude);
        setKnobPosition({
          x: vector.x * clampedMag * maxRadius,
          y: vector.y * clampedMag * maxRadius,
        });
        setMovement(vector);
      }

      setActiveSource('touch');
    },
    [maxRadius, deadzone, setMovement, setActiveSource]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current
      );
      if (!touch) return;

      touchIdRef.current = null;
      setIsActive(false);
      setKnobPosition({ x: 0, y: 0 });
      setMovement({ x: 0, y: 0 });
    },
    [setMovement]
  );

  useEffect(() => {
    return () => {
      setMovement({ x: 0, y: 0 });
    };
  }, [setMovement]);

  return (
    <div
      ref={containerRef}
      data-touch-control="joystick"
      style={{
        position: 'relative',
        width: size,
        height: size,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Outer ring - frosted glass effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid',
          borderColor: isActive ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
          boxShadow: isActive
            ? '0 0 15px rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)'
            : 'inset 0 0 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.15s ease-out',
        }}
      />

      {/* Inner knob */}
      <div
        style={{
          position: 'absolute',
          width: knobSize,
          height: knobSize,
          left: size / 2 - knobSize / 2 + knobPosition.x,
          top: size / 2 - knobSize / 2 + knobPosition.y,
          borderRadius: '50%',
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.2)',
          border: '1px solid',
          borderColor: isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.25)',
          boxShadow: isActive
            ? '0 0 12px rgba(255, 255, 255, 0.3)'
            : '0 2px 4px rgba(0, 0, 0, 0.3)',
          transition: isActive ? 'none' : 'all 0.15s ease-out',
        }}
      />
    </div>
  );
}
