'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore, useArcadeAudio } from '@repo/hooks';
import { useInputStore, TouchControls, useTouchInput } from '@repo/input';
import { InteractionPrompt, GameOverlay } from '@repo/ui';
import { SnakeGame, FlappyBirdGame } from '@repo/games';

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
  // Initialize touch detection BEFORE Game loads to fix race condition
  // This ensures isTouchDevice is set before TouchControls checks visibility
  console.log('[ArcadePage] Calling useTouchInput');
  useTouchInput();

  const mode = useGameStore((state) => state.mode);
  const activeCabinet = useGameStore((state) => state.activeCabinet);
  const stopPlaying = useGameStore((state) => state.stopPlaying);
  const [gameCanvases, setGameCanvases] = useState<Record<string, HTMLCanvasElement | null>>({});
  const [score, setScore] = useState(0);

  // Get input source info for control hints
  const isTouchDevice = useInputStore((state) => state.isTouchDevice);
  const activeSource = useInputStore((state) => state.activeSource);
  const hasGamepad = useInputStore((state) => state.hasGamepad);

  // Initialize arcade audio
  const { playSound } = useArcadeAudio(true);

  // Handle canvas ready from games
  const handleSnakeCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setGameCanvases((prev) => ({ ...prev, 'snake-1': canvas }));
  }, []);

  const handleFlappyCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setGameCanvases((prev) => ({ ...prev, 'flappy-1': canvas }));
  }, []);

  // Check if games are active
  const isSnakeActive = mode === 'playing' && activeCabinet?.id === 'snake-1';
  const isFlappyActive = mode === 'playing' && activeCabinet?.id === 'flappy-1';

  // Get control hints based on input source
  const getWalkingControls = () => {
    if (activeSource === 'gamepad' || hasGamepad) {
      return (
        <>
          <div>Left Stick - Move</div>
          <div>Right Stick - Look</div>
        </>
      );
    }
    if (isTouchDevice && (activeSource === 'touch' || activeSource === null)) {
      return (
        <>
          <div>Joystick - Move</div>
          <div>Drag - Look around</div>
        </>
      );
    }
    return (
      <>
        <div>WASD - Move</div>
        <div>Mouse - Look around</div>
      </>
    );
  };

  const getPlayingControls = () => {
    const isFlappy = activeCabinet?.game === 'flappy';

    if (activeSource === 'gamepad' || hasGamepad) {
      return isFlappy ? (
        <>
          <div>A Button - Flap</div>
          <div>B - Exit Game</div>
        </>
      ) : (
        <>
          <div>D-Pad/Stick - Control Snake</div>
          <div>B - Exit Game</div>
        </>
      );
    }
    if (isTouchDevice && (activeSource === 'touch' || activeSource === null)) {
      return isFlappy ? (
        <>
          <div>Tap Screen - Flap</div>
          <div>X Button - Exit</div>
        </>
      ) : (
        <>
          <div>D-Pad - Control Snake</div>
          <div>X Button - Exit</div>
        </>
      );
    }
    return isFlappy ? (
      <>
        <div>SPACE - Flap</div>
        <div>ESC - Exit Game</div>
      </>
    ) : (
      <>
        <div>Arrow Keys - Control Snake</div>
        <div>ESC - Exit Game</div>
      </>
    );
  };

  // Determine if we should show text hints (hide on touch devices using touch)
  const showTextHints = !(isTouchDevice && (activeSource === 'touch' || activeSource === null));

  return (
    <main className="game-container w-full h-screen relative">
      {/* 3D Scene - uses CSS variable for height in portrait mode */}
      <div
        className="w-full h-game-area portrait:h-game-area landscape:h-screen"
        style={{ paddingTop: 'var(--safe-area-top)' }}
      >
        <Game gameCanvases={gameCanvases} />
      </div>

      {/* UI Overlays */}
      <InteractionPrompt />
      <GameOverlay score={score} />

      {/* Touch Controls - handles its own positioning */}
      <TouchControls
        mode={mode}
        gameType={activeCabinet?.game as 'snake' | 'flappy' | null}
        onExit={stopPlaying}
      />

      {/* Hidden game canvases for texture rendering */}
      <SnakeGame
        isActive={isSnakeActive}
        onCanvasReady={handleSnakeCanvasReady}
        onScoreChange={setScore}
        playSound={playSound}
      />
      <FlappyBirdGame
        isActive={isFlappyActive}
        onCanvasReady={handleFlappyCanvasReady}
        onScoreChange={setScore}
        playSound={playSound}
      />

      {/* Controls hint - only show on non-touch or when using keyboard/gamepad */}
      {/* Positioned above control area in portrait mode */}
      {mode === 'walking' && showTextHints && (
        <div
          className="fixed left-4 text-xs font-arcade text-white/50 space-y-1 portrait:bottom-[calc(var(--control-area-height)+1rem)] landscape:bottom-4"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {getWalkingControls()}
        </div>
      )}

      {mode === 'playing' && showTextHints && (
        <div
          className="fixed left-4 text-xs text-white/50 space-y-1 portrait:bottom-[calc(var(--control-area-height)+1rem)] landscape:bottom-4"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {getPlayingControls()}
        </div>
      )}
    </main>
  );
}
