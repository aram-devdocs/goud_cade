'use client';

import { useRef, useEffect, useCallback } from 'react';
import { createSoulKnightGame, SOUL_KNIGHT_CONFIG, type SoulKnightGameInstance } from '@repo/game-definitions';

const CANVAS_WIDTH = SOUL_KNIGHT_CONFIG.canvas.width;
const CANVAS_HEIGHT = SOUL_KNIGHT_CONFIG.canvas.height;

type SoundType = 'eat' | 'gameOver' | 'move' | 'start' | 'attack' | 'hit' | 'kill' | 'damage' | 'roll' | 'wave';

interface SoulKnightGameProps {
  isActive: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  playSound?: (type: SoundType) => void;
}

/**
 * Soul Knight game component - React wrapper around ECS game engine.
 * Renders to a hidden canvas that becomes a texture on the arcade cabinet.
 */
export function SoulKnightGame({
  isActive,
  onCanvasReady,
  onScoreChange,
  onGameOver,
  playSound,
}: SoulKnightGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SoulKnightGameInstance | null>(null);

  // Wrapper to convert SoundType to string
  const playSoundWrapper = useCallback((type: string) => {
    playSound?.(type as SoundType);
  }, [playSound]);

  // Create game instance on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const game = createSoulKnightGame({
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
export function useSoulKnightGame() {
  console.warn('useSoulKnightGame is deprecated. Use SoulKnightGame component directly.');
  return { score: 0, gameOver: false, resetGame: () => {} };
}

export { CANVAS_WIDTH as SOUL_KNIGHT_CANVAS_WIDTH, CANVAS_HEIGHT as SOUL_KNIGHT_CANVAS_HEIGHT };
