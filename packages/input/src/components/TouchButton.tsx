'use client';

import { useRef, useCallback, useState } from 'react';

type ButtonVariant = 'default' | 'action' | 'exit';

interface TouchButtonProps {
  label: string;
  onPress: () => void;
  onRelease?: () => void;
  size?: number;
  variant?: ButtonVariant;
}

/**
 * Touch button component for action buttons
 * Minimal Dark design - subtle, unobtrusive controls
 */
export function TouchButton({
  label,
  onPress,
  onRelease,
  size = 60,
  variant = 'default',
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Note: preventDefault not needed - touch-action: none handles scroll prevention
      e.stopPropagation();
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

  // Get variant-specific colors
  const getVariantStyles = () => {
    switch (variant) {
      case 'action':
        return {
          bgActive: 'rgba(100, 200, 100, 0.4)',
          bgInactive: 'rgba(60, 120, 60, 0.3)',
          borderActive: 'rgba(140, 255, 140, 0.6)',
          borderInactive: 'rgba(100, 200, 100, 0.3)',
          glowColor: 'rgba(100, 200, 100, 0.3)',
        };
      case 'exit':
        return {
          bgActive: 'rgba(200, 100, 100, 0.4)',
          bgInactive: 'rgba(120, 60, 60, 0.3)',
          borderActive: 'rgba(255, 140, 140, 0.6)',
          borderInactive: 'rgba(200, 100, 100, 0.3)',
          glowColor: 'rgba(200, 100, 100, 0.3)',
        };
      default:
        return {
          bgActive: 'rgba(255, 255, 255, 0.35)',
          bgInactive: 'rgba(0, 0, 0, 0.5)',
          borderActive: 'rgba(255, 255, 255, 0.6)',
          borderInactive: 'rgba(255, 255, 255, 0.2)',
          glowColor: 'rgba(255, 255, 255, 0.2)',
        };
    }
  };

  const colors = getVariantStyles();

  return (
    <button
      type="button"
      data-touch-control="button"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: isPressed ? colors.bgActive : colors.bgInactive,
        border: '1px solid',
        borderColor: isPressed ? colors.borderActive : colors.borderInactive,
        boxShadow: isPressed
          ? `0 0 15px ${colors.glowColor}, inset 0 0 10px rgba(255, 255, 255, 0.1)`
          : 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.1s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'pointer',
        outline: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <span
        style={{
          color: isPressed ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.8)',
          fontSize: size * 0.28,
          fontWeight: 'bold',
          fontFamily: '"Press Start 2P", monospace',
          textShadow: isPressed ? '0 0 8px rgba(255, 255, 255, 0.5)' : 'none',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}
