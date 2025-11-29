'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useInputStore } from '@repo/input';

// Canvas dimensions (match Snake for consistency)
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 360;

// Bird physics
const GRAVITY = 0.15;
const FLAP_VELOCITY = -4;
const MAX_FALL_VELOCITY = 4;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const BIRD_X = 80;

// Pipe configuration
const PIPE_WIDTH = 52;
const PIPE_GAP = 140;
const PIPE_SPEED = 2;
const PIPE_SPAWN_INTERVAL = 150; // frames (~2.5 sec at 60fps)
const MIN_PIPE_HEIGHT = 50;

// Ground
const GROUND_HEIGHT = 56;
const GROUND_SCROLL_SPEED = 2; // Match pipe speed

// Colors - Classic Flappy Bird palette
const COLORS = {
  sky: '#4EC0CA',
  skyGradient: '#70C5CE',
  cloud: '#FFFFFF',
  bird: '#F8E81C',
  birdWing: '#F5A623',
  birdBeak: '#FA6900',
  birdEye: '#FFFFFF',
  pipeGreen: '#73BF2E',
  pipeDarkGreen: '#558B2F',
  pipeHighlight: '#8BC34A',
  ground: '#DED895',
  groundGrass: '#73BF2E',
  groundDetail: '#C4B778',
  white: '#FFFFFF',
  black: '#000000',
};

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

type SoundType = 'eat' | 'gameOver' | 'move' | 'start' | 'flap' | 'score';

interface FlappyBirdGameProps {
  isActive: boolean;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  playSound?: (type: SoundType) => void;
}

