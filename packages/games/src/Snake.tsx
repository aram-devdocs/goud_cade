'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useInputStore, type Direction } from '@repo/input';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 360;
const GRID_SIZE = 20;
const CELL_SIZE = CANVAS_WIDTH / GRID_SIZE;
const INITIAL_SPEED = 150; // ms per move

interface Point {
  x: number;
  y: number;
}

type SoundType = 'eat' | 'gameOver' | 'move' | 'start';

interface SnakeGameProps {
  isActive: boolean;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  playSound?: (type: SoundType) => void;
}

export function useSnakeGame({ isActive, onScoreChange, onGameOver, canvasRef, playSound }: SnakeGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Game state refs (to avoid stale closures in animation loop)
  const snakeRef = useRef<Point[]>([{ x: 10, y: 9 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>({ x: 15, y: 9 });
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const lastInputDirectionRef = useRef<Direction | null>(null);

  // Visual effect refs
  const flashRef = useRef<number>(0); // Timestamp for food eating flash effect
  const highScoreRef = useRef<number>(0); // High score for persistence

  // Get input from unified input store
  const inputDirection = useInputStore((state) => state.direction);
  const action = useInputStore((state) => state.action);

  // Load high score from localStorage on init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snake-high-score');
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

  // Generate random food position
  const generateFood = useCallback((): Point => {
    const snake = snakeRef.current;
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / CELL_SIZE)),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 9 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    foodRef.current = generateFood();
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    setGameOver(false);
    lastMoveRef.current = performance.now(); // Use current time for proper restart timing
    lastInputDirectionRef.current = null;
    playSound?.('start'); // Play start jingle
  }, [generateFood, playSound]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScore = scoreRef.current;
    const currentGameOver = gameOverRef.current;
    const highScore = highScoreRef.current;

    // Clear canvas with dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Flash effect when eating food
    const flashAge = Date.now() - flashRef.current;
    if (flashAge < 100) {
      ctx.fillStyle = `rgba(0, 255, 0, ${0.3 * (1 - flashAge / 100)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw outer border (bright green, glowing)
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    ctx.shadowBlur = 0;

    // Draw inner border for depth
    ctx.strokeStyle = '#005500';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);

    // Draw grid (subtle but visible)
    ctx.strokeStyle = '#0f2f0f';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT / CELL_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    const snake = snakeRef.current;
    const currentDirection = directionRef.current;
    snake.forEach((segment, index) => {
      const isHead = index === 0;

      // Gradient from bright green (head) to darker green (tail)
      const brightness = 1 - (index / snake.length) * 0.6;
      const green = Math.floor(255 * brightness);

      ctx.fillStyle = isHead ? '#00ff00' : `rgb(0, ${green}, 0)`;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      // Head glow effect and eyes
      if (isHead) {
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillRect(
          segment.x * CELL_SIZE + 1,
          segment.y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
        ctx.shadowBlur = 0;

        // Draw eyes based on direction
        ctx.fillStyle = '#000000';
        const eyeSize = 3;
        const eyeOffset = 4;
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;

        switch (currentDirection) {
          case 'UP':
            ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            break;
          case 'DOWN':
            ctx.fillRect(x + eyeOffset, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'LEFT':
            ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(x + eyeOffset, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'RIGHT':
            ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        }
      }
    });

    // Draw food
    const food = foodRef.current;
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw score and high score
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${currentScore}`, 10, 22);
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`HI: ${highScore}`, CANVAS_WIDTH - 100, 22);

    // CRT scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    // Game over screen
    if (currentGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Pulsing effect for GAME OVER text
      const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

      // GAME OVER with glow
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20 * pulse;
      ctx.fillStyle = '#ff0000';
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.shadowBlur = 0;

      // Final score with yellow highlight
      ctx.fillStyle = '#ffff00';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${currentScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      // High score
      ctx.fillStyle = '#00ffff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`HIGH SCORE: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

      // Blinking restart prompt
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO PLAY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
      }

      ctx.textAlign = 'left';
    }
  }, [canvasRef]);

  // Calculate current speed based on score (gets faster as score increases)
  const getCurrentSpeed = useCallback(() => {
    const currentScore = scoreRef.current;
    // Decrease by 5ms for every 50 points, minimum 80ms
    return Math.max(80, INITIAL_SPEED - Math.floor(currentScore / 50) * 5);
  }, []);

  // Update high score and save to localStorage
  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScoreRef.current) {
      highScoreRef.current = newScore;
      if (typeof window !== 'undefined') {
        localStorage.setItem('snake-high-score', String(newScore));
      }
    }
  }, []);

  // Game loop - stable reference using refs
  const gameLoop = useCallback((timestamp: number) => {
    if (!isActiveRef.current) return;

    // Move snake at dynamic intervals based on score (only if not game over)
    const currentSpeed = getCurrentSpeed();
    if (timestamp - lastMoveRef.current >= currentSpeed && !gameOverRef.current) {
      lastMoveRef.current = timestamp;

      // Update direction
      directionRef.current = nextDirectionRef.current;

      const snake = snakeRef.current;
      const firstSegment = snake[0];
      if (firstSegment) {
        const head: Point = { x: firstSegment.x, y: firstSegment.y };

        // Move head
        switch (directionRef.current) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check wall collision
        const maxY = Math.floor(CANVAS_HEIGHT / CELL_SIZE);
        const hitWall = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= maxY;

        // Check self collision
        const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);

        if (hitWall || hitSelf) {
          // Game over - but don't return, keep RAF running for restart
          gameOverRef.current = true;
          setGameOver(true);
          updateHighScore(scoreRef.current);
          playSound?.('gameOver');
          onGameOver?.();
        } else {
          // Play movement sound
          playSound?.('move');

          // Add new head
          snake.unshift(head);

          // Check food collision
          const food = foodRef.current;
          if (head.x === food.x && head.y === food.y) {
            flashRef.current = Date.now(); // Trigger flash effect
            playSound?.('eat');
            const newScore = scoreRef.current + 10;
            scoreRef.current = newScore;
            setScore(newScore);
            onScoreChange?.(newScore);
            foodRef.current = generateFood();
            // Don't pop - snake grows!
          } else {
            // Remove tail if no food eaten
            snake.pop();
          }
        }
      }
    }

    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [draw, generateFood, getCurrentSpeed, updateHighScore, playSound, onGameOver, onScoreChange]);

  // Handle direction input from unified input system
  useEffect(() => {
    if (!isActive || !inputDirection) return;

    const currentDir = directionRef.current;

    // Only accept direction if it's different from the last one we processed
    // This prevents double-inputs from the same direction
    if (inputDirection === lastInputDirectionRef.current) return;

    // Validate direction (can't reverse into self)
    let isValid = false;
    switch (inputDirection) {
      case 'UP':
        isValid = currentDir !== 'DOWN';
        break;
      case 'DOWN':
        isValid = currentDir !== 'UP';
        break;
      case 'LEFT':
        isValid = currentDir !== 'RIGHT';
        break;
      case 'RIGHT':
        isValid = currentDir !== 'LEFT';
        break;
    }

    if (isValid) {
      nextDirectionRef.current = inputDirection;
      lastInputDirectionRef.current = inputDirection;
    }
  }, [isActive, inputDirection]);

  // Handle action button for restart
  useEffect(() => {
    if (!isActive) return;

    if (action && gameOverRef.current) {
      resetGame();
    }
  }, [isActive, action, resetGame]);

  // Start/stop game loop - only depends on isActive
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
export function SnakeGame({
  isActive,
  onCanvasReady,
  onScoreChange,
  onGameOver,
  playSound
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

  useSnakeGame({ isActive, onScoreChange, onGameOver, canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>, playSound });

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'none' }} // Hidden - rendered to texture
    />
  );
}

export { CANVAS_WIDTH as SNAKE_CANVAS_WIDTH, CANVAS_HEIGHT as SNAKE_CANVAS_HEIGHT };
