'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore, useArcadeAudio } from '@repo/hooks';
import { InteractionPrompt, GameOverlay } from '@repo/ui';
import { SnakeGame } from '@repo/games';

// Dynamically import the 3D scene to avoid SSR issues with Three.js
const Game = dynamic(
  () => import('@repo/scene').then((mod) => mod.Game),
  { 
    ssr: false,
    loading: () => (
      <div className="loading-screen">
        <div className="loading-text text-2xl mb-4">LOADING...</div>
        <div className="text-sm text-arcade-pink">Initializing arcade</div>
      </div>
    ),
  }
);

export default function ArcadePage() {
  const mode = useGameStore((state) => state.mode);
  const activeCabinet = useGameStore((state) => state.activeCabinet);
  const [gameCanvases, setGameCanvases] = useState<Record<string, HTMLCanvasElement | null>>({});
  const [score, setScore] = useState(0);

  // Initialize arcade audio
  const { playSound } = useArcadeAudio(true);

  // Handle canvas ready from games
  const handleSnakeCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setGameCanvases((prev) => ({ ...prev, 'snake-1': canvas }));
  }, []);

  // Check if snake game is active
  const isSnakeActive = mode === 'playing' && activeCabinet?.id === 'snake-1';

  return (
    <main className="game-container w-full h-screen relative">
      {/* 3D Scene */}
      <Game gameCanvases={gameCanvases} />
      
      {/* UI Overlays */}
      <InteractionPrompt />
      <GameOverlay score={score} />
      
      {/* Hidden game canvases for texture rendering */}
      <SnakeGame
        isActive={isSnakeActive}
        onCanvasReady={handleSnakeCanvasReady}
        onScoreChange={setScore}
        playSound={playSound}
      />
      
      {/* Controls hint */}
      {mode === 'walking' && (
        <div 
          className="fixed bottom-4 left-4 text-xs font-arcade text-white/50 space-y-1"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          <div>WASD - Move</div>
          <div>Mouse - Look around</div>
        </div>
      )}
      
      {mode === 'playing' && (
        <div 
          className="fixed bottom-4 left-4 text-xs text-white/50 space-y-1"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          <div>Arrow Keys - Control Snake</div>
          <div>ESC - Exit Game</div>
        </div>
      )}
    </main>
  );
}

