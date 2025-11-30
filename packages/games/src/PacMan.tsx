'use client';

import { useRef, useEffect, useCallback } from 'react';
import { createPacManGame, PACMAN_CONFIG, type PacManGameInstance } from '@repo/game-definitions';

const CANVAS_WIDTH = PACMAN_CONFIG.canvas.width;
const CANVAS_HEIGHT = PACMAN_CONFIG.canvas.height;

type SoundType = 'eat' | 'gameOver' | 'move' | 'start' | 'flap' | 'score';

interface PacManGameProps {
  isActive: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  playSound?: (type: SoundType) => void;
}

/**
 * Pac-Man game component - React wrapper around ECS game engine.
 * Renders to a hidden canvas that becomes a texture on the arcade cabinet.
 */
export function PacManGame({
  isActive,
  onCanvasReady,
  onScoreChange,
  onGameOver,
  playSound,
}: PacManGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PacManGameInstance | null>(null);

  // Wrapper to convert SoundType to string
  const playSoundWrapper = useCallback((type: string) => {
    playSound?.(type as SoundType);
  }, [playSound]);

  // Create game instance on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const game = createPacManGame({
      canvas: canvasRef.current,
      playSound: playSoundWrapper,
      onScoreChange,
      onGameOver,
    });

    gameRef.current = game;

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [onScoreChange, onGameOver, playSoundWrapper]);

  // Handle activation changes
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    if (isActive) {
      game.start();
    } else {
      game.stop();
    }
  }, [isActive]);

  // Notify when canvas is ready
  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady?.(canvasRef.current);
    }
  }, [onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'none' }}
    />
  );
}

// Legacy hook for backwards compatibility
export function usePacManGame() {
  console.warn('usePacManGame is deprecated. Use PacManGame component directly.');
  return { score: 0, gameOver: false, resetGame: () => {} };
}

export { CANVAS_WIDTH as PACMAN_CANVAS_WIDTH, CANVAS_HEIGHT as PACMAN_CANVAS_HEIGHT };
