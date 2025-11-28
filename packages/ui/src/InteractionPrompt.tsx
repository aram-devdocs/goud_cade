'use client';

import { useGameStore } from '@repo/hooks';

export function InteractionPrompt() {
  const nearCabinet = useGameStore((state) => state.nearCabinet);
  const mode = useGameStore((state) => state.mode);

  if (!nearCabinet || mode !== 'walking') return null;

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
      <div>
        PRESS <span style={{ color: '#ffff00' }}>E</span> TO PLAY
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

