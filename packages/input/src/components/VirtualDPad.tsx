'use client';

import { useRef, useCallback, useState } from 'react';
import { useInputStore } from '../stores/useInputStore';
import type { Direction } from '../types';

interface VirtualDPadProps {
  size?: number;
  className?: string;
}

/**
 * Virtual D-Pad component for directional input (used in games like Snake)
 * Updates the input store's direction based on which button is pressed
 */
export function VirtualDPad({ size = 140, className = '' }: VirtualDPadProps) {
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);
  const touchIdRef = useRef<number | null>(null);

  const setDirection = useInputStore((state) => state.setDirection);
  const setActiveSource = useInputStore((state) => state.setActiveSource);

  const buttonSize = size * 0.35;

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
      e.preventDefault();
      const touch = e.changedTouches[0];
      if (touch) {
        handleDirectionStart(direction, touch.identifier);
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
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

  const getButtonStyle = (direction: Direction, position: React.CSSProperties) => ({
    ...position,
    width: buttonSize,
    height: buttonSize,
    backgroundColor:
      activeDirection === direction
        ? 'rgba(0, 255, 0, 0.8)'
        : 'rgba(0, 255, 0, 0.4)',
    border: '2px solid',
    borderColor:
      activeDirection === direction
        ? 'rgba(0, 255, 0, 1)'
        : 'rgba(0, 255, 0, 0.6)',
    boxShadow:
      activeDirection === direction
        ? '0 0 20px rgba(0, 255, 0, 0.8), inset 0 0 10px rgba(0, 255, 0, 0.4)'
        : '0 0 8px rgba(0, 255, 0, 0.3)',
    transition: 'all 0.1s ease-out',
  });

  const arrowStyle: React.CSSProperties = {
    width: 0,
    height: 0,
    borderStyle: 'solid',
  };

  return (
    <div
      data-touch-control="dpad"
      className={`relative touch-none select-none ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Up button */}
      <button
        type="button"
        className="absolute flex items-center justify-center rounded-lg"
        style={getButtonStyle('UP', {
          left: (size - buttonSize) / 2,
          top: 0,
        })}
        {...createButtonHandlers('UP')}
      >
        <div
          style={{
            ...arrowStyle,
            borderWidth: `0 ${buttonSize * 0.2}px ${buttonSize * 0.3}px ${buttonSize * 0.2}px`,
            borderColor: 'transparent transparent #000 transparent',
          }}
        />
      </button>

      {/* Down button */}
      <button
        type="button"
        className="absolute flex items-center justify-center rounded-lg"
        style={getButtonStyle('DOWN', {
          left: (size - buttonSize) / 2,
          bottom: 0,
        })}
        {...createButtonHandlers('DOWN')}
      >
        <div
          style={{
            ...arrowStyle,
            borderWidth: `${buttonSize * 0.3}px ${buttonSize * 0.2}px 0 ${buttonSize * 0.2}px`,
            borderColor: '#000 transparent transparent transparent',
          }}
        />
      </button>

      {/* Left button */}
      <button
        type="button"
        className="absolute flex items-center justify-center rounded-lg"
        style={getButtonStyle('LEFT', {
          left: 0,
          top: (size - buttonSize) / 2,
        })}
        {...createButtonHandlers('LEFT')}
      >
        <div
          style={{
            ...arrowStyle,
            borderWidth: `${buttonSize * 0.2}px ${buttonSize * 0.3}px ${buttonSize * 0.2}px 0`,
            borderColor: 'transparent #000 transparent transparent',
          }}
        />
      </button>

      {/* Right button */}
      <button
        type="button"
        className="absolute flex items-center justify-center rounded-lg"
        style={getButtonStyle('RIGHT', {
          right: 0,
          top: (size - buttonSize) / 2,
        })}
        {...createButtonHandlers('RIGHT')}
      >
        <div
          style={{
            ...arrowStyle,
            borderWidth: `${buttonSize * 0.2}px 0 ${buttonSize * 0.2}px ${buttonSize * 0.3}px`,
            borderColor: 'transparent transparent transparent #000',
          }}
        />
      </button>

      {/* Center decoration */}
      <div
        className="absolute rounded-lg"
        style={{
          left: (size - buttonSize * 0.6) / 2,
          top: (size - buttonSize * 0.6) / 2,
          width: buttonSize * 0.6,
          height: buttonSize * 0.6,
          backgroundColor: 'rgba(0, 50, 0, 0.5)',
          border: '1px solid rgba(0, 255, 0, 0.3)',
        }}
      />
    </div>
  );
}
