'use client';

import { useCallback, useState, useEffect } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { VirtualDPad } from './VirtualDPad';
import { TouchButton } from './TouchButton';
import { useInputStore } from '../stores/useInputStore';
import { useShouldShowTouchControls } from '../hooks/useInput';

type GameMode = 'walking' | 'transitioning' | 'playing';
type GameType = 'snake' | 'flappy' | null;

interface TouchControlsProps {
  mode: GameMode;
  gameType?: GameType;
  onInteract?: () => void;
  onAction?: () => void;
  onExit?: () => void;
  className?: string;
}

/**
 * Hook for responsive scaling based on screen size
 * Returns a scale factor to adjust control sizes for different devices
 */
function useResponsiveScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      // Base size for 375px (iPhone SE), scale up/down from there
      // Min scale: 0.7 (small phones), Max scale: 1.3 (tablets)
      setScale(Math.max(0.7, Math.min(1.3, minDimension / 375)));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
}

/**
 * Container component that renders the appropriate touch controls based on game mode
 * - Walking mode: Joystick for movement + Interact button
 * - Playing mode: D-Pad for direction + Action/Exit buttons
 */
export function TouchControls({
  mode,
  gameType,
  onInteract,
  onAction,
  onExit,
}: TouchControlsProps) {
  const shouldShow = useShouldShowTouchControls();
  const scale = useResponsiveScale();
  const setInteract = useInputStore((state) => state.setInteract);
  const setAction = useInputStore((state) => state.setAction);
  const setBack = useInputStore((state) => state.setBack);

  const handleInteract = useCallback(() => {
    setInteract(true);
    onInteract?.();
    setTimeout(() => setInteract(false), 100);
  }, [setInteract, onInteract]);

  const handleAction = useCallback(() => {
    setAction(true);
    onAction?.();
    setTimeout(() => setAction(false), 100);
  }, [setAction, onAction]);

  const handleExit = useCallback(() => {
    setBack(true);
    onExit?.();
    setTimeout(() => setBack(false), 100);
  }, [setBack, onExit]);

  // Don't render if we shouldn't show touch controls
  if (!shouldShow || mode === 'transitioning') {
    return null;
  }

  return (
    <div
      id="touch-controls-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        touchAction: 'none',
      }}
    >
      {mode === 'walking' && (
        <>
          {/* Movement joystick - bottom left */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 40,
              pointerEvents: 'auto',
            }}
          >
            <VirtualJoystick size={Math.round(120 * scale)} />
          </div>

          {/* Interact button - bottom right */}
          <div
            style={{
              position: 'absolute',
              right: 25,
              bottom: 50,
              pointerEvents: 'auto',
            }}
          >
            <TouchButton
              label="E"
              onPress={handleInteract}
              size={Math.round(60 * scale)}
            />
          </div>

          {/* Hint text */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: Math.round(8 * scale),
              fontFamily: '"Press Start 2P", monospace',
              textAlign: 'center',
              pointerEvents: 'none',
              letterSpacing: 1,
            }}
          >
            DRAG TO LOOK
          </div>
        </>
      )}

      {mode === 'playing' && (
        <>
          {/* Tap-anywhere overlay for Flappy Bird */}
          {gameType === 'flappy' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'auto',
                zIndex: 0,
              }}
              onTouchStart={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('[data-touch-control]')) {
                  handleAction();
                }
              }}
            />
          )}

          {/* D-Pad - bottom left */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 30,
              pointerEvents: 'auto',
              zIndex: 1,
            }}
          >
            <VirtualDPad size={Math.round(140 * scale)} />
          </div>

          {/* Action buttons - bottom right */}
          <div
            style={{
              position: 'absolute',
              right: 25,
              bottom: 40,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: Math.round(10 * scale),
              zIndex: 1,
            }}
          >
            <TouchButton
              label="GO"
              onPress={handleAction}
              size={Math.round(55 * scale)}
              variant="action"
            />
            <TouchButton
              label="✕"
              onPress={handleExit}
              size={Math.round(45 * scale)}
              variant="exit"
            />
          </div>
        </>
      )}
    </div>
  );
}
