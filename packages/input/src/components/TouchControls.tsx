'use client';

import { useCallback } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { VirtualDPad } from './VirtualDPad';
import { TouchButton } from './TouchButton';
import { useInputStore } from '../stores/useInputStore';
import { useShouldShowTouchControls } from '../hooks/useInput';

type GameMode = 'walking' | 'transitioning' | 'playing';

interface TouchControlsProps {
  mode: GameMode;
  onInteract?: () => void;
  onAction?: () => void;
  onExit?: () => void;
  className?: string;
}

/**
 * Container component that renders the appropriate touch controls based on game mode
 * - Walking mode: Joystick for movement + Interact button
 * - Playing mode: D-Pad for direction + Action/Exit buttons
 */
export function TouchControls({
  mode,
  onInteract,
  onAction,
  onExit,
  className = '',
}: TouchControlsProps) {
  const shouldShow = useShouldShowTouchControls();
  const setInteract = useInputStore((state) => state.setInteract);
  const setAction = useInputStore((state) => state.setAction);
  const setBack = useInputStore((state) => state.setBack);

  const handleInteract = useCallback(() => {
    setInteract(true);
    onInteract?.();
    // Reset after a short delay
    setTimeout(() => setInteract(false), 100);
  }, [setInteract, onInteract]);

  const handleAction = useCallback(() => {
    setAction(true);
    onAction?.();
    // Reset after a short delay
    setTimeout(() => setAction(false), 100);
  }, [setAction, onAction]);

  const handleExit = useCallback(() => {
    setBack(true);
    onExit?.();
    // Reset after a short delay
    setTimeout(() => setBack(false), 100);
  }, [setBack, onExit]);

  // Don't render if we shouldn't show touch controls
  if (!shouldShow) {
    return null;
  }

  // Don't show during transition
  if (mode === 'transitioning') {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      style={{
        touchAction: 'none',
      }}
    >
      {mode === 'walking' && (
        <>
          {/* Movement joystick - bottom left */}
          <div
            className="absolute pointer-events-auto"
            style={{
              left: 20,
              bottom: 40,
            }}
          >
            <VirtualJoystick size={130} />
          </div>

          {/* Interact button - bottom right */}
          <div
            className="absolute pointer-events-auto"
            style={{
              right: 30,
              bottom: 60,
            }}
          >
            <TouchButton
              label="E"
              onPress={handleInteract}
              size={70}
              color="#00ffff"
            />
          </div>

          {/* Hint text */}
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center"
            style={{
              bottom: 10,
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 10,
              fontFamily: '"Press Start 2P", monospace',
            }}
          >
            DRAG TO LOOK
          </div>
        </>
      )}

      {mode === 'playing' && (
        <>
          {/* D-Pad - bottom left */}
          <div
            className="absolute pointer-events-auto"
            style={{
              left: 20,
              bottom: 30,
            }}
          >
            <VirtualDPad size={150} />
          </div>

          {/* Action buttons - bottom right */}
          <div
            className="absolute pointer-events-auto flex flex-col gap-3"
            style={{
              right: 25,
              bottom: 40,
            }}
          >
            <TouchButton
              label="GO"
              onPress={handleAction}
              size={65}
              color="#00ff00"
            />
            <TouchButton
              label="X"
              onPress={handleExit}
              size={55}
              color="#ff0000"
            />
          </div>
        </>
      )}
    </div>
  );
}
