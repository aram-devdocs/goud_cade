'use client';

import { useGameStore } from '@repo/hooks';
import { useInputStore } from '@repo/input';

interface GameOverlayProps {
  score?: number;
  onExit?: () => void;
}

export function GameOverlay({ score = 0, onExit }: GameOverlayProps) {
  const mode = useGameStore((state) => state.mode);
  const activeCabinet = useGameStore((state) => state.activeCabinet);
  const stopPlaying = useGameStore((state) => state.stopPlaying);
  const isTouchDevice = useInputStore((state) => state.isTouchDevice);
  const activeSource = useInputStore((state) => state.activeSource);

  if (mode !== 'playing' || !activeCabinet) return null;

  const handleExit = () => {
    stopPlaying();
    onExit?.();
  };

  // Get exit button text based on input source
  const getExitText = () => {
    if (isTouchDevice && (activeSource === 'touch' || activeSource === null)) {
      return 'TAP X TO EXIT';
    }
    if (activeSource === 'gamepad') {
      return 'B TO EXIT';
    }
    return 'ESC TO EXIT';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '40px',
        padding: '12px 24px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #ff00ff',
        borderRadius: '8px',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '12px',
        zIndex: 1000,
      }}
    >
      <div style={{ color: '#00ffff' }}>
        {activeCabinet.game.toUpperCase()}
      </div>
      <div style={{ color: '#ffff00' }}>
        SCORE: {score.toString().padStart(6, '0')}
      </div>
      <button
        onClick={handleExit}
        style={{
          background: 'transparent',
          border: '1px solid #ff4444',
          color: '#ff4444',
          padding: '4px 12px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '10px',
        }}
      >
        {getExitText()}
      </button>
    </div>
  );
}
