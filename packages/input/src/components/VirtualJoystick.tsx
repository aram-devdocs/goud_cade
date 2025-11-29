'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useInputStore } from '../stores/useInputStore';
import { normalizeVector } from '../utils/deadzone';
import type { Vector2 } from '../types';

interface VirtualJoystickProps {
  size?: number;
  deadzone?: number;
  className?: string;
}

/**
 * Virtual joystick component for touch controls
 * Updates the input store's movement vector based on touch position
 */
export function VirtualJoystick({
  size = 120,
  deadzone = 0.1,
  className = '',
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const [knobPosition, setKnobPosition] = useState<Vector2>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const setMovement = useInputStore((state) => state.setMovement);
  const setActiveSource = useInputStore((state) => state.setActiveSource);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current !== null) return;

      const touch = e.changedTouches[0];
      if (!touch || !containerRef.current) return;

      touchIdRef.current = touch.identifier;
      setIsActive(true);
      setActiveSource('touch');

      // Calculate initial position
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = size / 2 - 20; // Account for knob size

      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;

      // Normalize to -1 to 1 range
      const normalizedX = Math.max(-1, Math.min(1, deltaX / maxRadius));
      const normalizedY = Math.max(-1, Math.min(1, deltaY / maxRadius));

      const vector = normalizeVector({ x: normalizedX, y: normalizedY });

      // Apply deadzone
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      if (magnitude < deadzone) {
        setKnobPosition({ x: 0, y: 0 });
        setMovement({ x: 0, y: 0 });
      } else {
        setKnobPosition({ x: vector.x * maxRadius, y: vector.y * maxRadius });
        setMovement(vector);
      }
    },
    [size, deadzone, setMovement, setActiveSource]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current === null || !containerRef.current) return;

      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current
      );
      if (!touch) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = size / 2 - 20;

      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;

      // Normalize to -1 to 1 range
      const normalizedX = Math.max(-1, Math.min(1, deltaX / maxRadius));
      const normalizedY = Math.max(-1, Math.min(1, deltaY / maxRadius));

      const vector = normalizeVector({ x: normalizedX, y: normalizedY });

      // Apply deadzone
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      if (magnitude < deadzone) {
        setKnobPosition({ x: 0, y: 0 });
        setMovement({ x: 0, y: 0 });
      } else {
        // Clamp knob position to circle
        const clampedMagnitude = Math.min(1, magnitude);
        const scale = clampedMagnitude / magnitude;
        setKnobPosition({
          x: vector.x * scale * maxRadius,
          y: vector.y * scale * maxRadius,
        });
        setMovement(vector);
      }

      setActiveSource('touch');
    },
    [size, deadzone, setMovement, setActiveSource]
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setMovement({ x: 0, y: 0 });
    };
  }, [setMovement]);

  const knobSize = 50;
  const halfKnob = knobSize / 2;

  return (
    <div
      ref={containerRef}
      data-touch-control="joystick"
      className={`relative touch-none select-none ${className}`}
      style={{
        width: size,
        height: size,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: isActive ? 'rgba(0, 255, 255, 0.8)' : 'rgba(0, 255, 255, 0.4)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          boxShadow: isActive
            ? '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.2)'
            : '0 0 10px rgba(0, 255, 255, 0.2)',
          transition: 'all 0.15s ease-out',
        }}
      />

      {/* Inner knob */}
      <div
        className="absolute rounded-full"
        style={{
          width: knobSize,
          height: knobSize,
          left: size / 2 - halfKnob + knobPosition.x,
          top: size / 2 - halfKnob + knobPosition.y,
          backgroundColor: isActive
            ? 'rgba(0, 255, 255, 0.9)'
            : 'rgba(0, 255, 255, 0.6)',
          boxShadow: isActive
            ? '0 0 15px rgba(0, 255, 255, 0.8)'
            : '0 0 8px rgba(0, 255, 255, 0.4)',
          transition: isActive ? 'none' : 'all 0.15s ease-out',
        }}
      />
    </div>
  );
}
