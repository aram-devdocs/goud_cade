'use client';

import { useCallback, useState, useEffect } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { VirtualDPad } from './VirtualDPad';
import { TouchButton } from './TouchButton';
import { useInputStore } from '../stores/useInputStore';
import { useShouldShowTouchControls } from '../hooks/useInput';

type GameMode = 'walking' | 'transitioning' | 'playing';
type GameType = 'snake' | 'flappy' | 'pacman' | 'soulknight' | null;
type Orientation = 'portrait' | 'landscape';
type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveLayout {
  scale: number;
  orientation: Orientation;
  deviceType: DeviceType;
  isPortrait: boolean;
  controlAreaHeight: number;
  safeAreaBottom: number;
}

interface TouchControlsProps {
  mode: GameMode;
  gameType?: GameType;
  onInteract?: () => void;
  onAction?: () => void;
  onExit?: () => void;
  className?: string;
}

/**
 * Hook for responsive layout based on screen size and orientation
 * Returns scale, orientation, device type, and layout dimensions
 */
function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>({
    scale: 1,
    orientation: 'landscape',
    deviceType: 'desktop',
    isPortrait: false,
    controlAreaHeight: 0,
    safeAreaBottom: 0,
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const minDimension = Math.min(width, height);

      // Determine orientation
      const orientation: Orientation = width < height ? 'portrait' : 'landscape';
      const isPortrait = orientation === 'portrait';

      // Determine device type
      let deviceType: DeviceType = 'desktop';
      if (width < 640) deviceType = 'mobile';
      else if (width < 1024) deviceType = 'tablet';

      // Calculate scale based on device and orientation
      let scale = 1;
      if (deviceType === 'mobile') {
        if (isPortrait) {
          // Larger controls in portrait for better thumb reach
          scale = Math.max(0.9, Math.min(1.2, width / 375));
        } else {
          // Smaller in landscape to not block game
          scale = Math.max(0.7, Math.min(1.0, height / 375));
        }
      } else if (deviceType === 'tablet') {
        scale = Math.max(1.0, Math.min(1.4, minDimension / 500));
      }

      // Calculate control area height for portrait mode
      // 35% of viewport height for mobile, 30% for tablet
      let controlAreaHeight = 0;
      if (isPortrait) {
        if (deviceType === 'mobile') {
          controlAreaHeight = height * 0.35;
        } else if (deviceType === 'tablet') {
          controlAreaHeight = height * 0.30;
        }
      }

      // Get safe area bottom
      const style = getComputedStyle(document.documentElement);
      const safeAreaBottom = parseInt(style.getPropertyValue('--safe-area-bottom') || '0', 10) || 0;

      setLayout({
        scale,
        orientation,
        deviceType,
        isPortrait,
        controlAreaHeight,
        safeAreaBottom,
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);

  return layout;
}

/**
 * Container component that renders the appropriate touch controls based on game mode
 * - Walking mode: Joystick for movement + Interact button
 * - Playing mode: D-Pad for direction + Action/Exit buttons
 *
 * Layout adapts based on orientation:
 * - Portrait: Dedicated control area at bottom with dark background
 * - Landscape: Overlay controls at corners
 */
export function TouchControls({
  mode,
  gameType,
  onInteract,
  onAction,
  onExit,
}: TouchControlsProps) {
  const shouldShow = useShouldShowTouchControls();
  const layout = useResponsiveLayout();
  const { scale, isPortrait, controlAreaHeight, safeAreaBottom, deviceType } = layout;
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

  // Portrait mode with mobile/tablet: dedicated bottom control area
  const usePortraitLayout = isPortrait && (deviceType === 'mobile' || deviceType === 'tablet');
  const bottomPadding = safeAreaBottom + 10;

  // Container styles based on orientation
  const containerStyle: React.CSSProperties = usePortraitLayout
    ? {
        // Portrait: fixed bottom area with background
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: controlAreaHeight,
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 70%, transparent 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        pointerEvents: 'none',
        zIndex: 9999,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: bottomPadding,
        boxSizing: 'border-box',
      }
    : {
        // Landscape: fullscreen overlay
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        touchAction: 'none',
      };

  return (
    <div id="touch-controls-container" style={containerStyle}>
      {mode === 'walking' && (
        <>
          {/* Movement joystick - left side */}
          <div
            style={{
              position: usePortraitLayout ? 'relative' : 'absolute',
              left: usePortraitLayout ? undefined : 20,
              bottom: usePortraitLayout ? undefined : 40 + bottomPadding,
              pointerEvents: 'auto',
            }}
          >
            <VirtualJoystick size={Math.round(120 * scale)} />
          </div>

          {/* Hint text - center (landscape only) */}
          {!usePortraitLayout && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 12 + bottomPadding,
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
          )}

          {/* Interact button - right side */}
          <div
            style={{
              position: usePortraitLayout ? 'relative' : 'absolute',
              right: usePortraitLayout ? undefined : 25,
              bottom: usePortraitLayout ? undefined : 50 + bottomPadding,
              pointerEvents: 'auto',
            }}
          >
            <TouchButton
              label="E"
              onPress={handleInteract}
              size={Math.round(60 * scale)}
            />
          </div>
        </>
      )}

      {mode === 'playing' && (
        <>
          {/* Tap-anywhere overlay for Flappy Bird */}
          {gameType === 'flappy' && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: usePortraitLayout ? controlAreaHeight : 0,
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

          {/* D-Pad - left side */}
          <div
            style={{
              position: usePortraitLayout ? 'relative' : 'absolute',
              left: usePortraitLayout ? undefined : 20,
              bottom: usePortraitLayout ? undefined : 30 + bottomPadding,
              pointerEvents: 'auto',
              zIndex: 1,
            }}
          >
            <VirtualDPad size={Math.round(140 * scale)} />
          </div>

          {/* Action buttons - right side */}
          <div
            style={{
              position: usePortraitLayout ? 'relative' : 'absolute',
              right: usePortraitLayout ? undefined : 25,
              bottom: usePortraitLayout ? undefined : 40 + bottomPadding,
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: Math.round(10 * scale),
              zIndex: 1,
            }}
          >
            {/* Soul Knight has A (attack) and B (roll) buttons */}
            {gameType === 'soulknight' ? (
              <>
                <div style={{ display: 'flex', gap: Math.round(10 * scale) }}>
                  <TouchButton
                    label="B"
                    onPress={handleInteract}
                    size={Math.round(50 * scale)}
                    variant="default"
                  />
                  <TouchButton
                    label="A"
                    onPress={handleAction}
                    size={Math.round(55 * scale)}
                    variant="action"
                  />
                </div>
                <TouchButton
                  label="X"
                  onPress={handleExit}
                  size={Math.round(40 * scale)}
                  variant="exit"
                />
              </>
            ) : (
              <>
                <TouchButton
                  label="GO"
                  onPress={handleAction}
                  size={Math.round(55 * scale)}
                  variant="action"
                />
                <TouchButton
                  label="X"
                  onPress={handleExit}
                  size={Math.round(45 * scale)}
                  variant="exit"
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
