'use client';

import { useRef, useCallback, useState } from 'react';
import { useInputStore } from '../stores/useInputStore';
import type { Direction } from '../types';

interface VirtualDPadProps {
  size?: number;
}

/**
 * Virtual D-Pad component for directional input (used in games like Snake)
 * Minimal Dark design - subtle, unobtrusive controls
 */
export function VirtualDPad({ size = 140 }: VirtualDPadProps) {
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
  const touchIdRef = useRef<number | null>(null);

  const setDirection = useInputStore((state) => state.setDirection);
  const setActiveSource = useInputStore((state) => state.setActiveSource);

  const buttonSize = size * 0.35;
  const gap = size * 0.05;

  const handleDirectionStart = useCallback(
    (direction: Direction, touchId: number) => {
      touchIdRef.current = touchId;
      setActiveDirection(direction);
      setDirection(direction);
      setActiveSource('touch');
    },
    [setDirection, setActiveSource]
  );

  const handleDirectionEnd = useCallback(
    (touchId: number) => {
      if (touchIdRef.current === touchId) {
        touchIdRef.current = null;
        setActiveDirection(null);
        setDirection(null);
      }
    },
    [setDirection]
  );

  const createButtonHandlers = (direction: Direction) => ({
    onTouchStart: (e: React.TouchEvent) => {
      // Note: preventDefault not needed - touch-action: none handles scroll prevention
      e.stopPropagation();
      const touch = e.changedTouches[0];
      if (touch) {
        handleDirectionStart(direction, touch.identifier);
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch) {
        handleDirectionEnd(touch.identifier);
      }
    },
    onTouchCancel: (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch) {
        handleDirectionEnd(touch.identifier);
      }
    },
  });

  const getButtonStyle = (direction: Direction, positionStyle: React.CSSProperties): React.CSSProperties => {
    const isActive = activeDirection === direction;
    return {
      position: 'absolute',
      ...positionStyle,
      width: buttonSize,
      height: buttonSize,
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.5)',
      border: '1px solid',
      borderColor: isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isActive ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none',
      transition: 'all 0.1s ease-out',
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    };
  };

  const getArrowStyle = (direction: Direction): React.CSSProperties => {
    const isActive = activeDirection === direction;
    const arrowSize = buttonSize * 0.25;
    const base: React.CSSProperties = {
      width: 0,
      height: 0,
      borderStyle: 'solid',
      opacity: isActive ? 1 : 0.6,
    };

    switch (direction) {
      case 'UP':
        return {
          ...base,
          borderWidth: `0 ${arrowSize}px ${arrowSize * 1.2}px ${arrowSize}px`,
          borderColor: 'transparent transparent rgba(255,255,255,0.9) transparent',
        };
      case 'DOWN':
        return {
          ...base,
          borderWidth: `${arrowSize * 1.2}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: 'rgba(255,255,255,0.9) transparent transparent transparent',
        };
      case 'LEFT':
        return {
          ...base,
          borderWidth: `${arrowSize}px ${arrowSize * 1.2}px ${arrowSize}px 0`,
          borderColor: 'transparent rgba(255,255,255,0.9) transparent transparent',
        };
      case 'RIGHT':
        return {
          ...base,
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize * 1.2}px`,
          borderColor: 'transparent transparent transparent rgba(255,255,255,0.9)',
        };
    }
  };

  return (
    <div
      data-touch-control="dpad"
      style={{
        position: 'relative',
        width: size,
        height: size,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Up button */}
      <button
        type="button"
        style={getButtonStyle('UP', {
          left: (size - buttonSize) / 2,
          top: gap,
        })}
        {...createButtonHandlers('UP')}
      >
        <div style={getArrowStyle('UP')} />
      </button>

      {/* Down button */}
      <button
        type="button"
        style={getButtonStyle('DOWN', {
          left: (size - buttonSize) / 2,
          bottom: gap,
        })}
        {...createButtonHandlers('DOWN')}
      >
        <div style={getArrowStyle('DOWN')} />
      </button>

      {/* Left button */}
      <button
        type="button"
        style={getButtonStyle('LEFT', {
          left: gap,
          top: (size - buttonSize) / 2,
        })}
        {...createButtonHandlers('LEFT')}
      >
        <div style={getArrowStyle('LEFT')} />
      </button>

      {/* Right button */}
      <button
        type="button"
        style={getButtonStyle('RIGHT', {
          right: gap,
          top: (size - buttonSize) / 2,
        })}
        {...createButtonHandlers('RIGHT')}
      >
        <div style={getArrowStyle('RIGHT')} />
      </button>

      {/* Center decoration */}
      <div
        style={{
          position: 'absolute',
          left: (size - buttonSize * 0.5) / 2,
          top: (size - buttonSize * 0.5) / 2,
          width: buttonSize * 0.5,
          height: buttonSize * 0.5,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 6,
        }}
      />
    </div>
  );
}
