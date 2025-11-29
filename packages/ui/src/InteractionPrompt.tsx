'use client';

import { useGameStore } from '@repo/hooks';
import { useInputStore } from '@repo/input';

export function InteractionPrompt() {
  const nearCabinet = useGameStore((state) => state.nearCabinet);
  const mode = useGameStore((state) => state.mode);
  const isTouchDevice = useInputStore((state) => state.isTouchDevice);
  const activeSource = useInputStore((state) => state.activeSource);

  if (!nearCabinet || mode !== 'walking') return null;

  // Determine which prompt to show based on input source
  const getInteractPrompt = () => {
    if (isTouchDevice && (activeSource === 'touch' || activeSource === null)) {
      return (
        <>
          TAP <span style={{ color: '#00ffff' }}>E</span> TO PLAY
        </>
      );
    }
    if (activeSource === 'gamepad') {
      return (
        <>
          PRESS <span style={{ color: '#00ff00' }}>A</span> TO PLAY
        </>
      );
    }
    // Default keyboard
    return (
      <>
        PRESS <span style={{ color: '#ffff00' }}>E</span> TO PLAY
      </>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '16px 32px',
        background: 'rgba(0, 0, 0, 0.85)',
        border: '2px solid #00ff88',
        borderRadius: '8px',
        color: '#00ff88',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '14px',
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
        zIndex: 1000,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ marginBottom: '8px', color: '#ffffff' }}>
        {nearCabinet.game.toUpperCase()}
      </div>
      <div>{getInteractPrompt()}</div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