export function useFlappyBirdGame({ isActive, onScoreChange, onGameOver, canvasRef, playSound }: FlappyBirdGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Bird state refs
  const birdYRef = useRef<number>(CANVAS_HEIGHT / 2);
  const birdVelocityRef = useRef<number>(0);
  const birdRotationRef = useRef<number>(0);

  // Pipes
  const pipesRef = useRef<Pipe[]>([]);

  // Game state refs
  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(0);
  const gameOverRef = useRef<boolean>(false);
  const gameStartedRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(isActive);

  // Animation refs
  const frameCountRef = useRef<number>(0);
  const groundOffsetRef = useRef<number>(0);
  const gameLoopRef = useRef<number | null>(null);
  const wingFrameRef = useRef<number>(0);

  // Get action button from input store
  const action = useInputStore((state) => state.action);
  const actionPrevRef = useRef<boolean>(false);

  // Load high score from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flappybird-high-score');
      if (saved) {
        highScoreRef.current = parseInt(saved, 10) || 0;
      }
    }
  }, []);

  // Keep refs in sync
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Update high score
  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScoreRef.current) {
      highScoreRef.current = newScore;
      if (typeof window !== 'undefined') {
        localStorage.setItem('flappybird-high-score', String(newScore));
      }
    }
  }, []);

  // Flap - apply upward velocity
  const flap = useCallback(() => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
    }
    if (!gameOverRef.current) {
      birdVelocityRef.current = FLAP_VELOCITY;
      playSound?.('flap');
    }
  }, [playSound]);

  // Reset game
  const resetGame = useCallback(() => {
    birdYRef.current = CANVAS_HEIGHT / 2;
    birdVelocityRef.current = 0;
    birdRotationRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    setGameOver(false);
    gameStartedRef.current = false;
    frameCountRef.current = 0;
    groundOffsetRef.current = 0;
    wingFrameRef.current = 0;
    playSound?.('start');
  }, [playSound]);

  // Update bird physics
  const updateBird = useCallback(() => {
    if (!gameStartedRef.current || gameOverRef.current) return;

    // Apply gravity
    birdVelocityRef.current = Math.min(
      birdVelocityRef.current + GRAVITY,
      MAX_FALL_VELOCITY
    );

    // Update position
    birdYRef.current += birdVelocityRef.current;

    // Update rotation based on velocity (-30 to +90 degrees)
    birdRotationRef.current = Math.min(
      Math.max(birdVelocityRef.current * 20, -30),
      90
    );
  }, []);

  // Spawn a new pipe
  const spawnPipe = useCallback(() => {
    const minGapY = MIN_PIPE_HEIGHT + PIPE_GAP / 2;
    const maxGapY = CANVAS_HEIGHT - GROUND_HEIGHT - MIN_PIPE_HEIGHT - PIPE_GAP / 2;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    pipesRef.current.push({
      x: CANVAS_WIDTH,
      gapY,
      passed: false,
    });
  }, []);

  // Update pipes
  const updatePipes = useCallback(() => {
    if (!gameStartedRef.current || gameOverRef.current) return;

    const pipes = pipesRef.current;

    // Move pipes left
    pipes.forEach((pipe) => {
      pipe.x -= PIPE_SPEED;
    });

    // Remove off-screen pipes
    pipesRef.current = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

    // Check for scoring
    pipes.forEach((pipe) => {
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        onScoreChange?.(scoreRef.current);
        playSound?.('score');
      }
    });
  }, [onScoreChange, playSound]);

  // Check collision
  const checkCollision = useCallback((): boolean => {
    const birdY = birdYRef.current;
    const birdLeft = BIRD_X;
    const birdRight = BIRD_X + BIRD_WIDTH;
    const birdTop = birdY;
    const birdBottom = birdY + BIRD_HEIGHT;

    // Ground collision
    if (birdBottom >= CANVAS_HEIGHT - GROUND_HEIGHT) {
      return true;
    }

    // Ceiling collision
    if (birdTop <= 0) {
      return true;
    }

    // Pipe collision
    for (const pipe of pipesRef.current) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;

      // Check if bird is horizontally aligned with pipe
      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Check if bird is outside the gap
        if (birdTop < gapTop || birdBottom > gapBottom) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Draw background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    gradient.addColorStop(0, COLORS.skyGradient);
    gradient.addColorStop(1, COLORS.sky);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    // Clouds
    ctx.fillStyle = COLORS.cloud;

    // Cloud 1
    ctx.beginPath();
    ctx.arc(80, 60, 25, 0, Math.PI * 2);
    ctx.arc(110, 55, 30, 0, Math.PI * 2);
    ctx.arc(140, 60, 25, 0, Math.PI * 2);
    ctx.fill();

    // Cloud 2
    ctx.beginPath();
    ctx.arc(280, 100, 20, 0, Math.PI * 2);
    ctx.arc(305, 95, 25, 0, Math.PI * 2);
    ctx.arc(330, 100, 20, 0, Math.PI * 2);
    ctx.fill();

    // Cloud 3
    ctx.beginPath();
    ctx.arc(180, 40, 15, 0, Math.PI * 2);
    ctx.arc(200, 35, 20, 0, Math.PI * 2);
    ctx.arc(220, 40, 15, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Draw bird
  const drawBird = useCallback((ctx: CanvasRenderingContext2D) => {
    const birdY = birdYRef.current;
    const rotation = birdRotationRef.current;
    const wingFrame = wingFrameRef.current;

    ctx.save();
    ctx.translate(BIRD_X + BIRD_WIDTH / 2, birdY + BIRD_HEIGHT / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-BIRD_WIDTH / 2, -BIRD_HEIGHT / 2);

    // Body (yellow ellipse)
    ctx.fillStyle = COLORS.bird;
    ctx.beginPath();
    ctx.ellipse(BIRD_WIDTH / 2, BIRD_HEIGHT / 2, BIRD_WIDTH / 2, BIRD_HEIGHT / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#D4A017';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing (animated)
    ctx.fillStyle = COLORS.birdWing;
    const wingY = wingFrame % 2 === 0 ? BIRD_HEIGHT / 2 - 4 : BIRD_HEIGHT / 2 + 2;
    ctx.beginPath();
    ctx.ellipse(BIRD_WIDTH / 2 - 4, wingY, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white with black pupil)
    ctx.fillStyle = COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(BIRD_WIDTH - 10, BIRD_HEIGHT / 2 - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.black;
    ctx.beginPath();
    ctx.arc(BIRD_WIDTH - 8, BIRD_HEIGHT / 2 - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = COLORS.birdBeak;
    ctx.beginPath();
    ctx.moveTo(BIRD_WIDTH - 2, BIRD_HEIGHT / 2);
    ctx.lineTo(BIRD_WIDTH + 8, BIRD_HEIGHT / 2 + 2);
    ctx.lineTo(BIRD_WIDTH - 2, BIRD_HEIGHT / 2 + 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, []);

  // Draw a single pipe
  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const gapTop = pipe.gapY - PIPE_GAP / 2;
    const gapBottom = pipe.gapY + PIPE_GAP / 2;
    const capHeight = 26;
    const capOverhang = 4;

    // Top pipe body
    ctx.fillStyle = COLORS.pipeGreen;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, gapTop - capHeight);

    // Top pipe cap
    ctx.fillRect(pipe.x - capOverhang, gapTop - capHeight, PIPE_WIDTH + capOverhang * 2, capHeight);

    // Top pipe highlight
    ctx.fillStyle = COLORS.pipeHighlight;
    ctx.fillRect(pipe.x + 4, 0, 8, gapTop - capHeight);
    ctx.fillRect(pipe.x - capOverhang + 4, gapTop - capHeight, 8, capHeight);

    // Top pipe shadow
    ctx.fillStyle = COLORS.pipeDarkGreen;
    ctx.fillRect(pipe.x + PIPE_WIDTH - 8, 0, 8, gapTop - capHeight);
    ctx.fillRect(pipe.x + PIPE_WIDTH - 4, gapTop - capHeight, 8, capHeight);

    // Bottom pipe body
    ctx.fillStyle = COLORS.pipeGreen;
    ctx.fillRect(pipe.x, gapBottom + capHeight, PIPE_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT - gapBottom - capHeight);

    // Bottom pipe cap
    ctx.fillRect(pipe.x - capOverhang, gapBottom, PIPE_WIDTH + capOverhang * 2, capHeight);

    // Bottom pipe highlight
    ctx.fillStyle = COLORS.pipeHighlight;
    ctx.fillRect(pipe.x + 4, gapBottom + capHeight, 8, CANVAS_HEIGHT - GROUND_HEIGHT - gapBottom - capHeight);
    ctx.fillRect(pipe.x - capOverhang + 4, gapBottom, 8, capHeight);

    // Bottom pipe shadow
    ctx.fillStyle = COLORS.pipeDarkGreen;
    ctx.fillRect(pipe.x + PIPE_WIDTH - 8, gapBottom + capHeight, 8, CANVAS_HEIGHT - GROUND_HEIGHT - gapBottom - capHeight);
    ctx.fillRect(pipe.x + PIPE_WIDTH - 4, gapBottom, 8, capHeight);
  }, []);

  // Draw ground
  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    const offset = groundOffsetRef.current % 24;

    // Grass strip
    ctx.fillStyle = COLORS.groundGrass;
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 12);

    // Ground body
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, groundY + 12, CANVAS_WIDTH, GROUND_HEIGHT - 12);

    // Ground pattern (scrolling)
    ctx.fillStyle = COLORS.groundDetail;
    for (let x = -offset; x < CANVAS_WIDTH + 24; x += 24) {
      ctx.fillRect(x, groundY + 20, 12, 4);
      ctx.fillRect(x + 12, groundY + 32, 12, 4);
    }
  }, []);

  // Draw score
  const drawScore = useCallback((ctx: CanvasRenderingContext2D) => {
    const currentScore = scoreRef.current;

    ctx.fillStyle = COLORS.white;
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 3;
    ctx.font = 'bold 36px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    const scoreText = currentScore.toString();
    ctx.strokeText(scoreText, CANVAS_WIDTH / 2, 50);
    ctx.fillText(scoreText, CANVAS_WIDTH / 2, 50);

    ctx.textAlign = 'left';
  }, []);

  // Draw game over screen
  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D) => {
    const currentScore = scoreRef.current;
    const highScore = highScoreRef.current;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    // Game Over text
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    // Score
    ctx.fillStyle = COLORS.white;
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${currentScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    // High score
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`BEST: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    // Restart prompt (blinking)
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = COLORS.white;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('TAP TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }

    ctx.textAlign = 'left';
  }, []);

  // Draw start screen
  const drawStartScreen = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = COLORS.white;
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 3;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.strokeText('FLAPPY BIRD', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    ctx.fillText('FLAPPY BIRD', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    // Instruction (blinking)
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.strokeText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('TAP TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    ctx.textAlign = 'left';
  }, []);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    drawBackground(ctx);

    // Draw pipes
    pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe));

    // Draw ground (over pipes)
    drawGround(ctx);

    // Draw bird
    drawBird(ctx);

    // Draw score when game started
    if (gameStartedRef.current) {
      drawScore(ctx);
    }

    // Draw game over or start screen
    if (gameOverRef.current) {
      drawGameOver(ctx);
    } else if (!gameStartedRef.current) {
      drawStartScreen(ctx);
    }

    // CRT scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }
  }, [canvasRef, drawBackground, drawBird, drawPipe, drawGround, drawScore, drawGameOver, drawStartScreen]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isActiveRef.current) return;

    frameCountRef.current++;

    // Wing animation (every 8 frames)
    if (frameCountRef.current % 8 === 0) {
      wingFrameRef.current++;
    }

    if (gameStartedRef.current && !gameOverRef.current) {
      // Update bird physics
      updateBird();

      // Update pipes
      updatePipes();

      // Scroll ground
      groundOffsetRef.current += GROUND_SCROLL_SPEED;

      // Spawn pipes
      if (frameCountRef.current % PIPE_SPAWN_INTERVAL === 0) {
        spawnPipe();
      }

      // Check collision
      if (checkCollision()) {
        gameOverRef.current = true;
        setGameOver(true);
        updateHighScore(scoreRef.current);
        playSound?.('gameOver');
        onGameOver?.();
      }
    }

    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updateBird, updatePipes, spawnPipe, checkCollision, draw, updateHighScore, playSound, onGameOver]);

  // Handle action button for flap and restart (edge-triggered)
  useEffect(() => {
    if (!isActive) return;

    // Only trigger on rising edge (false -> true)
    if (action && !actionPrevRef.current) {
      if (gameOverRef.current) {
        resetGame();
      } else {
        flap();
      }
    }
    actionPrevRef.current = action;
  }, [isActive, action, resetGame, flap]);

  // Start/stop game loop
  useEffect(() => {
    if (isActive) {
      resetGame();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [isActive]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  return { score, gameOver, resetGame };
}

// Component that creates and manages the canvas
export function FlappyBirdGame({
  isActive,
  onCanvasReady,
  onScoreChange,
  onGameOver,
  playSound,
}: {
  isActive: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  playSound?: (type: SoundType) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady?.(canvasRef.current);
    }
  }, [onCanvasReady]);

  useFlappyBirdGame({
    isActive,
    onScoreChange,
    onGameOver,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    playSound,
  });

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'none' }} // Hidden - rendered to texture
    />
  );
}

export { CANVAS_WIDTH as FLAPPY_CANVAS_WIDTH, CANVAS_HEIGHT as FLAPPY_CANVAS_HEIGHT };
