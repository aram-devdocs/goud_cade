'use client';

import { useRef, useCallback, useState } from 'react';

interface TouchButtonProps {
  label: string;
  onPress: () => void;
  onRelease?: () => void;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Generic touch button component for action buttons
 * Handles touch events with proper press/release detection
 */
export function TouchButton({
  label,
  onPress,
  onRelease,
  size = 60,
  color = '#ff00ff',
  className = '',
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (touchIdRef.current !== null) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      touchIdRef.current = touch.identifier;
      setIsPressed(true);
      onPress();
    },
    [onPress]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === touchIdRef.current
      );
      if (!touch) return;

      touchIdRef.current = null;
      setIsPressed(false);
      onRelease?.();
    },
    [onRelease]
  );

  // Parse color for styling
  const baseColor = color;

  return (
    <button
      type="button"
      data-touch-control="button"
      className={`flex items-center justify-center rounded-full touch-none select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: isPressed
          ? `${baseColor}dd`
          : `${baseColor}66`,
        border: '3px solid',
        borderColor: isPressed ? baseColor : `${baseColor}99`,
        boxShadow: isPressed
          ? `0 0 25px ${baseColor}aa, inset 0 0 15px ${baseColor}44`
          : `0 0 12px ${baseColor}44`,
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.1s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <span
        style={{
          color: isPressed ? '#000' : '#fff',
          fontSize: size * 0.25,
          fontWeight: 'bold',
          fontFamily: '"Press Start 2P", monospace',
          textShadow: isPressed ? 'none' : `0 0 5px ${baseColor}`,
        }}
      >
        {label}
      </span>
    </button>
  );
}
